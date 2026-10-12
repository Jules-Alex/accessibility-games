import { createBrowserAudioPort, createNoiseBuffer, startDegraded } from './web-audio';

class FakeParam {
  value = 0;
  events: { kind: 'set' | 'ramp'; value: number; time: number }[] = [];
  setValueAtTime(value: number, time: number): void {
    this.events.push({ kind: 'set', value, time });
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.events.push({ kind: 'ramp', value, time });
  }
}

class FakeNode {
  connections: unknown[] = [];
  connect(target: unknown): unknown {
    this.connections.push(target);
    return target;
  }
}

class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  started: number[] = [];
  stopped = 0;
  onended: (() => void) | null = null;
  start(time = 0): void {
    this.started.push(time);
  }
  stop(): void {
    this.stopped += 1;
  }
}

class FakeFilter extends FakeNode {
  type = '';
  frequency = new FakeParam();
  Q = new FakeParam();
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeContext {
  currentTime = 10;
  sampleRate = 8000;
  destination = new FakeNode();
  sources: FakeSource[] = [];
  filters: FakeFilter[] = [];
  gains: FakeGain[] = [];
  createBufferSource(): FakeSource {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  createBiquadFilter(): FakeFilter {
    const f = new FakeFilter();
    this.filters.push(f);
    return f;
  }
  createGain(): FakeGain {
    const g = new FakeGain();
    this.gains.push(g);
    return g;
  }
  createBuffer(channels: number, length: number, rate: number) {
    const data = new Float32Array(length);
    return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData: () => data };
  }
}

const voice = { duration: 4 } as unknown as AudioBuffer;
const noiseBuffer = { duration: 2 } as unknown as AudioBuffer;

function setup(dropouts = [{ start: 1, length: 0.3 }]) {
  const ctx = new FakeContext();
  const handle = startDegraded(
    ctx as unknown as AudioContext,
    voice,
    { cutoffHz: 900, noiseGain: 0.06, dropouts },
    noiseBuffer,
  );
  return { ctx, handle };
}

describe('startDegraded', () => {
  it('étouffe la voix avec un filtre passe-bas à 900 Hz', () => {
    const { ctx } = setup();
    expect(ctx.sources[0].buffer).toBe(voice);
    const lowpass = ctx.filters[0];
    expect(lowpass.type).toBe('lowpass');
    expect(lowpass.frequency.value).toBe(900);
    expect(ctx.sources[0].connections).toEqual([lowpass]);
  });

  it('démarre la voix et le souffle ensemble, juste après l\'instant courant', () => {
    const { ctx } = setup();
    expect(ctx.sources[0].started).toHaveLength(1);
    expect(ctx.sources[0].started[0]).toBeCloseTo(10.05, 5);
    expect(ctx.sources[1].started).toHaveLength(1);
    expect(ctx.sources[1].started[0]).toBeCloseTo(10.05, 5);
  });

  it('ajoute un souffle de fond en boucle, filtré et discret', () => {
    const { ctx } = setup();
    const breath = ctx.sources[1];
    expect(breath.buffer).toBe(noiseBuffer);
    expect(breath.loop).toBe(true);
    const noiseGain = ctx.gains[1];
    expect(noiseGain.gain.value).toBe(0.06);
    expect(ctx.filters[1].type).toBe('lowpass');
    expect(breath.connections).toEqual([ctx.filters[1]]);
    expect(ctx.filters[1].connections).toEqual([noiseGain]);
    expect(noiseGain.connections).toEqual([ctx.destination]);
  });

  it('relie la voix filtrée à la sortie en passant par le gain des coupures', () => {
    const { ctx } = setup();
    const cuts = ctx.gains[0];
    expect(ctx.filters[0].connections).toEqual([cuts]);
    expect(cuts.connections).toEqual([ctx.destination]);
  });

  it('programme chaque coupure : le volume tombe à 0 puis revient, aux instants prévus', () => {
    const { ctx } = setup([{ start: 1, length: 0.3 }]);
    const events = ctx.gains[0].gain.events;
    expect(events[0]).toMatchObject({ kind: 'set', value: 1 });
    expect(events[0].time).toBeCloseTo(10.05, 5);
    const down = events.filter((e) => e.value === 0);
    const up = events.filter((e) => e.kind === 'ramp' && e.value === 1);
    expect(down.length).toBeGreaterThanOrEqual(1);
    expect(down[0].time).toBeCloseTo(11.05, 1);
    expect(up).toHaveLength(1);
    expect(up[0].time).toBeCloseTo(11.35, 1);
    const times = events.map((e) => e.time);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('sans coupure, le volume reste à 1', () => {
    const { ctx } = setup([]);
    expect(ctx.gains[0].gain.events).toHaveLength(1);
    expect(ctx.gains[0].gain.events[0]).toMatchObject({ kind: 'set', value: 1 });
  });

  it('se termine à la fin de la voix et arrête aussi le souffle', async () => {
    const { ctx, handle } = setup();
    ctx.sources[0].onended?.();
    await expect(handle.ended).resolves.toBeUndefined();
    expect(ctx.sources[1].stopped).toBe(1);
  });

  it('stop arrête la voix et le souffle et termine la lecture', async () => {
    const { ctx, handle } = setup();
    handle.stop();
    await expect(handle.ended).resolves.toBeUndefined();
    expect(ctx.sources[0].stopped).toBe(1);
    expect(ctx.sources[1].stopped).toBe(1);
  });
});

describe('createNoiseBuffer', () => {
  it('crée 2 secondes de bruit entre -1 et 1', () => {
    const ctx = new FakeContext();
    const buffer = createNoiseBuffer(ctx as unknown as AudioContext, () => 0.75);
    expect(buffer.length).toBe(16000);
    const data = buffer.getChannelData(0);
    expect(data[0]).toBeCloseTo(0.5, 5);
    expect(Math.max(...Array.from(data.slice(0, 100)))).toBeLessThanOrEqual(1);
  });
});

describe('createBrowserAudioPort', () => {
  it('renvoie null quand Web Audio n\'existe pas (jsdom, vieux navigateur) : le jeu passe en transcription', () => {
    expect(createBrowserAudioPort()).toBeNull();
  });
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('createBrowserAudioPort avec un faux Web Audio', () => {
  const win = window as unknown as { AudioContext?: unknown };
  const realFetch = (globalThis as { fetch?: unknown }).fetch;
  let contexts: BrowserFakeContext[];
  let decoding: Deferred<{ duration: number }> | null;
  let resumeBehavior: 'ok' | 'hang';
  let decodeCount: number;
  let fetchMock: jest.Mock;

  class BrowserFakeContext extends FakeContext {
    resumeCount = 0;
    constructor() {
      super();
      contexts.push(this);
    }
    resume(): Promise<void> {
      this.resumeCount += 1;
      return resumeBehavior === 'hang' ? new Promise<void>(() => undefined) : Promise.resolve();
    }
    decodeAudioData(): Promise<{ duration: number }> {
      decodeCount += 1;
      return decoding ? decoding.promise : Promise.resolve({ duration: 4 });
    }
  }

  const okResponse = { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) };

  beforeEach(() => {
    contexts = [];
    decoding = null;
    resumeBehavior = 'ok';
    decodeCount = 0;
    fetchMock = jest.fn(() => Promise.resolve(okResponse));
    win.AudioContext = BrowserFakeContext;
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
  });

  afterEach(() => {
    delete win.AudioContext;
    (globalThis as { fetch?: unknown }).fetch = realFetch;
    jest.useRealTimers();
  });

  function port(): NonNullable<ReturnType<typeof createBrowserAudioPort>> {
    const p = createBrowserAudioPort(() => 0.5);
    if (!p) {
      throw new Error('le port devrait exister avec un faux AudioContext');
    }
    return p;
  }

  it('load renvoie la durée de l\'extrait décodé', async () => {
    await expect(port().load('a.wav')).resolves.toBe(4);
  });

  it('load ne télécharge ni ne décode deux fois le même extrait', async () => {
    const p = port();
    await p.load('a.wav');
    await p.load('a.wav');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decodeCount).toBe(1);
    await p.load('b.wav');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('load échoue quand le fichier est introuvable (404)', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }));
    await expect(port().load('absent.wav')).rejects.toThrow('absent.wav');
  });

  it('play appelle resume() tout de suite, avant la fin du téléchargement (geste de l\'utilisateur)', async () => {
    const download = deferred<typeof okResponse>();
    fetchMock.mockImplementation(() => download.promise);
    const p = port();
    const playing = p.play('a.wav');
    expect(contexts).toHaveLength(1);
    expect(contexts[0].resumeCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    p.stop();
    download.resolve(okResponse);
    await playing;
  });

  it('play puis stop avant la fin du décodage : rien ne démarre et play se termine', async () => {
    decoding = deferred<{ duration: number }>();
    const p = port();
    const playing = p.play('a.wav');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(decodeCount).toBe(1);
    p.stop();
    decoding.resolve({ duration: 4 });
    await expect(playing).resolves.toBeUndefined();
    expect(contexts[0].sources).toHaveLength(0);
  });

  it('une seconde lecture remplace la première : seule la dernière démarre', async () => {
    decoding = deferred<{ duration: number }>();
    const p = port();
    const first = p.play('a.wav');
    const second = p.play('a.wav');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    decoding.resolve({ duration: 4 });
    await first;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    // voix + souffle de la seule lecture restante
    expect(contexts[0].sources).toHaveLength(2);
    contexts[0].sources[0].onended?.();
    await expect(second).resolves.toBeUndefined();
  });

  it('play démarre le son dégradé et se termine à la fin de la voix', async () => {
    const p = port();
    const playing = p.play('a.wav');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const ctx = contexts[0];
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[0].started).toHaveLength(1);
    ctx.sources[0].onended?.();
    await expect(playing).resolves.toBeUndefined();
  });

  it('play échoue si resume() ne répond jamais (Safari sans geste) : le jeu passe en transcription', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    resumeBehavior = 'hang';
    const p = port();
    const outcome = p.play('a.wav').then(
      () => 'resolu',
      (error: Error) => error.message,
    );
    await jest.advanceTimersByTimeAsync(1499);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(2);
    await expect(outcome).resolves.toMatch(/refus/);
    expect(contexts[0].sources).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('play ne laisse aucun minuteur en attente quand tout se passe bien', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    const p = port();
    const playing = p.play('a.wav');
    await jest.advanceTimersByTimeAsync(0);
    expect(jest.getTimerCount()).toBe(0);
    contexts[0].sources[0].onended?.();
    await playing;
  });
});

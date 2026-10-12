import { Degradation, degradationFor } from './audio-degradation';
import type { AudioPort } from './audio-port';

export interface PlayingHandle {
  /** Résout à la fin de la voix ou à l'arrêt. */
  ended: Promise<void>;
  stop(): void;
}

/** Durée de la rampe qui évite le « clic » au début et à la fin d'une coupure. */
const RAMP = 0.015;
/** Léger retard au démarrage pour que les automations soient en place. */
const LEAD = 0.05;
/** Au-delà, une reprise du contexte audio qui ne répond pas est considérée comme refusée. */
const RESUME_TIMEOUT_MS = 1500;

/**
 * Lance `resume()` tout de suite (il doit partir pendant le geste de l'utilisateur, Safari l'exige) et renvoie une
 * promesse qui échoue si la reprise est refusée ou ne répond pas à temps. `cancel` libère le minuteur.
 */
function resumeWithTimeout(ctx: AudioContext): { done: Promise<void>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const done = new Promise<void>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Lecture audio refusée par le navigateur')), RESUME_TIMEOUT_MS);
    ctx.resume().then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
  // Évite un rejet « non géré » si la lecture est abandonnée avant qu'on n'attende cette promesse.
  done.catch(() => undefined);
  return { done, cancel: () => clearTimeout(timer) };
}

/** Deux secondes de bruit blanc, bouclées pour le souffle. */
export function createNoiseBuffer(ctx: AudioContext, rng: () => number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = rng() * 2 - 1;
  }
  return buffer;
}

/**
 * Voix → passe-bas → volume (coupures) → sortie ; souffle (bruit bouclé) → passe-bas → volume → sortie.
 * Les coupures sont des rampes du volume vers 0 puis de retour à 1.
 */
export function startDegraded(ctx: AudioContext, voice: AudioBuffer, degradation: Degradation, noise: AudioBuffer): PlayingHandle {
  const t0 = ctx.currentTime + LEAD;

  const speech = ctx.createBufferSource();
  speech.buffer = voice;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = degradation.cutoffHz;
  lowpass.Q.value = 0.7;
  const cuts = ctx.createGain();
  cuts.gain.setValueAtTime(1, t0);
  for (const d of degradation.dropouts) {
    cuts.gain.setValueAtTime(1, t0 + d.start);
    cuts.gain.linearRampToValueAtTime(0, t0 + d.start + RAMP);
    cuts.gain.setValueAtTime(0, t0 + d.start + d.length);
    cuts.gain.linearRampToValueAtTime(1, t0 + d.start + d.length + RAMP);
  }
  speech.connect(lowpass);
  lowpass.connect(cuts);
  cuts.connect(ctx.destination);

  const breath = ctx.createBufferSource();
  breath.buffer = noise;
  breath.loop = true;
  const breathFilter = ctx.createBiquadFilter();
  breathFilter.type = 'lowpass';
  breathFilter.frequency.value = 3500;
  const breathGain = ctx.createGain();
  breathGain.gain.value = degradation.noiseGain;
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(ctx.destination);

  let finish: () => void = () => undefined;
  const ended = new Promise<void>((resolve) => {
    finish = resolve;
  });
  speech.onended = () => {
    breath.stop();
    finish();
  };

  speech.start(t0);
  breath.start(t0);

  return {
    ended,
    stop: () => {
      speech.stop();
      breath.stop();
      finish();
    },
  };
}

/** Port Web Audio du navigateur ; `null` si l'API n'existe pas. */
export function createBrowserAudioPort(rng: () => number = Math.random): AudioPort | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const api = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = api.AudioContext ?? api.webkitAudioContext;
  if (!Ctor) {
    return null;
  }

  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let current: PlayingHandle | null = null;
  /** Compte les arrêts : une lecture demandée avant un arrêt ne doit pas démarrer après. */
  let generation = 0;
  const buffers = new Map<string, AudioBuffer>();

  const context = (): AudioContext => (ctx ??= new Ctor());

  const load = async (url: string): Promise<AudioBuffer> => {
    const cached = buffers.get(url);
    if (cached) {
      return cached;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Extrait introuvable : ${url}`);
    }
    const decoded = await context().decodeAudioData(await response.arrayBuffer());
    buffers.set(url, decoded);
    return decoded;
  };

  return {
    load: async (url) => (await load(url)).duration,
    play: async (url) => {
      generation += 1;
      const mine = generation;
      current?.stop();
      const c = context();
      // Synchrone, avant tout `await` : on est encore dans le geste de l'utilisateur.
      const resumed = resumeWithTimeout(c);
      try {
        const buffer = await load(url);
        await resumed.done;
        if (mine !== generation) {
          return;
        }
        noise ??= createNoiseBuffer(c, rng);
        const handle = startDegraded(c, buffer, degradationFor(buffer.duration, rng), noise);
        current = handle;
        await handle.ended;
      } finally {
        resumed.cancel();
      }
    },
    stop: () => {
      generation += 1;
      current?.stop();
      current = null;
    },
  };
}

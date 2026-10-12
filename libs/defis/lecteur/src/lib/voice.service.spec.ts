import { TestBed } from '@angular/core/testing';
import { VOICE_PORT, VoicePort, VoiceService } from './voice.service';

interface FakePort extends VoicePort {
  spoken: { text: string; voice: string | null }[];
  cancelled: number;
  finish(index: number): void;
  setVoices(v: { lang: string; name: string }[]): void;
}

function fakePort(initial: { lang: string; name: string }[]): FakePort {
  let voices = initial;
  let listener: () => void = () => undefined;
  const resolvers: (() => void)[] = [];
  const port: FakePort = {
    spoken: [],
    cancelled: 0,
    voices: () => voices,
    speak: (text, voice) =>
      new Promise<void>((resolve) => {
        port.spoken.push({ text, voice });
        resolvers.push(resolve);
      }),
    cancel: () => {
      port.cancelled += 1;
    },
    onVoicesChanged: (l) => {
      listener = l;
    },
    finish: (index) => resolvers[index](),
    setVoices: (v) => {
      voices = v;
      listener();
    },
  };
  return port;
}

function service(port: VoicePort | null): VoiceService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: VOICE_PORT, useValue: port }] });
  return TestBed.inject(VoiceService);
}

describe('VoiceService', () => {
  afterEach(() => jest.useRealTimers());

  it('n\'a pas de voix quand l\'API est absente', () => {
    expect(service(null).available()).toBe(false);
  });

  it('n\'a pas de voix quand aucune voix française n\'est installée', () => {
    expect(service(fakePort([{ lang: 'en-US', name: 'Alex' }])).available()).toBe(false);
  });

  it('reconnaît une voix française quelle que soit la graphie de la langue', () => {
    for (const lang of ['fr-FR', 'fr_CA', 'FR-fr', 'fr']) {
      expect(service(fakePort([{ lang, name: 'Voix' }])).available()).toBe(true);
    }
  });

  it('détecte une voix qui arrive plus tard (voiceschanged)', () => {
    const port = fakePort([]);
    const s = service(port);
    expect(s.available()).toBe(false);
    port.setVoices([{ lang: 'fr-FR', name: 'Amelie' }]);
    expect(s.available()).toBe(true);
  });

  it('lit un texte avec la voix française et signale la lecture en cours', async () => {
    const port = fakePort([{ lang: 'fr-FR', name: 'Amelie' }]);
    const s = service(port);
    s.speak('bouton');
    expect(port.spoken).toEqual([{ text: 'bouton', voice: 'Amelie' }]);
    expect(s.speaking()).toBe(true);
    expect(s.lastText()).toBe('bouton');
    port.finish(0);
    await Promise.resolve();
    expect(s.speaking()).toBe(false);
  });

  it('coupe la phrase en cours avant d\'en lire une autre, sans que l\'ancienne ne coupe la nouvelle', async () => {
    const port = fakePort([{ lang: 'fr-FR', name: 'Amelie' }]);
    const s = service(port);
    s.speak('première');
    s.speak('seconde');
    expect(port.cancelled).toBeGreaterThanOrEqual(1);
    port.finish(0);
    await Promise.resolve();
    expect(s.speaking()).toBe(true);
    port.finish(1);
    await Promise.resolve();
    expect(s.speaking()).toBe(false);
  });

  it('sans voix : garde le texte pour les sous-titres et simule la durée de lecture', () => {
    jest.useFakeTimers();
    const s = service(fakePort([]));
    s.speak('Liste de documents. Trois éléments.');
    expect(s.speaking()).toBe(true);
    expect(s.lastText()).toBe('Liste de documents. Trois éléments.');
    jest.advanceTimersByTime(1199);
    expect(s.speaking()).toBe(true);
    jest.advanceTimersByTime(1000);
    expect(s.speaking()).toBe(false);
  });

  it('sans API du tout, speak ne plante pas', () => {
    jest.useFakeTimers();
    const s = service(null);
    expect(() => s.speak('bouton')).not.toThrow();
    expect(s.lastText()).toBe('bouton');
  });

  it('répète la dernière phrase', () => {
    const port = fakePort([{ lang: 'fr-FR', name: 'Amelie' }]);
    const s = service(port);
    s.speak('image');
    s.repeat();
    expect(port.spoken.map((p) => p.text)).toEqual(['image', 'image']);
  });

  it('ne répète rien avant la première phrase', () => {
    const port = fakePort([{ lang: 'fr-FR', name: 'Amelie' }]);
    service(port).repeat();
    expect(port.spoken).toEqual([]);
  });

  it('cancel coupe la voix et la lecture en cours', () => {
    const port = fakePort([{ lang: 'fr-FR', name: 'Amelie' }]);
    const s = service(port);
    s.speak('bouton');
    const before = port.cancelled;
    s.cancel();
    expect(port.cancelled).toBe(before + 1);
    expect(s.speaking()).toBe(false);
  });
});

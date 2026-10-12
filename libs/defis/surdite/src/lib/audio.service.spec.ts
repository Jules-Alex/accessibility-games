import { TestBed } from '@angular/core/testing';
import { AUDIO_PORT, AudioPort } from './audio-port';
import { AudioService } from './audio.service';

interface FakePort extends AudioPort {
  loads: string[];
  plays: string[];
  stops: number;
  finish(): void;
  failLoad: boolean;
  failPlay: boolean;
}

function fakePort(): FakePort {
  let pending: (() => void)[] = [];
  const port: FakePort = {
    loads: [],
    plays: [],
    stops: 0,
    failLoad: false,
    failPlay: false,
    load: (url) => {
      port.loads.push(url);
      return port.failLoad ? Promise.reject(new Error('introuvable')) : Promise.resolve(4.2);
    },
    play: (url) => {
      port.plays.push(url);
      if (port.failPlay) {
        return Promise.reject(new Error('refusé'));
      }
      return new Promise<void>((resolve) => pending.push(resolve));
    },
    stop: () => {
      port.stops += 1;
      pending.forEach((r) => r());
      pending = [];
    },
    finish: () => {
      pending.forEach((r) => r());
      pending = [];
    },
  };
  return port;
}

function service(port: AudioPort | null): AudioService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: AUDIO_PORT, useValue: port }] });
  return TestBed.inject(AudioService);
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('AudioService', () => {
  it('précharge un extrait et renvoie sa durée', async () => {
    const port = fakePort();
    const s = service(port);
    await expect(s.preload('a.wav')).resolves.toBe(4.2);
    expect(port.loads).toEqual(['a.wav']);
    expect(s.failed()).toBe(false);
  });

  it('signale un échec de chargement sans lever d\'erreur', async () => {
    const port = fakePort();
    port.failLoad = true;
    const s = service(port);
    await expect(s.preload('a.wav')).resolves.toBe(0);
    expect(s.failed()).toBe(true);
  });

  it('signale un échec quand Web Audio n\'existe pas (port nul)', async () => {
    const s = service(null);
    await expect(s.preload('a.wav')).resolves.toBe(0);
    expect(s.failed()).toBe(true);
    await s.play('a.wav');
    expect(s.playing()).toBe(false);
  });

  it('joue un extrait : playing vaut vrai jusqu\'à la fin de la lecture', async () => {
    const port = fakePort();
    const s = service(port);
    const done = s.play('a.wav');
    expect(port.plays).toEqual(['a.wav']);
    expect(s.playing()).toBe(true);
    port.finish();
    await done;
    expect(s.playing()).toBe(false);
  });

  it('signale un échec de lecture (lecture refusée) et ne reste pas bloqué en « lecture »', async () => {
    const port = fakePort();
    port.failPlay = true;
    const s = service(port);
    await s.play('a.wav');
    expect(s.failed()).toBe(true);
    expect(s.playing()).toBe(false);
  });

  it('stop coupe la lecture ; la fin tardive de l\'ancienne ne coupe pas la nouvelle', async () => {
    const port = fakePort();
    const s = service(port);
    const first = s.play('a.wav');
    s.stop();
    expect(s.playing()).toBe(false);
    const second = s.play('b.wav');
    await first;
    await tick();
    expect(s.playing()).toBe(true);
    port.finish();
    await second;
    expect(s.playing()).toBe(false);
  });

  it('reset arrête le son et efface l\'échec', async () => {
    const port = fakePort();
    port.failLoad = true;
    const s = service(port);
    await s.preload('a.wav');
    expect(s.failed()).toBe(true);
    s.reset();
    expect(s.failed()).toBe(false);
    expect(port.stops).toBeGreaterThanOrEqual(1);
  });
});

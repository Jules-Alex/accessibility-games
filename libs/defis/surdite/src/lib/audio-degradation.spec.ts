import { CUTOFF_HZ, NOISE_GAIN, degradationFor, planDropouts } from './audio-degradation';

describe('planDropouts', () => {
  it('ne coupe pas les extraits trop courts (moins de 2 secondes)', () => {
    expect(planDropouts(1.9, () => 0.5)).toEqual([]);
    expect(planDropouts(0, () => 0.5)).toEqual([]);
  });

  it('prévoit une coupure par tranche de 2 secondes, au plus 4', () => {
    expect(planDropouts(2, () => 0.5)).toHaveLength(1);
    expect(planDropouts(4.5, () => 0.5)).toHaveLength(2);
    expect(planDropouts(6, () => 0.5)).toHaveLength(3);
    expect(planDropouts(30, () => 0.5)).toHaveLength(4);
  });

  it('chaque coupure dure quelques centaines de millisecondes (150 à 450 ms)', () => {
    for (const r of [0, 0.5, 0.999]) {
      for (const d of planDropouts(6, () => r)) {
        expect(d.length).toBeGreaterThanOrEqual(0.15 - 1e-9);
        expect(d.length).toBeLessThanOrEqual(0.45 + 1e-9);
      }
    }
  });

  it('les coupures restent dans l\'extrait, hors des 0,4 s de début et de fin, triées et sans chevauchement', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      for (const duration of [2, 3.3, 4.5, 6, 8.2]) {
        const cuts = planDropouts(duration, () => r);
        let previousEnd = 0;
        for (const c of cuts) {
          expect(c.start).toBeGreaterThanOrEqual(0.4 - 1e-9);
          expect(c.start + c.length).toBeLessThanOrEqual(duration - 0.4 + 1e-9);
          expect(c.start).toBeGreaterThanOrEqual(previousEnd + 0.04);
          previousEnd = c.start + c.length;
        }
      }
    }
  });

  it('dépend du générateur aléatoire (emplacements différents d\'une écoute à l\'autre)', () => {
    const a = planDropouts(6, () => 0.1);
    const b = planDropouts(6, () => 0.9);
    expect(a[0].start).not.toBeCloseTo(b[0].start, 2);
  });
});

describe('degradationFor', () => {
  it('combine le filtre passe-bas, le souffle et les coupures', () => {
    const d = degradationFor(4, () => 0.5);
    expect(d.cutoffHz).toBe(CUTOFF_HZ);
    expect(d.noiseGain).toBe(NOISE_GAIN);
    expect(d.dropouts).toEqual(planDropouts(4, () => 0.5));
  });

  it('étouffe la voix : coupure du filtre sous 1 kHz, souffle discret', () => {
    expect(CUTOFF_HZ).toBeLessThan(1000);
    expect(NOISE_GAIN).toBeGreaterThan(0);
    expect(NOISE_GAIN).toBeLessThan(0.2);
  });
});

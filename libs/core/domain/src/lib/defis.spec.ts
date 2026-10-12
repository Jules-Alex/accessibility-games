import { DEFIS, DEFI_IDS, getDefiMeta, isDefiId, parseDefiId } from './defis';

describe('defis', () => {
  it('définit les cinq défis dans l\'ordre', () => {
    expect(DEFIS.map((d) => d.id)).toEqual([1, 2, 3, 4, 5]);
    expect(DEFI_IDS).toEqual([1, 2, 3, 4, 5]);
  });

  it('a des paramètres cohérents', () => {
    for (const d of DEFIS) {
      expect(d.stepsTotal).toBeGreaterThan(0);
      expect(d.perseverantThreshold).toBeGreaterThan(0);
      expect(d.perseverantThreshold).toBeLessThanOrEqual(d.stepsTotal);
      expect(d.durationMs).toBe(120_000);
    }
  });

  it('retrouve un défi par identifiant', () => {
    expect(getDefiMeta(3).stepsTotal).toBe(4);
    expect(getDefiMeta(1).masterLabel).toBe('Maître du zoom');
  });

  it('reconnaît les identifiants valides', () => {
    expect(isDefiId(1)).toBe(true);
    expect(isDefiId(6)).toBe(false);
    expect(isDefiId('1')).toBe(false);
  });

  it('analyse un paramètre de route', () => {
    expect(parseDefiId('2')).toBe(2);
    expect(parseDefiId(' 4 ')).toBe(4);
    expect(parseDefiId('0')).toBeNull();
    expect(parseDefiId('abc')).toBeNull();
    expect(parseDefiId('')).toBeNull();
    expect(parseDefiId(null)).toBeNull();
    expect(parseDefiId('1.5')).toBeNull();
  });

  it('calcule le badge sur les points pour les défis 4 et 5 seulement', () => {
    expect(DEFIS.filter((d) => d.badgeBasis === 'points').map((d) => d.id)).toEqual([4, 5]);
    expect(DEFIS.filter((d) => d.badgeBasis === 'steps').map((d) => d.id)).toEqual([1, 2, 3]);
  });
});

import { formatMmSs, gaugePercent, isLastSeconds } from './time';

describe('time', () => {
  it('formate en mm:ss en arrondissant à la seconde supérieure', () => {
    expect(formatMmSs(120_000)).toBe('02:00');
    expect(formatMmSs(86_000)).toBe('01:26');
    expect(formatMmSs(85_001)).toBe('01:26');
    expect(formatMmSs(1)).toBe('00:01');
    expect(formatMmSs(0)).toBe('00:00');
  });

  it('gère les valeurs négatives ou invalides', () => {
    expect(formatMmSs(-500)).toBe('00:00');
    expect(formatMmSs(Number.NaN)).toBe('00:00');
  });

  it('calcule le remplissage de la jauge', () => {
    expect(gaugePercent(60_000, 120_000)).toBe(50);
    expect(gaugePercent(0, 120_000)).toBe(0);
    expect(gaugePercent(200_000, 120_000)).toBe(100);
    expect(gaugePercent(-1, 120_000)).toBe(0);
    expect(gaugePercent(10, 0)).toBe(0);
  });

  it('repère les 20 dernières secondes', () => {
    expect(isLastSeconds(20_000)).toBe(true);
    expect(isLastSeconds(20_001)).toBe(false);
    expect(isLastSeconds(1)).toBe(true);
    expect(isLastSeconds(0)).toBe(false);
  });
});

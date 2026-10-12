import { makeResult, isDefiResult, isAbandoned } from './results';

describe('results', () => {
  it('crée un résultat valide', () => {
    expect(makeResult(1, 'termine', 5, 50)).toEqual({ defiId: 1, outcome: 'termine', stepsDone: 5, points: 50 });
  });

  it('borne les étapes au nombre d\'étapes du défi', () => {
    expect(makeResult(3, 'termine', 9, 90).stepsDone).toBe(4);
    expect(makeResult(3, 'expire', -2, 0).stepsDone).toBe(0);
  });

  it('neutralise les valeurs non numériques', () => {
    const r = makeResult(2, 'expire', Number.NaN, Number.NaN);
    expect(r.stepsDone).toBe(0);
    expect(r.points).toBe(0);
  });

  it('arrondit et borne les points', () => {
    expect(makeResult(1, 'expire', 2, 12.6).points).toBe(13);
    expect(makeResult(1, 'expire', 2, -5).points).toBe(0);
  });

  it('reconnaît un résultat bien formé', () => {
    expect(isDefiResult({ defiId: 2, outcome: 'expire', stepsDone: 1, points: 10 })).toBe(true);
    expect(isDefiResult({ defiId: 9, outcome: 'expire', stepsDone: 1, points: 10 })).toBe(false);
    expect(isDefiResult({ defiId: 2, outcome: 'nope', stepsDone: 1, points: 10 })).toBe(false);
    expect(isDefiResult(null)).toBe(false);
    expect(isDefiResult('x')).toBe(false);
  });

  it('détecte l\'abandon', () => {
    expect(isAbandoned(makeResult(1, 'abandonne', 1, 10))).toBe(true);
    expect(isAbandoned(makeResult(1, 'expire', 1, 10))).toBe(false);
  });
});

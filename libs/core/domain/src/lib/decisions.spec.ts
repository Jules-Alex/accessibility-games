import { Decision, TIER_ICON, decisionPoints, decisionsScore, tierFor } from './decisions';

const dec = (step: number, result: Decision['result']): Decision => ({ step, result, choice: `c${step}`, sentence: `s${step}` });

describe('decisionPoints', () => {
  it('10 points si réussie, 5 si partielle, 0 si ratée', () => {
    expect(decisionPoints('reussi')).toBe(10);
    expect(decisionPoints('partiel')).toBe(5);
    expect(decisionPoints('rate')).toBe(0);
  });
});

describe('decisionsScore', () => {
  it('compte 1 par décision réussie, une demi par décision partielle', () => {
    expect(decisionsScore([])).toBe(0);
    expect(decisionsScore([dec(0, 'reussi'), dec(1, 'rate'), dec(2, 'reussi'), dec(3, 'partiel'), dec(4, 'rate')])).toBe(2.5);
    expect(decisionsScore([0, 1, 2, 3, 4].map((s) => dec(s, 'reussi')))).toBe(5);
  });
});

describe('tierFor', () => {
  it('5 sur 5 : vert', () => {
    expect(tierFor(5, 5)).toBe('vert');
  });

  it('3 à 4 sur 5 : jaune', () => {
    for (const score of [3, 3.5, 4]) {
      expect(tierFor(score, 5)).toBe('jaune');
    }
  });

  it('1 à 2 sur 5 (et les demi-points) : orange', () => {
    for (const score of [0.5, 1, 2, 2.5]) {
      expect(tierFor(score, 5)).toBe('orange');
    }
  });

  it('0 : rouge', () => {
    expect(tierFor(0, 5)).toBe('rouge');
  });

  it('s\'adapte à un nombre d\'étapes réduit (proportions) et à un total vide', () => {
    expect(tierFor(3, 3)).toBe('vert');
    expect(tierFor(2, 3)).toBe('jaune');
    expect(tierFor(1, 3)).toBe('orange');
    expect(tierFor(0, 3)).toBe('rouge');
    expect(tierFor(0, 0)).toBe('rouge');
  });

  it('associe une icône à chaque palier', () => {
    expect(TIER_ICON).toEqual({ vert: '🟢', jaune: '🟡', orange: '🟠', rouge: '🔴' });
  });
});

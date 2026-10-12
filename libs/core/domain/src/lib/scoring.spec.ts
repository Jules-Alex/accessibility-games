import { makeResult } from './results';
import { abandonedIds, describeProgress, playedCount, pointsForSteps, totalPoints } from './scoring';

const results = [
  makeResult(1, 'termine', 5, 50),
  makeResult(2, 'expire', 3, 30),
  makeResult(3, 'abandonne', 1, 10),
  makeResult(5, 'abandonne', 0, 0),
];

describe('scoring', () => {
  it('compte 10 points par étape', () => {
    expect(pointsForSteps(3)).toBe(30);
    expect(pointsForSteps(-1)).toBe(0);
    expect(pointsForSteps(2.9)).toBe(20);
  });

  it('additionne les points de tous les défis', () => {
    expect(totalPoints(results)).toBe(90);
    expect(totalPoints([])).toBe(0);
  });

  it('compte les défis joués et abandonnés', () => {
    expect(playedCount(results)).toBe(2);
    expect(abandonedIds(results)).toEqual([3, 5]);
  });

  it('trie les défis abandonnés', () => {
    expect(abandonedIds([makeResult(4, 'abandonne', 0, 0), makeResult(2, 'abandonne', 0, 0)])).toEqual([2, 4]);
  });

  it('décrit la progression avec les accords', () => {
    expect(describeProgress(4, 1)).toBe('4 défis joués sur 5 · 1 défi abandonné');
    expect(describeProgress(1, 4)).toBe('1 défi joué sur 5 · 4 défis abandonnés');
    expect(describeProgress(5, 0)).toBe('5 défis joués sur 5 · aucun défi abandonné');
    expect(describeProgress(0, 5)).toBe('0 défi joué sur 5 · 5 défis abandonnés');
  });
});

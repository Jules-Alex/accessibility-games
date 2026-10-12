import { shuffle } from './random';

describe('shuffle', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('renvoie une permutation sans modifier la liste d\'origine', () => {
    const out = shuffle(list, () => 0);
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
    expect(out).not.toBe(list);
  });

  it('dépend du générateur aléatoire (ordres différents)', () => {
    const orders = new Set<string>();
    for (const r of [0, 0.3, 0.6, 0.99]) {
      orders.add(shuffle(list, () => r).join(''));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it('gère une liste d\'un seul élément ou vide', () => {
    expect(shuffle(['x'], () => 0.5)).toEqual(['x']);
    expect(shuffle([], () => 0.5)).toEqual([]);
  });

  it('peut placer chaque élément à chaque position', () => {
    const seenFirst = new Set<string>();
    for (let k = 0; k < 1000; k++) {
      seenFirst.add(shuffle(list, Math.random)[0]);
    }
    expect(seenFirst.size).toBe(4);
  });
});

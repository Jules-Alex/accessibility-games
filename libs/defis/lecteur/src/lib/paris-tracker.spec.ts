import { ParisTracker } from './paris-tracker';

describe('ParisTracker', () => {
  it('démarre à zéro', () => {
    const t = new ParisTracker();
    expect(t.wins()).toBe(0);
    expect(t.total()).toBe(0);
    expect(t.expected()).toBe(0);
  });

  it('compte les paris gagnés et perdus', () => {
    const t = new ParisTracker();
    t.record(3, true);
    t.record(4, false);
    t.record(2, true);
    expect(t.total()).toBe(3);
    expect(t.wins()).toBe(2);
  });

  it('calcule le nombre de réussites attendu par pur hasard, arrondi', () => {
    const t = new ParisTracker();
    t.record(3, false);
    t.record(4, false);
    t.record(2, false);
    expect(t.expected()).toBe(1);
    t.record(2, false);
    t.record(2, false);
    expect(t.expected()).toBe(2);
  });

  it('se remet à zéro', () => {
    const t = new ParisTracker();
    t.record(3, true);
    t.reset();
    expect(t.total()).toBe(0);
    expect(t.wins()).toBe(0);
    expect(t.expected()).toBe(0);
  });
});

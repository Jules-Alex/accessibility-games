import { DefiTimer } from './defi-timer';

describe('DefiTimer', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  it('décompte puis expire', () => {
    const t = new DefiTimer();
    t.start(2000);
    expect(t.remainingMs()).toBe(2000);
    expect(t.running()).toBe(true);
    expect(t.expired()).toBe(false);
    jest.advanceTimersByTime(1000);
    expect(t.remainingMs()).toBe(1000);
    jest.advanceTimersByTime(1000);
    expect(t.remainingMs()).toBe(0);
    expect(t.running()).toBe(false);
    expect(t.expired()).toBe(true);
  });

  it('expire au retour d\'un onglet resté en arrière-plan', () => {
    const t = new DefiTimer();
    t.start(60_000);
    jest.setSystemTime(Date.now() + 5 * 60_000);
    jest.advanceTimersByTime(250);
    expect(t.remainingMs()).toBe(0);
    expect(t.expired()).toBe(true);
  });

  it('ne passe pas à « expiré » quand on l\'arrête avant la fin', () => {
    const t = new DefiTimer();
    t.start(10_000);
    jest.advanceTimersByTime(3000);
    t.stop();
    expect(t.running()).toBe(false);
    expect(t.expired()).toBe(false);
    expect(t.remainingMs()).toBe(7000);
    jest.advanceTimersByTime(10_000);
    expect(t.remainingMs()).toBe(7000);
  });

  it('redémarre proprement', () => {
    const t = new DefiTimer();
    t.start(1000);
    jest.advanceTimersByTime(1000);
    expect(t.expired()).toBe(true);
    t.start(5000);
    expect(t.expired()).toBe(false);
    expect(t.remainingMs()).toBe(5000);
    expect(t.totalMs()).toBe(5000);
  });

  it('ne démarre pas pour une durée nulle ou négative', () => {
    const t = new DefiTimer();
    t.start(0);
    expect(t.running()).toBe(false);
    expect(t.expired()).toBe(false);
  });
});

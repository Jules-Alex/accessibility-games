import { DefiSession } from './defi-session';

describe('DefiSession', () => {
  it('démarre à zéro après configuration', () => {
    const s = new DefiSession();
    s.configure(5);
    expect(s.stepsTotal()).toBe(5);
    expect(s.stepsDone()).toBe(0);
    expect(s.points()).toBe(0);
    expect(s.currentStep()).toBe(1);
    expect(s.allDone()).toBe(false);
    expect(s.gain()).toBeNull();
  });

  it('valide une étape avec 10 points par défaut et signale le gain', () => {
    const s = new DefiSession();
    s.configure(3);
    s.completeStep();
    expect(s.stepsDone()).toBe(1);
    expect(s.points()).toBe(10);
    expect(s.currentStep()).toBe(2);
    expect(s.gain()).toEqual({ id: 1, amount: 10 });
    s.completeStep(5);
    expect(s.points()).toBe(15);
    expect(s.gain()).toEqual({ id: 2, amount: 5 });
  });

  it('termine quand toutes les étapes sont validées et ignore les validations en trop', () => {
    const s = new DefiSession();
    s.configure(2);
    s.completeStep();
    s.completeStep();
    expect(s.allDone()).toBe(true);
    expect(s.currentStep()).toBe(2);
    s.completeStep();
    expect(s.stepsDone()).toBe(2);
    expect(s.points()).toBe(20);
  });

  it('ne fait rien avant la configuration', () => {
    const s = new DefiSession();
    s.completeStep();
    expect(s.stepsDone()).toBe(0);
    expect(s.allDone()).toBe(false);
  });

  it('se réinitialise à la reconfiguration', () => {
    const s = new DefiSession();
    s.configure(2);
    s.completeStep();
    s.configure(4);
    expect(s.stepsDone()).toBe(0);
    expect(s.points()).toBe(0);
    expect(s.gain()).toBeNull();
  });

  it('valide une étape sans point ni gain avec completeStep(0)', () => {
    const s = new DefiSession();
    s.configure(2);
    s.completeStep(0);
    expect(s.stepsDone()).toBe(1);
    expect(s.points()).toBe(0);
    expect(s.gain()).toBeNull();
    s.completeStep(10);
    expect(s.gain()).toEqual({ id: 1, amount: 10 });
  });

  it('cumule des points cachés : comptés dans finalPoints, jamais dans points ni dans le gain', () => {
    const s = new DefiSession();
    s.configure(3);
    s.addHiddenPoints(10);
    s.completeStep(0);
    s.addHiddenPoints(5);
    s.completeStep(0);
    expect(s.points()).toBe(0);
    expect(s.gain()).toBeNull();
    expect(s.hiddenPoints()).toBe(15);
    expect(s.finalPoints()).toBe(15);
    s.completeStep(10);
    expect(s.points()).toBe(10);
    expect(s.finalPoints()).toBe(25);
  });

  it('remet les points cachés à zéro quand on reconfigure', () => {
    const s = new DefiSession();
    s.configure(2);
    s.addHiddenPoints(20);
    s.configure(2);
    expect(s.hiddenPoints()).toBe(0);
    expect(s.finalPoints()).toBe(0);
  });
});

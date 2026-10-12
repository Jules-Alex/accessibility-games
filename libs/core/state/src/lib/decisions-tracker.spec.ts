import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DecisionsTracker } from './decisions-tracker';

const info = (n: number) => ({ result: 'reussi' as const, choice: `choix ${n}`, sentence: `phrase ${n}` });

@Injectable({ providedIn: 'root' })
class TrackerA extends DecisionsTracker {}

@Injectable({ providedIn: 'root' })
class TrackerB extends DecisionsTracker {}

describe('DecisionsTracker', () => {
  it('démarre vide et non joué', () => {
    const t = new DecisionsTracker();
    expect(t.decisions()).toEqual([]);
    expect(t.played()).toBe(false);
  });

  it('enregistre les décisions et les range par étape', () => {
    const t = new DecisionsTracker();
    t.record(2, info(2));
    t.record(0, info(0));
    expect(t.decisions().map((d) => d.step)).toEqual([0, 2]);
    expect(t.decisions()[0]).toEqual({ step: 0, ...info(0) });
  });

  it('ignore une deuxième décision pour la même étape', () => {
    const t = new DecisionsTracker();
    t.record(1, info(1));
    t.record(1, { result: 'rate', choice: 'autre', sentence: 'autre' });
    expect(t.decisions()).toHaveLength(1);
    expect(t.decisions()[0].result).toBe('reussi');
  });

  it('vaut « joué » après reset, jamais après un simple enregistrement', () => {
    const t = new DecisionsTracker();
    t.record(0, info(0));
    expect(t.played()).toBe(false);
    t.reset();
    expect(t.played()).toBe(true);
  });

  it('se remet à zéro', () => {
    const t = new DecisionsTracker();
    t.record(0, info(0));
    t.reset();
    expect(t.decisions()).toEqual([]);
  });

  it('chaque service dérivé a sa propre instance : un défi ne voit pas les décisions d\'un autre', () => {
    TestBed.resetTestingModule();
    const a = TestBed.inject(TrackerA);
    const b = TestBed.inject(TrackerB);
    a.reset();
    a.record(0, info(0));
    expect(a).not.toBe(b);
    expect(b.decisions()).toEqual([]);
    expect(b.played()).toBe(false);
  });
});

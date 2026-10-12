import { TestBed } from '@angular/core/testing';
import { RANDOM } from './random';

describe('RANDOM', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('fournit Math.random par défaut', () => {
    expect(TestBed.inject(RANDOM)).toBe(Math.random);
  });

  it('peut être remplacé (valeur fixe dans les tests)', () => {
    TestBed.configureTestingModule({ providers: [{ provide: RANDOM, useValue: () => 0.25 }] });
    expect(TestBed.inject(RANDOM)()).toBe(0.25);
  });
});

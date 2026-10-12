import { InjectionToken } from '@angular/core';

/** Générateur aléatoire injectable (remplacé par une valeur fixe dans les tests). */
export const RANDOM = new InjectionToken<() => number>('AG_RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});

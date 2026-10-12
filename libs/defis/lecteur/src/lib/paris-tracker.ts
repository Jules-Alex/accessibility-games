import { Injectable, computed, signal } from '@angular/core';

/** Compte les paris du défi (chaque choix parmi plusieurs options) pour l'écran de fin. */
@Injectable({ providedIn: 'root' })
export class ParisTracker {
  readonly wins = signal(0);
  readonly total = signal(0);
  private readonly expectedSum = signal(0);

  /** Nombre de réussites que le hasard seul donnerait, arrondi. */
  readonly expected = computed(() => Math.round(this.expectedSum()));

  reset(): void {
    this.wins.set(0);
    this.total.set(0);
    this.expectedSum.set(0);
  }

  record(options: number, won: boolean): void {
    this.total.update((n) => n + 1);
    if (won) {
      this.wins.update((n) => n + 1);
    }
    this.expectedSum.update((s) => s + 1 / options);
  }
}

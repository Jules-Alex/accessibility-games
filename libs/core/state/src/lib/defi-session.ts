import { Injectable, computed, signal } from '@angular/core';
import { GainEvent, POINTS_PER_STEP } from '@ag/domain';

/** Avancement du défi en cours ; les composants de jeu appellent `completeStep()` à chaque étape réussie. */
@Injectable()
export class DefiSession {
  readonly stepsTotal = signal(0);
  readonly stepsDone = signal(0);
  readonly points = signal(0);
  readonly gain = signal<GainEvent | null>(null);
  /** Points gagnés mais non montrés pendant le défi (défi 4 : ils diraient si le choix était bon), révélés au résultat. */
  readonly hiddenPoints = signal(0);
  readonly finalPoints = computed(() => this.points() + this.hiddenPoints());

  readonly currentStep = computed(() => Math.min(this.stepsDone() + 1, Math.max(this.stepsTotal(), 1)));
  readonly allDone = computed(() => this.stepsTotal() > 0 && this.stepsDone() >= this.stepsTotal());

  private gainCounter = 0;

  configure(stepsTotal: number): void {
    this.stepsTotal.set(stepsTotal);
    this.stepsDone.set(0);
    this.points.set(0);
    this.hiddenPoints.set(0);
    this.gain.set(null);
    this.gainCounter = 0;
  }

  completeStep(points: number = POINTS_PER_STEP): void {
    if (this.stepsTotal() === 0 || this.allDone()) {
      return;
    }
    this.stepsDone.update((n) => n + 1);
    this.points.update((p) => p + points);
    if (points > 0) {
      // Une étape sans point n'anime pas de « +0 ».
      this.gainCounter += 1;
      this.gain.set({ id: this.gainCounter, amount: points });
    }
  }

  addHiddenPoints(points: number): void {
    if (this.stepsTotal() === 0 || this.allDone()) {
      return;
    }
    this.hiddenPoints.update((p) => p + points);
  }
}

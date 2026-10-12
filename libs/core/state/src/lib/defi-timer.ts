import { Injectable, OnDestroy, computed, signal } from '@angular/core';

const TICK_MS = 250;

/**
 * Compte à rebours calculé sur l'horloge (et non sur le nombre de ticks) :
 * un onglet en arrière-plan ou un ordinateur en veille expire correctement au retour.
 */
@Injectable()
export class DefiTimer implements OnDestroy {
  readonly totalMs = signal(0);
  readonly remainingMs = signal(0);
  readonly running = signal(false);
  readonly expired = computed(() => this.totalMs() > 0 && this.remainingMs() === 0 && !this.running());

  private endAt = 0;
  private handle: ReturnType<typeof setInterval> | null = null;

  start(durationMs: number): void {
    this.stop();
    if (!(durationMs > 0)) {
      return;
    }
    this.totalMs.set(durationMs);
    this.remainingMs.set(durationMs);
    this.endAt = Date.now() + durationMs;
    this.running.set(true);
    this.handle = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.handle !== null) {
      clearInterval(this.handle);
      this.handle = null;
    }
    this.running.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private tick(): void {
    const remaining = Math.max(0, this.endAt - Date.now());
    this.remainingMs.set(remaining);
    if (remaining === 0) {
      this.stop();
    }
  }
}

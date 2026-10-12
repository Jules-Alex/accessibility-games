import { Injectable, signal } from '@angular/core';

/** Alternative pour un participant réellement malentendant : affiche la transcription de chaque message. */
@Injectable({ providedIn: 'root' })
export class AlternativeMode {
  readonly enabled = signal(false);

  toggle(): void {
    this.enabled.update((v) => !v);
  }

  enable(): void {
    this.enabled.set(true);
  }
}

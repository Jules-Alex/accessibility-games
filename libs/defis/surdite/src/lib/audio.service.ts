import { Injectable, inject, signal } from '@angular/core';
import { AUDIO_PORT } from './audio-port';

/**
 * Enveloppe le port audio : lecture en cours, échec (le jeu passe alors en transcription) et protection contre
 * la fin tardive d'une lecture arrêtée.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly port = inject(AUDIO_PORT);
  private token = 0;

  readonly playing = signal(false);
  /** Vrai quand le son n'a pas pu être chargé ou joué (API absente, fichier introuvable, lecture refusée). */
  readonly failed = signal(false);

  /** Charge l'extrait à l'avance ; renvoie sa durée en secondes, 0 en cas d'échec. */
  async preload(url: string): Promise<number> {
    if (!this.port) {
      this.failed.set(true);
      return 0;
    }
    try {
      return await this.port.load(url);
    } catch {
      this.failed.set(true);
      return 0;
    }
  }

  async play(url: string): Promise<void> {
    if (!this.port) {
      this.failed.set(true);
      return;
    }
    this.stop();
    const id = ++this.token;
    this.playing.set(true);
    try {
      await this.port.play(url);
    } catch {
      if (id === this.token) {
        this.failed.set(true);
      }
    } finally {
      if (id === this.token) {
        this.playing.set(false);
      }
    }
  }

  stop(): void {
    this.token += 1;
    this.port?.stop();
    this.playing.set(false);
  }

  /** Nouvelle partie : arrête le son et efface un éventuel échec précédent. */
  reset(): void {
    this.stop();
    this.failed.set(false);
  }
}

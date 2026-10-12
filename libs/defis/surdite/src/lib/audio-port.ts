import { InjectionToken } from '@angular/core';
import { createBrowserAudioPort } from './web-audio';

export interface AudioPort {
  /** Charge et décode l'extrait ; renvoie sa durée en secondes. */
  load(url: string): Promise<number>;
  /** Joue l'extrait dégradé ; résout à la fin de la lecture (ou quand elle est arrêtée). */
  play(url: string): Promise<void>;
  stop(): void;
}

/** `null` quand Web Audio n'existe pas : le jeu passe alors en transcription. */
export const AUDIO_PORT = new InjectionToken<AudioPort | null>('AG_AUDIO_PORT', {
  providedIn: 'root',
  factory: () => createBrowserAudioPort(),
});

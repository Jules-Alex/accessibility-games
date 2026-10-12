import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';

export interface VoicePort {
  voices(): readonly { lang: string; name: string }[];
  /** Résout à la fin de la lecture (ou à son annulation). */
  speak(text: string, voiceName: string | null): Promise<void>;
  cancel(): void;
  onVoicesChanged(listener: () => void): void;
}

/** Enveloppe `speechSynthesis` ; `null` quand l'API n'existe pas (le jeu passe alors en sous-titres). */
export function createBrowserVoicePort(): VoicePort | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return null;
  }
  const synth = window.speechSynthesis;
  // Chrome peut ramasser l'énoncé en cours avant `onend` : on le garde référencé jusqu'au suivant.
  let current: SpeechSynthesisUtterance | null = null;
  return {
    voices: () => synth.getVoices().map((v) => ({ lang: v.lang, name: v.name })),
    speak: (text, voiceName) =>
      new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        current = utterance;
        utterance.lang = 'fr-FR';
        const voice = voiceName ? synth.getVoices().find((v) => v.name === voiceName) : undefined;
        if (voice) {
          utterance.voice = voice;
        }
        const done = () => {
          if (current === utterance) {
            current = null;
          }
          resolve();
        };
        utterance.onend = done;
        utterance.onerror = done;
        synth.speak(utterance);
      }),
    cancel: () => synth.cancel(),
    onVoicesChanged: (listener) => synth.addEventListener('voiceschanged', listener),
  };
}

export const VOICE_PORT = new InjectionToken<VoicePort | null>('AG_VOICE_PORT', {
  providedIn: 'root',
  factory: createBrowserVoicePort,
});

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private readonly port = inject(VOICE_PORT);
  private readonly frenchVoice = signal<string | null>(null);
  private token = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Vrai quand une voix française est disponible ; sinon le jeu affiche des sous-titres. */
  readonly available = computed(() => this.frenchVoice() !== null);
  readonly speaking = signal(false);
  /** Dernière phrase lue : sert à la répétition (touche R) et aux sous-titres. */
  readonly lastText = signal('');

  constructor() {
    this.refreshVoices();
    this.port?.onVoicesChanged(() => this.refreshVoices());
  }

  speak(text: string): void {
    this.cancel();
    const id = ++this.token;
    this.lastText.set(text);
    this.speaking.set(true);
    const finish = () => {
      if (id === this.token) {
        this.speaking.set(false);
      }
    };
    const voice = this.frenchVoice();
    if (this.port && voice) {
      void this.port.speak(text, voice).then(finish);
    } else {
      // Sans voix : la « lecture » dure le temps de lire la phrase, pour animer l'onde et laisser lire les sous-titres.
      this.timer = setTimeout(finish, Math.max(1200, text.length * 55));
    }
  }

  repeat(): void {
    const text = this.lastText();
    if (text) {
      this.speak(text);
    }
  }

  cancel(): void {
    this.token += 1;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.port?.cancel();
    this.speaking.set(false);
  }

  private refreshVoices(): void {
    const french = this.port?.voices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('fr'));
    this.frenchVoice.set(french ? french.name : null);
  }
}

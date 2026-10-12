import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { shuffle } from '@ag/domain';
import { DefiSession, RANDOM } from '@ag/state';
import { Item, STEPS, StepDef, isValidEmail, moveCursor } from './lecteur-content';
import { ParisTracker } from './paris-tracker';
import { VoiceService } from './voice.service';

const CONSEQUENCE_MS = 4000;

/**
 * Faux écran noir lu par une voix de synthèse. Le modèle de la « page » est virtuel : une liste d'éléments par
 * étape (mélangée à chaque tentative), parcourue avec Tab/flèches, activée avec Entrée/Espace, répétée avec R.
 * Les libellés pauvres (« bouton », « image », « lien, cliquez ici ») sont le piège, pas un bug.
 */
@Component({
  selector: 'ag-lecteur-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="zone" role="region" aria-label="Zone audio du défi (écran masqué)" tabindex="0" (keydown)="onKey($event)">
      <div class="ecran">
        <span class="casque" aria-hidden="true">🎧</span>
        <div class="onde" [class.onde--active]="voice.speaking()" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <p class="texte">Écran masqué — écoutez et naviguez</p>
        <p class="touches">Tab ou flèches : naviguer · Entrée : activer · R : répéter</p>
        <p class="consequence" role="status">
          @if (consequence()) {
            💥 {{ consequence() }} L'étape recommence.
          }
        </p>
        @if (!voice.available() && voice.lastText()) {
          <p class="sous-titres">Sous-titres : {{ voice.lastText() }}</p>
        }
      </div>

      @if (step(); as s) {
        <ul class="liste" hidden>
          @for (it of items(); track it.id) {
            <li [attr.data-id]="it.id" [attr.data-active]="$index === cursor()">{{ it.spoken }}</li>
          }
        </ul>
        @if (s.kind === 'text') {
          <input class="champ" type="text" autocomplete="off" tabindex="-1" [value]="email()" (input)="email.set(valueOf($event))" (blur)="onFieldBlur()" />
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .zone { min-height: 340px; display: grid; place-items: center; background: #000; color: #9ca3af; border: 3px solid #475569; border-radius: 10px; padding: 16px; text-align: center; }
    .ecran { display: grid; gap: 8px; justify-items: center; }
    .casque { font-size: 40px; }
    .onde { display: flex; gap: 4px; align-items: center; height: 28px; }
    .onde span { width: 5px; height: 6px; background: #38bdf8; border-radius: 3px; }
    .onde--active span { animation: onde 1s ease-in-out infinite; }
    .onde--active span:nth-child(2) { animation-delay: 0.15s; }
    .onde--active span:nth-child(3) { animation-delay: 0.3s; }
    .onde--active span:nth-child(4) { animation-delay: 0.45s; }
    .onde--active span:nth-child(5) { animation-delay: 0.6s; }
    @keyframes onde { 0%, 100% { height: 6px; } 50% { height: 24px; } }
    .texte { margin: 0; font-size: 16px; }
    .touches { margin: 0; font-size: 13px; border: 1px solid #6b7280; border-radius: 6px; padding: 2px 10px; }
    .consequence { margin: 0; min-height: 28px; color: #f1f5f9; font-weight: 700; }
    .consequence:empty { visibility: hidden; }
    .sous-titres { margin: 0; max-width: 480px; padding: 6px 12px; color: #f1f5f9; background: #1e293b; border-radius: 8px; }
    .champ { position: absolute; width: 1px; height: 1px; opacity: 0; }
  `,
})
export class LecteurPlayerComponent {
  private readonly session = inject(DefiSession);
  private readonly tracker = inject(ParisTracker);
  private readonly rng = inject(RANDOM);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly voice = inject(VoiceService);

  protected readonly step = computed<StepDef | null>(() => (this.session.allDone() ? null : (STEPS[this.session.stepsDone()] ?? null)));
  protected readonly items = signal<readonly Item[]>([]);
  protected readonly cursor = signal(-1);
  protected readonly consequence = signal('');
  protected readonly email = signal('');
  private readonly restart = signal(0);
  private prefix = '';
  private consequenceTimer: ReturnType<typeof setTimeout> | null = null;
  private focusTimers: ReturnType<typeof setTimeout>[] = [];
  private submitted = false;

  constructor() {
    this.tracker.reset();
    // Le clavier doit atteindre la zone dès le début du jeu : l'hôte déplace le focus sur le titre juste après le rendu,
    // donc on la réclame tout de suite puis on réessaie (sans jamais voler le focus à un bouton comme « Abandonner »).
    afterNextRender(() => {
      this.claimFocus();
      for (const delay of [0, 100]) {
        this.focusTimers.push(setTimeout(() => this.claimFocus(), delay));
      }
    });
    // À l'arrivée sur une étape, et à chaque nouvelle tentative : options mélangées, curseur avant le premier élément, introduction lue.
    effect(() => {
      const step = this.step();
      this.restart();
      untracked(() => this.enterStep(step));
    });
    inject(DestroyRef).onDestroy(() => {
      this.voice.cancel();
      this.focusTimers.forEach((t) => clearTimeout(t));
      if (this.consequenceTimer !== null) {
        clearTimeout(this.consequenceTimer);
      }
    });
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Le champ perd le focus (Maj+Tab vers la zone, clic ailleurs…) : le curseur virtuel quitte le champ, Tab pourra y revenir. */
  protected onFieldBlur(): void {
    this.cursor.set(-1);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || !this.step()) {
      return;
    }
    const typing = (event.target as HTMLElement).tagName === 'INPUT';
    if (event.key === 'Tab') {
      this.move(event, event.shiftKey ? -1 : 1);
      return;
    }
    if (typing) {
      // Dans le champ e-mail, seules Tab et Entrée comptent : R, Espace et flèches servent à écrire.
      if (event.key === 'Enter') {
        event.preventDefault();
        this.submitEmail();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        this.move(event, 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        this.move(event, -1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activate();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        this.voice.repeat();
        break;
    }
  }

  private move(event: KeyboardEvent, delta: 1 | -1): void {
    const { cursor, leave } = moveCursor(this.cursor(), this.items().length, delta);
    if (leave) {
      // Aux deux bouts, Tab rend la main au navigateur ; les flèches ne doivent pas faire défiler la page.
      if (event.key !== 'Tab') {
        event.preventDefault();
      }
      return;
    }
    event.preventDefault();
    this.cursor.set(cursor);
    this.voice.speak(this.items()[cursor].spoken);
    if (this.step()?.kind === 'text') {
      this.host.nativeElement.querySelector<HTMLInputElement>('input.champ')?.focus();
    }
  }

  private activate(): void {
    const step = this.step();
    const item = this.items()[this.cursor()];
    if (!step || step.kind !== 'choice' || !item) {
      return;
    }
    this.tracker.record(step.items.length, item.correct);
    if (item.correct) {
      this.clearConsequence();
      this.session.completeStep();
      this.cursor.set(-1); // un second Entrée avant le rendu ne doit pas agir sur les éléments de l'ancienne étape
      return;
    }
    const message = item.consequence ?? '';
    this.showConsequence(message);
    this.prefix = `${message} L'étape recommence.`;
    this.cursor.set(-1);
    this.restart.update((n) => n + 1);
  }

  private submitEmail(): void {
    if (this.submitted) {
      return;
    }
    if (!isValidEmail(this.email())) {
      this.voice.speak('Adresse invalide.');
      return;
    }
    this.submitted = true;
    this.prefix = 'Adresse enregistrée.';
    // Le champ disparaît avec l'étape : si le focus y est, il revient à la zone pour que le clavier reste actif.
    const input = this.host.nativeElement.querySelector<HTMLInputElement>('input.champ');
    if (input && document.activeElement === input) {
      this.host.nativeElement.querySelector<HTMLElement>('section.zone')?.focus();
    }
    this.session.completeStep();
    this.cursor.set(-1);
  }

  /** Place le focus sur la zone tant qu'il est « nulle part » (body) ou sur un titre ; jamais sur un bouton ou un champ. */
  private claimFocus(): void {
    const zone = this.host.nativeElement.querySelector<HTMLElement>('section.zone');
    const active = document.activeElement;
    if (zone && (!active || active === document.body || active.tagName === 'H1')) {
      zone.focus();
    }
  }

  private clearConsequence(): void {
    this.consequence.set('');
    if (this.consequenceTimer !== null) {
      clearTimeout(this.consequenceTimer);
      this.consequenceTimer = null;
    }
  }

  private showConsequence(text: string): void {
    this.consequence.set(text);
    if (this.consequenceTimer !== null) {
      clearTimeout(this.consequenceTimer);
    }
    this.consequenceTimer = setTimeout(() => this.consequence.set(''), CONSEQUENCE_MS);
  }

  private enterStep(step: StepDef | null): void {
    this.cursor.set(-1);
    this.submitted = false;
    this.email.set('');
    if (!step) {
      this.items.set([]);
      return;
    }
    this.items.set(step.kind === 'choice' ? shuffle(step.items, this.rng) : step.items);
    const text = [this.prefix, step.intro].filter(Boolean).join(' ');
    this.prefix = '';
    this.voice.speak(text);
  }
}

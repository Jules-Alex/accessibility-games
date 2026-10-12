import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { decisionPoints, shuffle } from '@ag/domain';
import { DefiSession, RANDOM } from '@ag/state';
import { AlternativeMode } from './alternative-mode';
import { AudioService } from './audio.service';
import { MAX_LISTENS, Option, STEPS, StepDef } from './surdite-content';
import { decide } from './surdite-decisions';
import { SurditeTracker } from './surdite-tracker';

/**
 * Messagerie vocale d'un client entendue à travers un son dégradé (voix étouffée, souffle, coupures) : 5 décisions,
 * 3 écoutes par étape, aucune transcription sauf demande. Chaque décision, réussie ou ratée, fait avancer le défi
 * sans rien montrer du score (points cachés, révélés au résultat) ; les conséquences sont racontées à la fin.
 */
@Component({
  selector: 'ag-surdite-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (step(); as s) {
      <section class="messagerie" aria-label="Messagerie vocale du client">
        <p class="question" tabindex="-1">📞 Message vocal {{ index() + 1 }}/{{ total() }} — {{ s.question }}</p>

        <div class="lecteur">
          <button type="button" class="ecouter ag-btn ag-btn--primary" [attr.aria-disabled]="canListen() ? null : 'true'" (click)="listen()">
            {{ listensLeft() === max ? '▶ Écouter' : '🔁 Réécouter' }}
          </button>
          <div class="onde" [class.onde--active]="audio.playing()" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="duree">{{ durationText() }}</span>
          <span class="ecoutes">🔁 Écoutes restantes : {{ listensLeft() }} (touche R)</span>
        </div>

        @if (audio.failed()) {
          <p class="erreur-son" role="status">Le son n'a pas pu être chargé : la transcription est affichée à la place.</p>
        }

        <div class="reponses" role="group" [attr.aria-label]="s.question">
          @for (o of options(); track o.id) {
            <button type="button" class="reponse" [attr.data-id]="o.id" [attr.aria-label]="o.ariaLabel ?? null" (click)="pick(o.id)">
              {{ o.label }}
            </button>
          }
        </div>

        <p class="alternative">
          <button type="button" class="lien" [attr.aria-pressed]="showTranscript()" (click)="alternative.toggle()">Besoin d'une alternative ?</button>
        </p>
        @if (showTranscript() || audio.failed()) {
          <blockquote class="transcription" aria-label="Transcription du message">{{ s.clip.transcript }}</blockquote>
        }
      </section>
    }
  `,
  styles: `
    :host { display: block; }
    .messagerie { min-height: 340px; padding: 16px; color: #e2e8f0; background: #172554; border: 3px solid #475569; border-radius: 10px; }
    .question { margin: 0 0 14px; padding: 8px 12px; font-size: 17px; font-weight: 700; border-left: 6px solid var(--ag-cyan); border-radius: 6px; background: var(--ag-bg); }
    .lecteur { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 0 0 14px; padding: 10px 12px; background: var(--ag-bg); border-radius: 10px; }
    .ecouter[aria-disabled='true'] { opacity: 0.55; cursor: not-allowed; }
    .onde { display: flex; gap: 4px; align-items: center; height: 28px; }
    .onde span { width: 5px; height: 6px; background: var(--ag-cyan); border-radius: 3px; }
    .onde--active span { animation: onde 1s ease-in-out infinite; }
    .onde--active span:nth-child(2) { animation-delay: 0.15s; }
    .onde--active span:nth-child(3) { animation-delay: 0.3s; }
    .onde--active span:nth-child(4) { animation-delay: 0.45s; }
    .onde--active span:nth-child(5) { animation-delay: 0.6s; }
    @keyframes onde { 0%, 100% { height: 6px; } 50% { height: 24px; } }
    .duree { color: #cbd5e1; font-variant-numeric: tabular-nums; }
    .ecoutes { margin-left: auto; padding: 4px 12px; font-weight: 700; color: var(--ag-bg); background: var(--ag-yellow); border-radius: 999px; }
    .erreur-son { margin: 0 0 12px; color: var(--ag-orange); font-weight: 700; }
    .reponses { display: flex; flex-wrap: wrap; gap: 12px; }
    .reponse { min-width: 140px; min-height: 56px; padding: 10px 18px; font: inherit; font-size: 17px; font-weight: 700; color: var(--ag-bg); cursor: pointer; background: #e2e8f0; border: 0; border-radius: 10px; }
    .alternative { margin: 14px 0 0; }
    .lien { padding: 0; font: inherit; font-size: 14px; color: var(--ag-cyan); text-decoration: underline; cursor: pointer; background: none; border: 0; }
    .transcription { margin: 10px 0 0; padding: 8px 12px; font-style: italic; background: var(--ag-bg); border-left: 4px solid var(--ag-cyan); }
  `,
})
export class SurditePlayerComponent {
  private readonly session = inject(DefiSession);
  private readonly tracker = inject(SurditeTracker);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly audio = inject(AudioService);
  protected readonly alternative = inject(AlternativeMode);

  protected readonly max = MAX_LISTENS;
  /** Les options de chaque étape sont mélangées une fois par partie (sauf gauche / droite, dont la position a un sens). */
  private readonly orders: readonly (readonly Option[])[];
  private loadToken = 0;

  protected readonly total = computed(() => this.session.stepsTotal());
  protected readonly index = computed(() => this.session.stepsDone());
  protected readonly step = computed<StepDef | null>(() => (this.session.allDone() ? null : (STEPS[this.index()] ?? null)));
  protected readonly options = computed(() => this.orders[this.index()] ?? []);
  protected readonly listensLeft = signal(MAX_LISTENS);
  protected readonly duration = signal(0);
  protected readonly showTranscript = computed(() => this.alternative.enabled());
  protected readonly canListen = computed(() => this.listensLeft() > 0 && !this.audio.failed());
  protected readonly durationText = computed(() => {
    const seconds = Math.ceil(this.duration());
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  constructor() {
    const rng = inject(RANDOM);
    this.orders = STEPS.map((s) => (s.shuffle ? shuffle(s.options, rng) : [...s.options]));
    this.tracker.reset();
    this.audio.reset();

    // À chaque étape : on coupe le son, les écoutes repartent à 3 et l'extrait se charge à l'avance (échec = transcription).
    effect(() => {
      const step = this.step();
      untracked(() => this.enterStep(step));
    });

    // L'élément cliqué disparaît avec l'étape : le focus revient sur la question (jamais volé à un élément extérieur).
    effect(() => {
      if (this.index() > 0) {
        untracked(() => afterNextRender(() => this.restoreFocus(), { injector: this.injector }));
      }
    });

    inject(DestroyRef).onDestroy(() => this.audio.stop());
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || event.repeat) {
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.listen();
    }
  }

  protected listen(): void {
    const step = this.step();
    // Pas d'écoute décomptée tant qu'une lecture est en cours, quand il n'en reste plus ou quand le son est indisponible.
    if (!step || this.audio.playing() || !this.canListen()) {
      return;
    }
    this.listensLeft.update((n) => n - 1);
    void this.audio.play(step.clip.url);
  }

  protected pick(optionId: string): void {
    const step = this.step();
    // Les identifiants d'options sont uniques dans tout le défi : un clic répété sur l'ancienne étape est ignoré.
    if (!step || !step.options.some((o) => o.id === optionId)) {
      return;
    }
    const index = this.index();
    this.audio.stop();
    const info = decide(index, optionId);
    this.tracker.record(index, info);
    this.session.addHiddenPoints(decisionPoints(info.result));
    this.session.completeStep(0);
  }

  private enterStep(step: StepDef | null): void {
    this.audio.stop();
    this.listensLeft.set(MAX_LISTENS);
    this.duration.set(0);
    if (!step) {
      return;
    }
    const token = ++this.loadToken;
    void this.audio.preload(step.clip.url).then((seconds) => {
      if (token === this.loadToken) {
        this.duration.set(seconds);
      }
    });
  }

  private restoreFocus(): void {
    const root = this.host.nativeElement;
    const active = document.activeElement;
    if (!active || active === document.body || root.contains(active)) {
      root.querySelector<HTMLElement>('p.question')?.focus();
    }
  }
}

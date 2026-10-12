import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { DecisionInfo, decisionPoints, shuffle } from '@ag/domain';
import { DefiSession, RANDOM } from '@ag/state';
import { CouleursChoixComponent } from './couleurs-choix.component';
import { CouleursClassementComponent } from './couleurs-classement.component';
import { ChoiceItem, ChoiceStepDef, DEUTERANOPIE_MATRIX, RankItem, RankStepDef, STEPS } from './couleurs-content';
import { decideChoice, decideRank } from './couleurs-decisions';
import { CouleursTracker } from './couleurs-tracker';

/**
 * Faux outil de pilotage de portefeuille vu avec un filtre de daltonisme (deutéranopie). Chaque étape est une
 * décision : réussie ou ratée, elle fait avancer le défi sans rien montrer du score (points cachés, révélés au résultat) ;
 * la conséquence de chaque choix est racontée à la fin (`CouleursFinComponent`).
 */
@Component({
  selector: 'ag-couleurs-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CouleursChoixComponent, CouleursClassementComponent],
  template: `
    <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="ag-deuteranopie" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" [attr.values]="matrix" />
      </filter>
    </svg>
    <div class="page" data-filtre="deuteranopie">
      @if (step(); as s) {
        <p class="message" tabindex="-1">💬 <strong>{{ s.message.from }}</strong> : « {{ s.message.text }} »</p>
        @if (choiceStep(); as c) {
          <ag-couleurs-choix [stepIndex]="index()" [items]="choiceItems()" [legend]="c.legend" (picked)="onChoice($event)" />
        }
        @if (rankStep(); as r) {
          <ag-couleurs-classement [stepIndex]="index()" [items]="rankItems()" [legend]="r.legend" (ranked)="onRanked($event)" />
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .defs { position: absolute; }
    .page { filter: url(#ag-deuteranopie); min-height: 340px; padding: 16px; color: #1e293b; background: #f8fafc; border: 3px solid #475569; border-radius: 10px; font: 16px/1.4 system-ui, sans-serif; }
    .message { margin: 0 0 14px; padding: 10px 14px; background: #e0f2fe; border-left: 6px solid #0284c7; border-radius: 8px; }
    /* Contour sombre à l'intérieur de la page claire (le contour jaune global n'y est pas lisible). */
    .page :focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
  `,
})
export class CouleursPlayerComponent {
  private readonly session = inject(DefiSession);
  private readonly tracker = inject(CouleursTracker);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly matrix = DEUTERANOPIE_MATRIX;
  /** Les éléments de chaque étape sont mélangés une fois par partie : la bonne réponse change de place d'une partie à l'autre. */
  private readonly orders: readonly (readonly (ChoiceItem | RankItem)[])[];

  protected readonly index = computed(() => this.session.stepsDone());
  protected readonly step = computed(() => (this.session.allDone() ? null : (STEPS[this.index()] ?? null)));
  protected readonly choiceStep = computed<ChoiceStepDef | null>(() => {
    const s = this.step();
    return s?.kind === 'choice' ? s : null;
  });
  protected readonly rankStep = computed<RankStepDef | null>(() => {
    const s = this.step();
    return s?.kind === 'rank' ? s : null;
  });
  protected readonly choiceItems = computed(() => (this.orders[this.index()] ?? []) as readonly ChoiceItem[]);
  protected readonly rankItems = computed(() => (this.orders[this.index()] ?? []) as readonly RankItem[]);

  constructor() {
    const rng = inject(RANDOM);
    this.orders = STEPS.map((s) => shuffle<ChoiceItem | RankItem>(s.items, rng));
    this.tracker.reset();

    // L'élément cliqué disparaît avec l'étape : le focus revient sur le message de la nouvelle étape (jamais volé à un élément extérieur).
    effect(() => {
      if (this.index() > 0) {
        untracked(() => afterNextRender(() => this.restoreFocus(), { injector: this.injector }));
      }
    });
  }

  protected onChoice(e: { step: number; id: string }): void {
    if (e.step !== this.session.stepsDone()) {
      return; // clic répété sur l'ancienne étape avant le rendu de la suivante
    }
    this.commit(e.step, decideChoice(e.step, e.id));
  }

  protected onRanked(e: { step: number; order: readonly string[] }): void {
    if (e.step !== this.session.stepsDone()) {
      return;
    }
    this.commit(e.step, decideRank(e.step, e.order));
  }

  /** Enregistre la décision et fait avancer l'étape ; les points sont cachés (ils diraient si le choix était bon) et révélés au résultat. */
  private commit(step: number, info: DecisionInfo): void {
    this.tracker.record(step, info);
    this.session.addHiddenPoints(decisionPoints(info.result));
    this.session.completeStep(0);
  }

  private restoreFocus(): void {
    const root = this.host.nativeElement;
    const active = document.activeElement;
    if (!active || active === document.body || root.contains(active)) {
      root.querySelector<HTMLElement>('p.message')?.focus();
    }
  }
}

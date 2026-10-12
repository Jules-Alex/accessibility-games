import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Type,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { DefiId, Outcome, getDefiMeta, isValidCode, makeResult, parseDefiId } from '@ag/domain';
import { DEFI_DEFINITIONS, DefiSession, DefiTimer, GameStore } from '@ag/state';
import { HudComponent, NEUTRAL_PILL_TEXT } from '@ag/ui';
import { ConsigneComponent } from './consigne.component';
import { FinDefiComponent } from './fin-defi.component';

type Stage = 'consigne' | 'jeu' | 'fin';

/** Orchestre un défi : consigne → jeu (minuteur, étapes) → fin (statut, code de déblocage). */
@Component({
  selector: 'ag-defi-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DefiSession, DefiTimer],
  imports: [NgComponentOutlet, HudComponent, ConsigneComponent, FinDefiComponent],
  template: `
    @switch (stage()) {
      @case ('consigne') {
        <ag-consigne
          [meta]="meta()"
          [situation]="definition().situation"
          [missionPills]="definition().missionPills"
          [extra]="consigneExtraType()"
          (started)="start()"
        />
      }
      @case ('jeu') {
        <ag-hud
          [icon]="meta().icon"
          [niveau]="meta().id"
          [title]="meta().title"
          [points]="store.totalPoints() + session.points()"
          [gain]="session.gain()"
          [remainingMs]="timer.remainingMs()"
          [totalMs]="timer.totalMs()"
          [stepsTotal]="session.stepsTotal()"
          [stepsDone]="session.stepsDone()"
          [mission]="mission()"
          [doneText]="doneText()"
          (abandon)="finish('abandonne')"
        />
        <section class="zone" aria-label="Zone du défi">
          <ng-container [ngComponentOutlet]="playerType()" />
        </section>
      }
      @case ('fin') {
        @if (result(); as r) {
          <ag-fin-defi
            [meta]="meta()"
            [result]="r"
            [resume]="definition().resume"
            [mode]="store.mode()"
            [totalPoints]="store.totalPoints()"
            [codeInvalid]="codeInvalid()"
            (codeSubmitted)="onCode($event)"
            (continued)="onContinue()"
          >
            <ng-container [ngComponentOutlet]="extraType()" />
          </ag-fin-defi>
        }
      }
    }
  `,
  styles: `
    .zone { margin-top: 0.75rem; }
  `,
})
export class DefiHostComponent {
  /** Paramètre de route `:id` (lié par `withComponentInputBinding`). */
  readonly id = input.required<string>();

  protected readonly store = inject(GameStore);
  protected readonly session = inject(DefiSession);
  protected readonly timer = inject(DefiTimer);
  private readonly definitions = inject(DEFI_DEFINITIONS);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Défi en cours de jeu (null hors du jeu) : sert à le compter comme abandonné s'il est quitté. */
  private activeId: DefiId | null = null;

  protected readonly stage = signal<Stage>('consigne');
  protected readonly codeInvalid = signal(false);
  protected readonly playerType = signal<Type<unknown> | null>(null);
  protected readonly extraType = signal<Type<unknown> | null>(null);
  protected readonly consigneExtraType = signal<Type<unknown> | null>(null);

  protected readonly defiId = computed<DefiId>(() => parseDefiId(this.id()) ?? 1);
  protected readonly meta = computed(() => getDefiMeta(this.defiId()));
  /** Défi à points : une décision faite n'est pas forcément réussie, la progression le dit en termes neutres. */
  protected readonly doneText = computed(() => (this.meta().badgeBasis === 'points' ? NEUTRAL_PILL_TEXT.done : 'réussie'));
  protected readonly definition = computed(() => {
    const found = this.definitions.find((d) => d.id === this.defiId());
    if (!found) {
      throw new Error(`Aucune définition pour le défi ${this.defiId()}`);
    }
    return found;
  });
  protected readonly result = computed(() => this.store.resultFor(this.defiId()));
  protected readonly mission = computed(() => this.definition().stepPrompts[this.session.currentStep() - 1] ?? '');

  constructor() {
    effect(() => {
      const id = this.defiId();
      untracked(() => this.enter(id));
    });

    effect(() => {
      if (this.stage() !== 'jeu') {
        return;
      }
      const done = this.session.allDone();
      const expired = this.timer.expired();
      if (done) {
        untracked(() => this.finish('termine'));
      } else if (expired) {
        untracked(() => this.finish('expire'));
      }
    });

    inject(DestroyRef).onDestroy(() => this.interrupt());

    // Chaque changement d'étape déplace le focus sur le titre, pour les lecteurs d'écran et le clavier.
    effect(() => {
      this.stage();
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus(), 0);
    });
  }

  protected start(): void {
    this.activeId = this.defiId();
    this.store.markStarted(this.activeId);
    this.timer.start(this.meta().durationMs);
    this.stage.set('jeu');
  }

  protected finish(outcome: Outcome): void {
    if (this.stage() !== 'jeu') {
      return;
    }
    this.record(this.defiId(), outcome);
    this.stage.set('fin');
  }

  protected onCode(code: string): void {
    if (isValidCode(this.defiId(), code)) {
      this.next();
    } else {
      this.codeInvalid.set(true);
    }
  }

  protected onContinue(): void {
    if (this.store.mode() === 'autonome') {
      this.next();
    }
  }

  private next(): void {
    const id = this.defiId();
    if (!this.store.unlock(id)) {
      return;
    }
    void this.router.navigate(id < 5 ? ['/defi', id + 1] : ['/resultat']);
  }

  private record(id: DefiId, outcome: Outcome): void {
    this.timer.stop();
    this.store.recordResult(makeResult(id, outcome, this.session.stepsDone(), this.session.finalPoints()));
    this.activeId = null;
  }

  /** Quitter un défi en cours (retour arrière, changement de défi, fermeture) vaut abandon : pas de rejeu. */
  private interrupt(): void {
    if (this.stage() === 'jeu' && this.activeId !== null) {
      this.record(this.activeId, 'abandonne');
    }
  }

  private enter(id: DefiId): void {
    this.interrupt();
    this.store.settleStarted();
    this.timer.stop();
    this.session.configure(getDefiMeta(id).stepsTotal);
    this.codeInvalid.set(false);
    this.stage.set(this.store.resultFor(id) ? 'fin' : 'consigne');
    void this.loadParts(id);
  }

  private async loadParts(id: DefiId): Promise<void> {
    const def = this.definitions.find((d) => d.id === id);
    this.playerType.set(null);
    this.extraType.set(null);
    this.consigneExtraType.set(null);
    if (!def) {
      return;
    }
    const [player, extra, consigneExtra] = await Promise.all([
      def.player(),
      def.endExtra ? def.endExtra() : Promise.resolve(null),
      def.consigneExtra ? def.consigneExtra() : Promise.resolve(null),
    ]);
    if (this.defiId() === id) {
      this.playerType.set(player);
      this.extraType.set(extra);
      this.consigneExtraType.set(consigneExtra);
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type PillState = 'done' | 'current' | 'todo' | 'missed';

const STATE_TEXT: Record<PillState, string> = {
  done: 'réussie',
  current: 'en cours',
  todo: 'à venir',
  missed: 'non réussie',
};

/** Vocabulaire neutre pour les défis où une étape faite n'est pas forcément réussie (décision juste ou non). */
export const NEUTRAL_PILL_TEXT = { done: 'traitée', missed: 'non traitée' } as const;

@Component({
  selector: 'ag-step-pills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="pills" aria-label="Progression des étapes">
      @for (p of pills(); track p.n) {
        <li [class]="'pill pill--' + p.state" [attr.aria-label]="p.label" [attr.aria-current]="p.state === 'current' ? 'step' : null">{{ p.symbol }}</li>
      }
    </ol>
  `,
  styles: `
    .pills { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
    .pill { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; border: 2px solid var(--ag-muted); color: var(--ag-text); }
    .pill--done { background: var(--ag-green); border-color: var(--ag-green); color: var(--ag-bg); }
    .pill--current { background: var(--ag-cyan); border-color: var(--ag-cyan); color: var(--ag-bg); }
    .pill--missed { border-color: var(--ag-red); color: var(--ag-red); }
  `,
})
export class StepPillsComponent {
  readonly total = input.required<number>();
  readonly done = input.required<number>();
  /** En mode résultat, les étapes non faites sont marquées d'une croix. */
  readonly result = input(false);
  /** Mot lu pour une étape faite (« réussie » par défaut). */
  readonly doneText = input(STATE_TEXT.done);
  /** Mot lu pour une étape non faite en mode résultat (« non réussie » par défaut). */
  readonly missedText = input(STATE_TEXT.missed);

  private stateText(state: PillState): string {
    return state === 'done' ? this.doneText() : state === 'missed' ? this.missedText() : STATE_TEXT[state];
  }

  protected readonly pills = computed(() =>
    Array.from({ length: this.total() }, (_, i) => {
      const n = i + 1;
      let state: PillState;
      if (n <= this.done()) {
        state = 'done';
      } else if (this.result()) {
        state = 'missed';
      } else if (n === this.done() + 1) {
        state = 'current';
      } else {
        state = 'todo';
      }
      const symbol = state === 'done' ? '✓' : state === 'missed' ? '✗' : String(n);
      return { n, state, symbol, label: `Étape ${n} sur ${this.total()} : ${this.stateText(state)}` };
    }),
  );
}

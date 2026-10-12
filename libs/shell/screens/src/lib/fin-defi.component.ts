import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DefiMeta, DefiResult, Outcome, SessionMode, badgeForResult } from '@ag/domain';
import { DefiResume } from '@ag/state';
import { BadgeComponent, CodeEntryComponent, NEUTRAL_PILL_TEXT, StepPillsComponent } from '@ag/ui';

const STATUT: Record<Outcome, { texte: string; icon: string; kind: 'ok' | 'warn' | 'neutral' }> = {
  termine: { texte: 'Défi terminé', icon: '✅', kind: 'ok' },
  expire: { texte: 'Temps écoulé', icon: '⏱', kind: 'warn' },
  abandonne: { texte: 'Défi abandonné', icon: '🏳', kind: 'neutral' },
};

@Component({
  selector: 'ag-fin-defi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, StepPillsComponent, CodeEntryComponent],
  template: `
    <section class="fin">
      <h1 tabindex="-1" class="ag-sr-only">{{ meta().title }} : fin du défi</h1>

      <div [class]="'resultat resultat--' + statut().kind">
        <span class="resultat__ic" aria-hidden="true">{{ statut().icon }}</span>
        <div>
          <p class="resultat__t">{{ statut().texte }}</p>
          <p class="resultat__s">
            {{ result().stepsDone }} étape{{ result().stepsDone > 1 ? 's' : '' }} sur {{ meta().stepsTotal }}
            @if (badge().kind === 'abandonne') {
              · aucun badge pour un défi abandonné
            } @else {
              · badge <strong>{{ badge().icon }} {{ badge().label }}</strong> gagné
            }
          </p>
        </div>
      </div>

      <div class="fin__tete">
        <ag-badge variant="niveau">{{ meta().icon }} NIVEAU {{ meta().id }}/5 terminé</ag-badge>
        <ag-badge variant="score">★ {{ totalPoints() }} pts</ag-badge>
      </div>

      <div class="fin__etapes">
        <ag-step-pills [total]="meta().stepsTotal" [done]="result().stepsDone" [result]="true" [doneText]="pillTexts().done" [missedText]="pillTexts().missed" />
      </div>

      <ng-content />

      <div class="ag-card resume">
        <p><ag-badge variant="handicap">Vécu</ag-badge> {{ resume().vecu }}</p>
        <p><ag-badge variant="score">Impact métier</ag-badge> {{ resume().impact }}</p>
        <p><ag-badge variant="ok">Action simple</ag-badge> {{ resume().action }}</p>
      </div>

      <div class="ag-card suite">
        @if (mode() === 'anime') {
          <p class="attente">En attente du débrief des présentateurs…</p>
          <ag-code-entry [invalid]="codeInvalid()" (submitted)="codeSubmitted.emit($event)" />
        } @else {
          <button type="button" class="ag-btn ag-btn--go" (click)="continued.emit()">Continuer ▶</button>
        }
      </div>
    </section>
  `,
  styles: `
    .fin { text-align: center; }
    .resultat { display: flex; align-items: center; gap: 14px; text-align: left; margin-bottom: 0.75rem; padding: 12px 16px; border: 3px solid; border-radius: 14px; background: linear-gradient(135deg, var(--ag-card), var(--ag-bg)); }
    .resultat__ic { flex: none; width: 64px; height: 64px; display: inline-flex; align-items: center; justify-content: center; font-size: 34px; border: 3px solid; border-radius: 50%; background: var(--ag-bg); }
    .resultat__t { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.1; }
    .resultat__s { margin: 2px 0 0; font-size: 14px; color: #cbd5e1; }
    .resultat--ok { border-color: var(--ag-green); color: var(--ag-green); }
    .resultat--warn { border-color: var(--ag-orange); color: var(--ag-orange); }
    .resultat--neutral { border-color: #cbd5e1; color: #cbd5e1; }
    .fin__tete { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .fin__etapes { display: grid; justify-items: center; gap: 4px; margin: 0.75rem 0; }
    .resume { text-align: left; }
    .resume p { margin: 0.35rem 0; font-size: 15px; }
    .suite { border: 2px solid var(--ag-cyan); padding: 1rem 1.25rem; }
    .attente { margin: 0 0 0.5rem; color: #cbd5e1; }
  `,
})
export class FinDefiComponent {
  readonly meta = input.required<DefiMeta>();
  readonly result = input.required<DefiResult>();
  readonly resume = input.required<DefiResume>();
  readonly mode = input.required<SessionMode>();
  readonly totalPoints = input.required<number>();
  readonly codeInvalid = input(false);

  readonly codeSubmitted = output<string>();
  readonly continued = output<void>();

  protected readonly statut = computed(() => STATUT[this.result().outcome]);
  protected readonly badge = computed(() => badgeForResult(this.result()));
  /** Défi à points : une étape faite n'est pas forcément réussie, le texte lu reste neutre. */
  protected readonly pillTexts = computed(() => (this.meta().badgeBasis === 'points' ? NEUTRAL_PILL_TEXT : { done: 'réussie', missed: 'non réussie' }));
}

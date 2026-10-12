import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecisionResult, decisionsScore, getDefiMeta } from '@ag/domain';
import { STEP_CONTEXTS } from './surdite-content';
import { conclusionFor, missingSentence } from './surdite-decisions';
import { SurditeTracker } from './surdite-tracker';

const VERDICT: Readonly<Record<DecisionResult | 'aucune', string>> = {
  reussi: 'Réussi',
  rate: 'Raté',
  partiel: 'Partiel',
  aucune: 'Non abordée',
};

/** Blocs de l'écran de fin : décisions puis compte rendu (les réponses manquantes valent 0). Rien après un simple rechargement. */
@Component({
  selector: 'ag-surdite-fin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tracker.played()) {
      <section class="ag-card bloc bloc--decisions" aria-labelledby="surdite-decisions">
        <h2 id="surdite-decisions">📋 Vos décisions</h2>
        <ul class="cartes">
          @for (c of cards(); track c.step) {
            <li class="carte" [attr.data-result]="c.result">
              <span class="rond" aria-hidden="true">{{ c.result === 'reussi' ? '✓' : c.step + 1 }}</span>
              <div class="texte">
                <p class="contexte">{{ c.context }}</p>
                <p class="choix">{{ c.choice }}</p>
              </div>
              <span class="verdict">{{ c.verdict }}</span>
            </li>
          }
        </ul>
      </section>

      <section class="ag-card bloc bloc--rapport" aria-labelledby="surdite-rapport">
        <h2 id="surdite-rapport">📰 Compte rendu de la relation client</h2>
        <p class="histoire">{{ story() }}</p>
        <p class="resultat">
          <strong>{{ conclusion().icon }} {{ conclusion().title }}.</strong> {{ conclusion().text }}
        </p>
        <p class="rappel">Ce résultat mesure l'effet d'un son dégradé, pas votre compétence 😉</p>
      </section>
    }
  `,
  styles: `
    :host { display: block; }
    .bloc { margin: 0.75rem 0; text-align: left; }
    .bloc--decisions { border: 2px solid var(--ag-cyan); }
    .bloc--rapport { border: 2px solid var(--ag-yellow); }
    .bloc h2 { color: inherit; }
    .cartes { display: grid; gap: 8px; margin: 0.5rem 0 0; padding: 0; list-style: none; }
    .carte { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 8px 12px; background: var(--ag-bg); border: 2px solid var(--ag-border); border-radius: 10px; }
    .carte[data-result='reussi'] { border-color: var(--ag-green); }
    .carte[data-result='rate'] { border-color: var(--ag-red); }
    .carte[data-result='partiel'] { border-color: var(--ag-orange); }
    .rond { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; font-weight: 800; border: 2px solid currentColor; border-radius: 50%; }
    .texte p { margin: 0; }
    .contexte { font-size: 11px; color: var(--ag-muted); }
    .choix { font-size: 15px; }
    .verdict { font-weight: 800; }
    .histoire, .resultat { margin: 0.5rem 0; font-size: 15px; }
    .rappel { margin: 0.5rem 0 0; font-size: 13px; color: var(--ag-muted); }
  `,
})
export class SurditeFinComponent {
  protected readonly tracker = inject(SurditeTracker);
  private readonly total = getDefiMeta(5).stepsTotal;

  protected readonly cards = computed(() => {
    const decisions = this.tracker.decisions();
    return Array.from({ length: this.total }, (_, step) => {
      const d = decisions.find((x) => x.step === step);
      return {
        step,
        context: STEP_CONTEXTS[step] ?? '',
        choice: d?.choice ?? 'Pas de décision prise',
        result: d?.result ?? 'aucune',
        verdict: VERDICT[d?.result ?? 'aucune'],
      };
    });
  });

  /** Une phrase par étape : celle de la décision, sinon la phrase « temps écoulé » de l'étape (aussi pour l'abandon). */
  protected readonly story = computed(() => {
    const decisions = this.tracker.decisions();
    return Array.from({ length: this.total }, (_, step) => decisions.find((x) => x.step === step)?.sentence ?? missingSentence(step)).join(' ');
  });

  protected readonly conclusion = computed(() =>
    conclusionFor(decisionsScore(this.tracker.decisions()), this.total, this.tracker.decisions().length),
  );
}

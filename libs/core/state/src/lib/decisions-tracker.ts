import { computed, signal } from '@angular/core';
import { Decision, DecisionInfo } from '@ag/domain';

/**
 * Garde les décisions prises pendant un défi à décisions, pour son écran de fin. Classe de base non injectable :
 * chaque défi en dérive son propre service (`@Injectable({ providedIn: 'root' })`), car un défi ne doit pas
 * voir les décisions d'un autre.
 */
export class DecisionsTracker {
  private readonly list = signal<readonly Decision[]>([]);
  private readonly started = signal(false);

  /** Décisions prises, rangées par étape. */
  readonly decisions = computed(() => [...this.list()].sort((a, b) => a.step - b.step));

  /** Vrai dès qu'une partie a été lancée dans cette session (le jeu appelle reset) ; faux après un rechargement de page. */
  readonly played = this.started.asReadonly();

  reset(): void {
    this.started.set(true);
    this.list.set([]);
  }

  /** Une seule décision par étape : la première enregistrée est conservée. */
  record(step: number, info: DecisionInfo): void {
    if (this.list().some((d) => d.step === step)) {
      return;
    }
    this.list.update((l) => [...l, { step, ...info }]);
  }
}

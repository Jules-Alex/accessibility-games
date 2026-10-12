import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DefiSession } from '@ag/state';

/** Composant de jeu de démonstration : une étape par clic. Remplacé par chaque vrai défi. */
@Component({
  selector: 'ag-placeholder-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ag-card">
      <p>Défi de démonstration : validez les étapes une à une.</p>
      <button type="button" class="ag-btn ag-btn--primary" (click)="session.completeStep()">Valider l'étape</button>
    </div>
  `,
})
export class PlaceholderPlayerComponent {
  protected readonly session = inject(DefiSession);
}

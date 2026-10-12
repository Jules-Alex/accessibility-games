import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ParisTracker } from './paris-tracker';

/** Bloc de l'écran de fin : bilan des paris. Vide si aucun pari n'a été fait. */
@Component({
  selector: 'ag-lecteur-paris',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tracker.total() > 0) {
      <p class="paris">
        🎲 Vos paris : <strong>{{ tracker.wins() }} gagné{{ tracker.wins() > 1 ? 's' : '' }} sur {{ tracker.total() }}</strong>
        <span class="paris__hasard">(le hasard donne environ {{ tracker.expected() }} sur {{ tracker.total() }})</span>
      </p>
    }
  `,
  styles: `
    .paris { margin: 0.5rem 0; font-size: 15px; }
    .paris__hasard { color: #94a3b8; }
  `,
})
export class LecteurParisComponent {
  protected readonly tracker = inject(ParisTracker);
}

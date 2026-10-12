import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChoiceItem, LegendEntry } from './couleurs-content';

/**
 * Étape « un choix parmi N » : projets, barres, champs ou boutons. La couleur est volontairement la seule
 * information visible pour les barres et les boutons ; le nom accessible, lui, dit tout.
 */
@Component({
  selector: 'ag-couleurs-choix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (legend().length > 0) {
      <ul class="legende" aria-label="Légende des couleurs">
        @for (l of legend(); track l.label) {
          <li><span class="puce" [style.background]="l.color" aria-hidden="true"></span>{{ l.label }}</li>
        }
      </ul>
    }
    <div class="items" [attr.data-kind]="kind()">
      @for (it of items(); track it.id) {
        @if (it.kind === 'projet') {
          <button type="button" class="projet" [attr.data-id]="it.id" [attr.aria-label]="it.ariaLabel" (click)="pick(it.id)">
            <span class="pastille" [style.background]="it.color" aria-hidden="true"></span>
            <span class="nom">{{ it.name }}</span>
          </button>
        } @else if (it.kind === 'barre') {
          <button type="button" class="barre" [attr.data-id]="it.id" [attr.aria-label]="it.ariaLabel" [style.background]="it.color" [style.height.%]="it.height" (click)="pick(it.id)"></button>
        } @else if (it.kind === 'champ') {
          <button type="button" class="champ" [attr.data-id]="it.id" [attr.aria-label]="it.ariaLabel" [style.border-color]="it.color" (click)="pick(it.id)">
            <small>{{ it.name }}</small>
            <span>{{ it.value }}</span>
          </button>
        } @else {
          <button type="button" class="bouton" [attr.data-id]="it.id" [attr.aria-label]="it.ariaLabel" [style.background]="it.color" (click)="pick(it.id)"></button>
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .legende { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0 0 12px; padding: 0; list-style: none; font-size: 14px; }
    .puce { display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 50%; vertical-align: -2px; }
    .items[data-kind='projet'] { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .items[data-kind='barre'] { display: flex; align-items: flex-end; gap: 12px; height: 190px; }
    .items[data-kind='champ'] { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .items[data-kind='bouton'] { display: flex; gap: 16px; }
    button { font: inherit; color: inherit; cursor: pointer; }
    .projet { display: flex; align-items: center; gap: 8px; padding: 10px; font-size: 16px; text-align: left; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; }
    .pastille { flex: none; width: 20px; height: 20px; border-radius: 50%; }
    .barre { flex: 1; align-self: flex-end; border: 0; border-radius: 6px 6px 0 0; }
    .champ { display: grid; gap: 2px; padding: 8px 10px; text-align: left; background: #fff; border: 3px solid; border-radius: 6px; }
    .champ small { color: #475569; }
    .bouton { width: 96px; height: 56px; border: 0; border-radius: 10px; }
  `,
})
export class CouleursChoixComponent {
  readonly stepIndex = input.required<number>();
  readonly items = input.required<readonly ChoiceItem[]>();
  readonly legend = input<readonly LegendEntry[]>([]);
  readonly picked = output<{ step: number; id: string }>();

  protected readonly kind = computed(() => this.items()[0]?.kind);

  protected pick(id: string): void {
    // `stepIndex` n'est mis à jour qu'au prochain rendu : un deuxième clic sur l'ancienne étape porte donc l'ancien index.
    this.picked.emit({ step: this.stepIndex(), id });
  }
}

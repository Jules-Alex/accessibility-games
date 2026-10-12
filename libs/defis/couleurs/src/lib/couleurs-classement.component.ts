import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LegendEntry, RankItem } from './couleurs-content';

/** Étape de classement : on clique les projets dans l'ordre, du plus critique au moins critique. */
@Component({
  selector: 'ag-couleurs-classement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="legende" aria-label="Légende des couleurs de criticité">
      @for (l of legend(); track l.label) {
        <li><span class="puce" [style.background]="l.color" aria-hidden="true"></span>{{ l.label }}</li>
      }
    </ul>
    <p class="consigne">Cliquez les projets dans l'ordre : le plus critique en premier. Le classement est définitif.</p>
    <div class="items">
      @for (it of items(); track it.id) {
        <button
          type="button"
          class="projet"
          [class.projet--classe]="rangOf(it.id) > 0"
          [attr.data-id]="it.id"
          [attr.aria-label]="rangOf(it.id) > 0 ? it.name + ', classé numéro ' + rangOf(it.id) : it.ariaLabel"
          [attr.aria-disabled]="rangOf(it.id) > 0 ? 'true' : null"
          (click)="rank(it.id)"
        >
          <span class="rang" aria-hidden="true">{{ rangOf(it.id) > 0 ? rangOf(it.id) : '' }}</span>
          <span class="nom">{{ it.name }}</span>
          <span class="criticite" [style.background]="it.color" aria-hidden="true"></span>
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .legende { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0 0 8px; padding: 0; list-style: none; font-size: 14px; }
    .puce { display: inline-block; width: 14px; height: 14px; margin-right: 6px; border-radius: 50%; vertical-align: -2px; }
    .consigne { margin: 0 0 10px; font-size: 14px; color: #475569; }
    .items { display: grid; gap: 8px; }
    .projet { display: grid; grid-template-columns: 32px 120px 1fr; align-items: center; gap: 10px; padding: 8px 10px; font: inherit; font-size: 16px; color: inherit; text-align: left; cursor: pointer; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; }
    .projet--classe { opacity: 0.7; cursor: default; }
    .rang { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; font-weight: 800; border: 2px solid #475569; border-radius: 50%; }
    .rang:empty { border-style: dashed; border-color: #cbd5e1; }
    .criticite { height: 16px; border-radius: 4px; }
  `,
})
export class CouleursClassementComponent {
  readonly stepIndex = input.required<number>();
  readonly items = input.required<readonly RankItem[]>();
  readonly legend = input<readonly LegendEntry[]>([]);
  readonly ranked = output<{ step: number; order: readonly string[] }>();

  private readonly order = signal<readonly string[]>([]);

  protected rangOf(id: string): number {
    return this.order().indexOf(id) + 1;
  }

  protected rank(id: string): void {
    const total = this.items().length;
    if (this.order().includes(id) || this.order().length >= total) {
      return;
    }
    const next = [...this.order(), id];
    this.order.set(next);
    if (next.length === total) {
      this.ranked.emit({ step: this.stepIndex(), order: next });
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'niveau' | 'score' | 'temps' | 'handicap' | 'ok' | 'alerte' | 'neutre';

@Component({
  selector: 'ag-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()' },
  template: '<ng-content />',
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.375rem; border-radius: 999px; padding: 5px 14px; font-weight: 800; font-size: 16px; line-height: 1.3; }
    :host(.ag-badge--niveau) { background: var(--ag-cyan); color: var(--ag-bg); }
    :host(.ag-badge--score) { background: var(--ag-yellow); color: var(--ag-bg); }
    :host(.ag-badge--handicap) { background: var(--ag-violet); color: var(--ag-bg); }
    :host(.ag-badge--ok) { background: var(--ag-green); color: var(--ag-bg); }
    :host(.ag-badge--alerte) { background: var(--ag-orange); color: var(--ag-bg); }
    :host(.ag-badge--temps) { background: var(--ag-card); border: 2px solid var(--ag-cyan); color: var(--ag-text); }
    :host(.ag-badge--neutre) { background: var(--ag-card); border: 1px solid var(--ag-border); color: var(--ag-text); }
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('neutre');
  protected readonly hostClass = computed(() => `ag-badge ag-badge--${this.variant()}`);
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMmSs, gaugePercent, isLastSeconds } from '@ag/domain';
import { BadgeComponent } from './badge.component';

@Component({
  selector: 'ag-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div
      class="gauge"
      [class.gauge--urgent]="urgent()"
      role="progressbar"
      aria-label="Temps restant"
      aria-valuemin="0"
      [attr.aria-valuemax]="totalSeconds()"
      [attr.aria-valuenow]="remainingSeconds()"
      [attr.aria-valuetext]="label() + ' restantes'"
    >
      <div class="gauge__fill" [style.width.%]="percent()"></div>
    </div>
    <ag-badge [variant]="urgent() ? 'alerte' : 'temps'">⏱ {{ label() }} restantes</ag-badge>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: 10px; }
    .gauge { flex: 1; height: 20px; border-radius: 10px; background: var(--ag-card); border: 2px solid var(--ag-border); overflow: hidden; }
    .gauge__fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, var(--ag-cyan), var(--ag-violet)); transition: width 0.25s linear; }
    .gauge--urgent { border-color: var(--ag-orange); animation: pulse 1.4s ease-in-out infinite; }
    .gauge--urgent .gauge__fill { background: linear-gradient(90deg, var(--ag-orange), var(--ag-red)); }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 12px 3px rgb(251 146 60 / 0.7); } }
  `,
})
export class GaugeComponent {
  readonly remainingMs = input.required<number>();
  readonly totalMs = input.required<number>();

  protected readonly percent = computed(() => gaugePercent(this.remainingMs(), this.totalMs()));
  protected readonly label = computed(() => formatMmSs(this.remainingMs()));
  protected readonly urgent = computed(() => isLastSeconds(this.remainingMs()));
  protected readonly remainingSeconds = computed(() => Math.ceil(Math.max(0, this.remainingMs()) / 1000));
  protected readonly totalSeconds = computed(() => Math.ceil(Math.max(0, this.totalMs()) / 1000));
}

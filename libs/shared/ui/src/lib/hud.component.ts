import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GainEvent, splitEmphasis } from '@ag/domain';
import { BadgeComponent } from './badge.component';
import { GaugeComponent } from './gauge.component';
import { StepPillsComponent } from './step-pills.component';

@Component({
  selector: 'ag-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, GaugeComponent, StepPillsComponent],
  template: `
    <header class="hud">
      <div class="hud__row">
        <div class="hud__id">
          <ag-badge variant="niveau">{{ icon() }} NIVEAU {{ niveau() }}/5</ag-badge>
          <h1 class="hud__title" tabindex="-1">{{ title() }}</h1>
        </div>
        <div class="hud__actions">
          <span class="hud__score">
            <ag-badge variant="score">★ {{ points() }} pts</ag-badge>
            @if (gain(); as g) {
              @for (k of [g.id]; track k) {
                <span class="gain" aria-hidden="true">+{{ g.amount }}</span>
              }
            }
          </span>
          <button type="button" class="abandon" (click)="abandon.emit()">🏳 Abandonner</button>
        </div>
      </div>
      <ag-gauge [remainingMs]="remainingMs()" [totalMs]="totalMs()" />
      <div class="hud__mission">
        <ag-step-pills [total]="stepsTotal()" [done]="stepsDone()" [doneText]="doneText()" />
        <p class="mission" aria-live="polite">
          <strong class="mission__step">Étape {{ currentStep() }}/{{ stepsTotal() }}</strong> —
          @for (part of missionParts(); track $index) {
            @if (part.em) {
              <span class="key">{{ part.text }}</span>
            } @else {
              {{ part.text }}
            }
          }
        </p>
      </div>
    </header>
  `,
  styles: `
    .hud { display: grid; gap: 10px; }
    .hud__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .hud__id, .hud__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .hud__title { font-size: 19px; font-weight: 800; margin: 0; color: #fff; }
    .hud__score { position: relative; display: inline-flex; }
    .gain { position: absolute; right: -8px; top: -10px; color: var(--ag-green); font-weight: 800; font-size: 16px; animation: float 2.4s ease-out forwards; }
    @keyframes float { 0% { transform: translateY(8px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }
    .abandon { font: inherit; font-size: 14px; font-weight: 700; color: var(--ag-red); background: transparent; border: 2px solid var(--ag-red); border-radius: 8px; padding: 3px 12px; cursor: pointer; }
    .hud__mission { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: var(--ag-card); border: 2px solid var(--ag-cyan); border-radius: 12px; padding: 8px 14px; }
    .mission { margin: 0; font-size: 17px; font-weight: 600; line-height: 1.5; color: #fff; }
    .mission__step { color: var(--ag-cyan); }
    .key { background: var(--ag-bg); color: var(--ag-cyan); border: 2px solid var(--ag-cyan); border-radius: 8px; padding: 0 7px; font-weight: 800; white-space: nowrap; }
  `,
})
export class HudComponent {
  readonly icon = input.required<string>();
  readonly niveau = input.required<number>();
  readonly title = input.required<string>();
  readonly points = input.required<number>();
  readonly gain = input<GainEvent | null>(null);
  readonly remainingMs = input.required<number>();
  readonly totalMs = input.required<number>();
  readonly stepsTotal = input.required<number>();
  readonly stepsDone = input.required<number>();
  readonly mission = input('');
  /** Mot lu pour une étape faite dans la progression (« réussie » par défaut). */
  readonly doneText = input('réussie');

  readonly abandon = output<void>();

  protected readonly currentStep = computed(() => Math.min(this.stepsDone() + 1, Math.max(this.stepsTotal(), 1)));
  protected readonly missionParts = computed(() => splitEmphasis(this.mission()));
}

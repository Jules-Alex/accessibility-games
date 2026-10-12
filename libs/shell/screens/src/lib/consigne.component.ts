import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Type, computed, input, output } from '@angular/core';
import { DefiMeta } from '@ag/domain';
import { BadgeComponent } from '@ag/ui';

@Component({
  selector: 'ag-consigne',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, NgComponentOutlet],
  template: `
    <section class="consigne">
      <p class="consigne__icon" aria-hidden="true">{{ meta().icon }}</p>
      <ag-badge variant="niveau">NIVEAU {{ meta().id }} / 5</ag-badge>
      <h1 tabindex="-1">{{ meta().title }}</h1>
      <ag-badge variant="handicap">Situation vécue : {{ meta().handicap }}</ag-badge>

      <div class="ag-card">
        <h2>La situation</h2>
        <p>{{ situation() }}</p>
      </div>
      <div class="ag-card">
        <h2>Votre mission</h2>
        <ol class="mission">
          @for (pill of missionPills(); track $index) {
            <li>{{ pill }}</li>
          }
        </ol>
      </div>
      @if (extra(); as extraType) {
        <div class="ag-card consigne__extra">
          <ng-container [ngComponentOutlet]="extraType" />
        </div>
      }
      <p class="regles">
        ⏱ <strong>{{ minutes() }} minutes</strong> · <strong>Ça va être difficile, et c'est voulu : essayez jusqu'au bout, c'est ce que vivent certains utilisateurs.</strong>
      </p>
      <button type="button" class="ag-btn ag-btn--go" (click)="started.emit()">▶ Démarrer le défi</button>
    </section>
  `,
  styles: `
    .consigne { text-align: center; }
    .consigne__icon { font-size: 36px; margin: 0; }
    h1 { font-size: 1.5rem; margin: 0.5rem 0; }
    .ag-card { text-align: left; }
    .consigne__extra { text-align: left; }
    .mission { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0.5rem 0 0; padding: 0; }
    .mission li { background: var(--ag-bg); border: 1px solid #475569; border-radius: 999px; padding: 3px 12px; font-size: 14px; }
    .regles { color: #cbd5e1; font-size: 14px; }
  `,
})
export class ConsigneComponent {
  readonly meta = input.required<DefiMeta>();
  readonly situation = input.required<string>();
  readonly missionPills = input.required<readonly string[]>();
  /** Bloc supplémentaire propre au défi (affiché sous la mission), optionnel. */
  readonly extra = input<Type<unknown> | null>(null);
  readonly started = output<void>();

  protected readonly minutes = computed(() => Math.round(this.meta().durationMs / 60_000));
}

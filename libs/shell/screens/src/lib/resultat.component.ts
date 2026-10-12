import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFIS, badgeForResult, buildSynthesis, describeProgress, getDefiMeta, splitEmphasis } from '@ag/domain';
import { GameStore } from '@ag/state';
import { BadgeComponent } from '@ag/ui';

@Component({
  selector: 'ag-resultat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, RouterLink],
  template: `
    <section class="resultat">
      <p class="icon" aria-hidden="true">🏁</p>
      <h1 tabindex="-1">Bravo, {{ store.pseudo() }} !</h1>
      <ag-badge variant="score" class="total">★ {{ store.totalPoints() }} pts</ag-badge>
      <p class="bilan">{{ bilan() }}</p>

      <div class="ag-card badges">
        <h2>🎖 Vos badges</h2>
        <ul>
          @for (g of store.badgeGroups(); track g.label) {
            <li class="badge-pill">{{ g.icon }} {{ g.label }}@if (g.count > 1) { ×{{ g.count }} }</li>
          } @empty {
            <li>Aucun badge cette fois : rejouez avec les présentateurs pour en gagner.</li>
          }
        </ul>
      </div>

      @if (store.mode() === 'autonome') {
        <div class="syn">
          <h2>💬 Ce que vous venez de vivre</h2>
          <p>
            @for (part of mainParts(); track $index) {
              @if (part.em) {
                <strong>{{ part.text }}</strong>
              } @else {
                {{ part.text }}
              }
            }
          </p>
          <p class="extra">{{ synthesis().extra }}</p>
        </div>
      }

      <div class="ag-card detail">
        <h2>Détail par défi</h2>
        <ul>
          @for (row of rows(); track row.id) {
            <li [class]="'row row--' + row.kind">
              <span class="row__icon" aria-hidden="true">{{ row.icon }}</span>
              <span class="row__titre">{{ row.id }}. {{ row.title }} — {{ row.badge }}</span>
              <span class="row__statut">{{ row.statut }}</span>
            </li>
          }
        </ul>
      </div>

      @if (store.abandonedIds().length > 0) {
        <div class="ag-card abandon">
          <p><strong>🏳 @if (store.abandonedIds().length > 1) { Défis abandonnés } @else { Défi abandonné } :</strong></p>
          <ul>
            @for (id of store.abandonedIds(); track id) {
              <li>Défi {{ id }} — {{ titleOf(id) }}</li>
            }
          </ul>
          <p>Abandonner fait partie du jeu : c'est justement ce que vivent certains utilisateurs face à une application inaccessible.</p>
        </div>
      }

      <p class="ag-card obligatoire">
        ℹ <strong>Le score mesure votre progression dans cet atelier. Il ne mesure ni votre niveau professionnel ni votre connaissance réelle de l'accessibilité.</strong>
      </p>
      <a routerLink="/engagement" class="ag-btn ag-btn--go lien">Mon engagement ▶</a>
    </section>
  `,
  styles: `
    .resultat { text-align: center; }
    .icon { font-size: 40px; margin: 0; }
    .total { font-size: 20px; }
    .bilan { color: #cbd5e1; }
    .badges ul { list-style: none; padding: 0; margin: 0.25rem 0 0; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    .badge-pill { display: inline-flex; background: var(--ag-bg); border: 2px solid var(--ag-yellow); border-radius: 999px; padding: 8px 18px; font-size: 17px; font-weight: 800; }
    .syn { background: var(--ag-card-2); border: 2px solid var(--ag-cyan); border-radius: 12px; padding: 12px 16px; margin: 0.75rem auto; max-width: 640px; text-align: left; font-size: 16px; color: #fff; }
    .syn .extra { color: var(--ag-yellow); }
    .detail, .abandon { text-align: left; }
    .detail ul, .abandon ul { list-style: none; padding: 0; margin: 0; }
    .row { display: flex; gap: 10px; align-items: center; background: var(--ag-bg); border: 2px solid var(--ag-border); border-radius: 10px; padding: 6px 10px; margin-top: 6px; }
    .row--joue { border-color: var(--ag-green); }
    .row--abandonne { border-style: dashed; border-color: var(--ag-muted); }
    .row__titre { flex: 1; font-weight: 600; }
    .row__statut { font-weight: 800; font-size: 13px; }
    .abandon { border: 2px dashed var(--ag-muted); }
    .obligatoire { border: 2px solid var(--ag-cyan); font-size: 14px; text-align: left; }
    .lien { display: inline-block; text-decoration: none; margin-top: 0.5rem; }
  `,
})
export class ResultatComponent {
  protected readonly store = inject(GameStore);

  protected readonly bilan = computed(() => describeProgress(this.store.playedCount(), this.store.abandonedIds().length));
  protected readonly synthesis = computed(() => buildSynthesis(this.store.abandonedIds()));
  protected readonly mainParts = computed(() => splitEmphasis(this.synthesis().main));

  protected readonly rows = computed(() =>
    DEFIS.map((meta) => {
      const result = this.store.resultFor(meta.id);
      if (!result) {
        return { id: meta.id, icon: meta.icon, title: meta.title, badge: 'non joué', statut: 'Non joué', kind: 'abandonne' };
      }
      const abandoned = result.outcome === 'abandonne';
      const badge = badgeForResult(result);
      return {
        id: meta.id,
        icon: meta.icon,
        title: meta.title,
        badge: `${badge.icon} ${badge.label}`,
        statut: `${abandoned ? 'Abandonné' : 'Joué'} · ${result.points} pt${result.points > 1 ? 's' : ''}`,
        kind: abandoned ? 'abandonne' : 'joue',
      };
    }),
  );

  protected titleOf(id: 1 | 2 | 3 | 4 | 5): string {
    return getDefiMeta(id).title;
  }
}

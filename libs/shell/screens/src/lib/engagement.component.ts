import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { ENGAGEMENT_ACTIONS, MAX_ENGAGEMENTS, engagementSentence, toggleEngagement } from '@ag/domain';
import { GameStore } from '@ag/state';

@Component({
  selector: 'ag-engagement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!done()) {
      <section class="engagement">
        <p class="icon" aria-hidden="true">🤝</p>
        <h1 tabindex="-1">Et maintenant, que faites-vous ?</h1>
        <p class="aide">Choisissez 1 à {{ max }} actions simples à mettre en place sur votre produit.</p>

        <fieldset class="actions">
          <legend class="ag-sr-only">Actions d'engagement</legend>
          @for (a of actions; track a.id) {
            <label [class]="'opt' + (selected().includes(a.id) ? ' opt--on' : '')">
              <input
                type="checkbox"
                [checked]="selected().includes(a.id)"
                [disabled]="!selected().includes(a.id) && selected().length >= max"
                (change)="toggle(a.id)"
              />
              <span>{{ a.titre }}</span>
            </label>
          }
        </fieldset>

        @if (sentence()) {
          <div class="ag-card">
            <h2>Mon engagement</h2>
            <p class="phrase">{{ sentence() }}</p>
          </div>
        }

        <div class="boutons">
          <button type="button" class="ag-btn ag-btn--primary" [disabled]="!sentence()" (click)="copy()">📋 Copier mon engagement</button>
          <button type="button" class="ag-btn ag-btn--go" [disabled]="!sentence()" (click)="finish()">✓ Terminer</button>
        </div>
        <p class="note">« Copier » place le texte dans le presse-papiers pour le coller dans Teams ou un mail. Rien n'est envoyé à un serveur.</p>
        <p role="status" class="statut">{{ copyMessage() }}</p>
      </section>
    } @else {
      <section class="engagement">
        <p class="icon" aria-hidden="true">🎉</p>
        <h1 tabindex="-1">Merci, {{ store.pseudo() }} !</h1>
        <p>Rendez-vous avec les présentateurs pour la conclusion de l'atelier.</p>
        <div class="ag-card">
          <p class="phrase">{{ sentence() }}</p>
        </div>
      </section>
    }
  `,
  styles: `
    .engagement { text-align: center; }
    .icon { font-size: 36px; margin: 0; }
    .aide, .note { color: #cbd5e1; font-size: 14px; }
    .actions { border: 0; padding: 0; margin: 0.5rem 0; display: grid; gap: 6px; text-align: left; }
    .opt { display: flex; gap: 10px; align-items: center; background: var(--ag-bg); border: 2px solid #475569; border-radius: 10px; padding: 8px 12px; cursor: pointer; }
    .opt--on { border-color: var(--ag-green); background: #052e16; }
    input[type='checkbox'] { width: 22px; height: 22px; accent-color: var(--ag-green); }
    .boutons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 0.75rem 0 0.25rem; }
    .phrase { font-weight: 600; margin: 0; text-align: left; }
    .statut { min-height: 1.5rem; color: var(--ag-green); font-weight: 700; }
  `,
})
export class EngagementComponent {
  protected readonly store = inject(GameStore);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly actions = ENGAGEMENT_ACTIONS;
  protected readonly max = MAX_ENGAGEMENTS;

  protected readonly selected = signal<readonly string[]>([]);
  protected readonly done = signal(false);
  protected readonly copyMessage = signal('');
  protected readonly sentence = computed(() => engagementSentence(this.store.pseudo(), this.selected()));

  protected toggle(id: string): void {
    this.selected.update((current) => toggleEngagement(current, id));
    this.copyMessage.set('');
  }

  /** Passe à l'écran de remerciement et y déplace le focus (le bouton cliqué disparaît). */
  protected finish(): void {
    this.done.set(true);
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus(), { injector: this.injector });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.sentence());
      this.copyMessage.set('Copié ! Vous pouvez le coller dans Teams ou un mail.');
    } catch {
      this.copyMessage.set('Copie impossible : sélectionnez le texte de votre engagement et copiez-le à la main.');
    }
  }
}

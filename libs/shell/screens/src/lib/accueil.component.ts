import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DEFIS, PSEUDO_MAX_LENGTH } from '@ag/domain';
import { GameStore } from '@ag/state';
import { BadgeComponent } from '@ag/ui';

@Component({
  selector: 'ag-accueil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div class="accueil">
      <p class="accueil__icon" aria-hidden="true">♿</p>
      <h1 tabindex="-1">ACCESSIBILITY GAMES</h1>
      <p class="accueil__tagline">Vivez les barrières. Comprenez. Expérimentez. Agissez.</p>

      <section class="ag-card" aria-labelledby="regles-titre">
        <h2 id="regles-titre">Comment ça marche ?</h2>
        <ol>
          <li><strong>5 défis</strong>, chacun vous place dans une situation vécue par certains utilisateurs.</li>
          <li><strong>2 minutes</strong> par défi. Quand c'est fini, on attend le groupe et le débrief des présentateurs.</li>
          <li>Un <strong>code</strong> donné par les présentateurs lance le défi suivant.</li>
          <li><strong>Ça va être difficile, et c'est voulu : essayez jusqu'au bout, c'est ce que vivent certains utilisateurs.</strong></li>
        </ol>
        <p class="note">⭐ Le score entretient l'ambiance, il ne mesure ni votre niveau ni votre connaissance de l'accessibilité.</p>
      </section>

      <ul class="defis" aria-label="Les cinq défis">
        @for (d of defis; track d.id) {
          <li><ag-badge>{{ d.icon }} {{ d.shortName }}</ag-badge></li>
        }
      </ul>

      <form class="ag-card pseudo" (submit)="onSubmit($event)" novalidate>
        <label for="pseudo">Choisissez votre pseudonyme <span aria-hidden="true">*</span></label>
        <input
          id="pseudo"
          name="pseudo"
          type="text"
          autocomplete="off"
          required
          [attr.maxlength]="maxLength"
          [value]="pseudo()"
          (input)="onInput($event)"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? 'pseudo-aide pseudo-erreur' : 'pseudo-aide'"
        />
        <p id="pseudo-aide" class="note">ℹ Aucune donnée n'est envoyée à un serveur.</p>
        @if (error()) {
          <p id="pseudo-erreur" role="alert" class="erreur">Saisissez un pseudonyme pour commencer.</p>
        }
        <button type="submit" class="ag-btn ag-btn--go">▶ Commencer l'expérience</button>
      </form>

      @if (store.hasPseudo()) {
        <div class="ag-card reset">
          @if (!confirmReset()) {
            <button type="button" class="ag-btn ag-btn--danger" (click)="confirmReset.set(true)">↺ Recommencer à zéro</button>
          } @else {
            <p role="alert">Votre progression et vos points seront effacés sur cet ordinateur.</p>
            <div class="reset__actions">
              <button type="button" class="ag-btn ag-btn--danger" (click)="reset()">Oui, tout effacer</button>
              <button type="button" class="ag-btn ag-btn--primary" (click)="confirmReset.set(false)">Annuler</button>
            </div>
          }
        </div>
      }

      <p class="note">~20 minutes · 5 défis · aucune installation</p>
    </div>
  `,
  styles: `
    .accueil { text-align: center; }
    .accueil__icon { font-size: 44px; margin: 0; }
    h1 { font-size: 2rem; letter-spacing: 0.05em; color: var(--ag-cyan); }
    .accueil__tagline { color: #cbd5e1; }
    .ag-card { text-align: left; }
    .defis { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; list-style: none; padding: 0; }
    .pseudo { text-align: center; border: 2px solid var(--ag-cyan); display: grid; gap: 8px; justify-items: center; }
    input { font: inherit; font-size: 18px; text-align: center; width: min(22rem, 100%); padding: 8px 12px; border-radius: 8px; border: 2px solid var(--ag-cyan); background: var(--ag-bg); color: var(--ag-text); }
    input[aria-invalid='true'] { border-color: var(--ag-red); }
    .note { color: #cbd5e1; font-size: 14px; margin: 0.25rem 0; }
    .erreur { color: var(--ag-red); font-weight: 700; margin: 0; }
    .reset { text-align: center; }
    .reset__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 0.75rem; }
  `,
})
export class AccueilComponent {
  protected readonly store = inject(GameStore);
  private readonly router = inject(Router);

  protected readonly defis = DEFIS;
  protected readonly maxLength = PSEUDO_MAX_LENGTH;
  protected readonly pseudo = signal(this.store.pseudo());
  protected readonly error = signal(false);
  protected readonly confirmReset = signal(false);

  protected reset(): void {
    this.store.reset();
    this.pseudo.set('');
    this.error.set(false);
    this.confirmReset.set(false);
  }

  protected onInput(event: Event): void {
    this.pseudo.set((event.target as HTMLInputElement).value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.store.setPseudo(this.pseudo())) {
      this.error.set(true);
      return;
    }
    this.error.set(false);
    void this.router.navigate(this.store.resumeRoute());
  }
}

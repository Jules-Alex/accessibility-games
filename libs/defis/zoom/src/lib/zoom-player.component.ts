import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { DefiSession } from '@ag/state';
import {
  MOTIFS,
  ORDER_NUMBER,
  PROMO_CODE,
  matchesMotif,
  matchesOrderNumber,
  matchesPromoCode,
} from './zoom-content';

/**
 * Page de réclamation « non adaptée au zoom », affichée à 400 % : 1280 px de large agrandis par `zoom: 4`,
 * dans une zone qui défile dans les deux sens. Les pièges (bandeau fixe, cookies, texte tronqué,
 * code promo et bouton hors champ) viennent de cette mise en page, pas d'un bug.
 */
@Component({
  selector: 'ag-zoom-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="viewport" role="region" aria-label="Page de réclamation affichée à 400 %" tabindex="0">
      <div class="page">
        <header class="bandeau"><span>☰ Menu</span><span>Mon compte</span><span>Aide</span></header>

        <div class="grille">
          <div class="bloc bloc--recap">
            <h2>Récapitulatif</h2>
            <p>
              Commande n°
              <button
                type="button"
                class="num"
                [class.num--ouvert]="expanded()"
                [attr.aria-expanded]="expanded()"
                title="Cliquer pour afficher le numéro complet"
                (click)="expanded.set(true)"
              >{{ orderNumber }}</button>
            </p>
            <p>Livraison prévue : 12/10</p>
          </div>

          <form class="champs" (submit)="$event.preventDefault()" novalidate>
            <div class="bloc bloc--ref">
              <h2>Votre réclamation</h2>
              <label for="zoom-ref">Référence</label>
              <input id="zoom-ref" type="text" autocomplete="off" [value]="ref()" (input)="ref.set(valueOf($event))" />
            </div>
            <div class="bloc bloc--motif">
              <h2>Motif de la réclamation</h2>
              <label for="zoom-motif">Motif</label>
              <select id="zoom-motif" (change)="motif.set(valueOf($event))">
                <option value="">— Choisir —</option>
                @for (m of motifs; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="bloc bloc--code">
              <h2>Avez-vous un code ?</h2>
              <label for="zoom-promo">Code promo</label>
              <input id="zoom-promo" type="text" autocomplete="off" [value]="promo()" (input)="promo.set(valueOf($event))" />
            </div>
          </form>

          <aside class="bloc bloc--promo promo">
            <strong>Offre du moment&nbsp;!</strong>
            <span>Code promo : <b>{{ promoCode }}</b></span>
          </aside>

          <section class="bloc bloc--texte bloc--suivi">
            <h2>Suivi de livraison</h2>
            <p>Votre colis a quitté l'entrepôt de Lyon le 08/10 et poursuit son acheminement vers votre point relais. Livraison estimée entre 9 h et 18 h.</p>
          </section>
          <section class="bloc bloc--texte bloc--histo">
            <h2>Historique</h2>
            <p>03/10 : commande validée<br />04/10 : paiement accepté<br />08/10 : colis expédié</p>
          </section>
          <section class="bloc bloc--texte bloc--aide">
            <h2>Besoin d'aide&nbsp;?</h2>
            <p>Notre service client répond du lundi au vendredi, de 9 h à 18 h.</p>
          </section>

          <div class="bloc bloc--actions">
            <button type="button" class="valider" (click)="validate()">Valider la commande</button>
          </div>
        </div>

        @if (!cookiesAccepted()) {
          <div class="cookies" role="region" aria-label="Cookies">
            <span>🍪 Nous utilisons des cookies</span>
            <button type="button" class="cookies__ok" (click)="cookiesAccepted.set(true)">Accepter</button>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .viewport { height: clamp(420px, 70vh, 720px); overflow: auto; background: #fff; color: #1e293b; border: 3px solid #475569; border-radius: 10px; }
    .page { zoom: 4; width: 1280px; font: 16px/1.4 system-ui, sans-serif; }
    .bandeau { position: sticky; top: 0; z-index: 2; display: flex; gap: 24px; background: #555; color: #fff; padding: 12px 16px; font-size: 22px; }
    .grille { display: grid; grid-template-columns: 290px 560px 320px; column-gap: 34px; row-gap: 25px; padding: 16px; }
    .champs { display: contents; }
    h2 { margin: 0 0 8px; font-size: 20px; }
    .bloc { min-width: 0; }
    .bloc--recap { grid-area: 1 / 1; min-height: 110px; }
    .bloc--ref { grid-area: 1 / 2; }
    .bloc--promo { grid-area: 1 / 3; }
    .bloc--suivi { grid-area: 2 / 1 / 3 / 3; min-height: 150px; }
    .bloc--histo { grid-area: 2 / 3; }
    .bloc--motif { grid-area: 3 / 1; min-height: 130px; }
    .bloc--code { grid-area: 3 / 2; }
    .bloc--aide { grid-area: 3 / 3; }
    .bloc--actions { grid-area: 4 / 3; justify-self: end; }
    label { display: block; margin: 4px 0; }
    input, select { font: inherit; padding: 4px 8px; width: 100%; box-sizing: border-box; }
    .num { font: inherit; color: inherit; background: none; border: 0; border-bottom: 1px dotted; padding: 0; cursor: pointer; display: inline-block; max-width: 7ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
    .num--ouvert { max-width: none; overflow: visible; }
    .promo { display: grid; gap: 6px; align-content: start; background: #fef3c7; padding: 12px; border-radius: 6px; }
    .valider { font-size: 20px; padding: 8px 16px; background: #277a45; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
    /* Contour sombre à l'intérieur de la page blanche ; la zone défilante elle-même garde le contour jaune global (visible sur le fond sombre de l'application). */
    .page :focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
    .cookies { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: space-between; gap: 16px; background: #fef3c7; border-top: 3px solid #d97706; padding: 10px 16px; font-size: 18px; }
  `,
})
export class ZoomPlayerComponent {
  private readonly session = inject(DefiSession);

  protected readonly orderNumber = ORDER_NUMBER;
  protected readonly promoCode = PROMO_CODE;
  protected readonly motifs = MOTIFS;

  protected readonly expanded = signal(false);
  protected readonly ref = signal('');
  protected readonly motif = signal('');
  protected readonly promo = signal('');
  protected readonly cookiesAccepted = signal(false);
  private readonly validated = signal(false);

  constructor() {
    // Une étape est validée dès que sa condition est vraie, dans l'ordre : la progression rattrape
    // une page remplie dans le désordre. Après chaque validation, l'effet se relance pour l'étape suivante.
    effect(() => {
      const done = this.session.stepsDone();
      const last = this.session.stepsTotal() - 1;
      // Étapes intermédiaires dans l'ordre ; réduire `stepsTotal` retire les dernières (code promo en premier).
      const intermediate = [
        this.expanded() || matchesOrderNumber(this.ref()),
        matchesOrderNumber(this.ref()),
        matchesMotif(this.motif()),
        matchesPromoCode(this.promo()),
      ];
      // La dernière étape est toujours « Valider la commande ».
      const met = done < last ? intermediate[done] : done === last && this.validated();
      if (met) {
        untracked(() => this.session.completeStep());
      }
    });
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  /** Un clic n'est pris en compte que si toutes les étapes avant la dernière sont faites : un clic prématuré ne compte pas. */
  protected validate(): void {
    if (this.session.stepsDone() >= this.session.stepsTotal() - 1) {
      this.validated.set(true);
    }
  }
}

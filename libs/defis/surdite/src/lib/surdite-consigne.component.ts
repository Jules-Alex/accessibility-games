import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AlternativeMode } from './alternative-mode';
import { AudioService } from './audio.service';
import { MAX_LISTENS, TEST_CLIP } from './surdite-content';

/** Bloc de l'écran de consigne : casque, test du son (déjà dégradé), écoutes et alternative (transcription). */
@Component({
  selector: 'ag-surdite-consigne',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="test">
      <p class="test__titre">🎧 <strong>Mettez votre casque</strong> et réglez le volume</p>
      <button type="button" class="ag-btn ag-btn--primary" (click)="test()">🔊 Tester le son</button>
      <p class="test__statut" role="status">
        @if (audio.failed()) {
          Le son n'a pas pu être joué sur cet appareil : activez la transcription ci-dessous.
        }
      </p>
      <p class="test__rappels">🔁 {{ max }} écoutes par étape (touche R)</p>
      <button type="button" class="test__lien" [attr.aria-pressed]="alternative.enabled()" (click)="alternative.toggle()">
        {{ alternative.enabled() ? "Transcription activée : elle s'affichera à chaque étape (désactiver)" : "Besoin d'une alternative (transcription) ?" }}
      </button>
    </div>
  `,
  styles: `
    .test { display: grid; gap: 8px; justify-items: start; }
    .test__titre, .test__statut, .test__rappels { margin: 0; }
    .test__statut { color: var(--ag-orange); font-weight: 700; }
    /* Vide, la zone reste dans l'arbre d'accessibilité (pour que l'annonce de l'échec soit lue) mais sans espace visible. */
    .test__statut:empty { position: absolute; width: 1px; height: 1px; padding: 0; margin: 0; overflow: hidden; }
    .test__rappels { font-size: 14px; color: #cbd5e1; }
    .test__lien { padding: 0; font: inherit; font-size: 14px; color: var(--ag-cyan); text-align: left; text-decoration: underline; cursor: pointer; background: none; border: 0; }
  `,
})
export class SurditeConsigneComponent {
  protected readonly audio = inject(AudioService);
  protected readonly alternative = inject(AlternativeMode);
  protected readonly max = MAX_LISTENS;

  constructor() {
    this.audio.reset();
    // Le son de test ne doit pas continuer une fois la consigne quittée.
    inject(DestroyRef).onDestroy(() => this.audio.stop());
  }

  protected test(): void {
    void this.audio.play(TEST_CLIP.url);
  }
}

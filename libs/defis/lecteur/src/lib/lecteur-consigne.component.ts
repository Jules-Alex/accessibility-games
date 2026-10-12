import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { VoiceService } from './voice.service';

/** Bloc de l'écran de consigne : casque, test de la voix, touches utiles. */
@Component({
  selector: 'ag-lecteur-consigne',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="test">
      <p class="test__titre">🎧 <strong>Mettez votre casque</strong> et réglez le volume</p>
      <button type="button" class="ag-btn ag-btn--primary" (click)="test()">🔊 Tester la voix</button>
      <p class="test__statut" role="status">
        @if (!voice.available()) {
          Aucune voix française détectée : des sous-titres s'afficheront à la place.
        }
      </p>
      @if (!voice.available() && voice.lastText()) {
        <p class="test__soustitres">Sous-titres : {{ voice.lastText() }}</p>
      }
      <p class="test__touches">Touches : Tab ou flèches pour naviguer · Entrée pour activer · R pour répéter</p>
    </div>
  `,
  styles: `
    .test { display: grid; gap: 8px; justify-items: start; }
    .test__titre, .test__statut, .test__soustitres, .test__touches { margin: 0; }
    .test__statut { color: var(--ag-orange); font-weight: 700; }
    .test__statut:empty { display: none; }
    .test__soustitres { padding: 4px 10px; background: var(--ag-bg); border-radius: 8px; }
    .test__touches { font-size: 14px; color: #cbd5e1; }
  `,
})
export class LecteurConsigneComponent {
  protected readonly voice = inject(VoiceService);

  constructor() {
    // Le test de la voix ne doit pas continuer à parler une fois la consigne quittée.
    inject(DestroyRef).onDestroy(() => this.voice.cancel());
  }

  protected test(): void {
    this.voice.speak('Test de la voix. Si vous entendez cette phrase, vous pouvez commencer.');
  }
}

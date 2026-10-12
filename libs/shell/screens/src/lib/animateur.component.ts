import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEFIS, UNLOCK_CODES } from '@ag/domain';

/** Écran réservé aux présentateurs : codes à donner après chaque débrief. */
@Component({
  selector: 'ag-animateur',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="animateur">
      <h1 tabindex="-1">Écran des présentateurs</h1>
      <p class="alerte">⚠ Ne partagez pas cet écran avec les participants.</p>
      <table class="ag-card">
        <caption class="ag-sr-only">Codes de déblocage à donner après chaque débrief</caption>
        <thead>
          <tr><th scope="col">Après le défi</th><th scope="col">Code à donner</th></tr>
        </thead>
        <tbody>
          @for (d of defis; track d.id) {
            <tr><th scope="row">{{ d.id }}. {{ d.icon }} {{ d.title }}</th><td class="code">{{ codes[d.id] }}</td></tr>
          }
        </tbody>
      </table>
      <p class="note">Mode sans animateur : ajoutez <code>?mode=autonome</code> à l'adresse (avant le <code>#</code>).</p>
    </section>
  `,
  styles: `
    .alerte { color: var(--ag-orange); font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--ag-border); }
    .code { font-size: 22px; font-weight: 800; letter-spacing: 0.2em; color: var(--ag-yellow); }
    .note { color: #cbd5e1; font-size: 14px; }
  `,
})
export class AnimateurComponent {
  protected readonly defis = DEFIS;
  protected readonly codes = UNLOCK_CODES;
}

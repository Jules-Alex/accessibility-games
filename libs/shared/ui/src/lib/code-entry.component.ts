import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'ag-code-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="code" (submit)="onSubmit($event)" novalidate>
      <label for="ag-code">🔑 Code de déblocage donné par les présentateurs</label>
      <div class="code__row">
        <input
          id="ag-code"
          name="code"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [value]="value()"
          (input)="onInput($event)"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="invalid() ? 'ag-code-err' : null"
        />
        <button type="submit" class="ag-btn ag-btn--go">Continuer ▶</button>
      </div>
      @if (invalid()) {
        @for (k of [attempt()]; track k) {
          <p id="ag-code-err" role="alert" class="code__err">Code incorrect. Redemandez-le aux présentateurs.</p>
        }
      }
    </form>
  `,
  styles: `
    .code { display: grid; gap: 6px; justify-items: center; text-align: center; }
    .code__row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    input { font: inherit; font-size: 18px; letter-spacing: 0.3em; text-align: center; width: 9rem; padding: 6px 10px; border-radius: 8px; border: 2px solid var(--ag-cyan); background: var(--ag-bg); color: var(--ag-text); }
    input[aria-invalid='true'] { border-color: var(--ag-red); }
    .code__err { margin: 0; color: var(--ag-red); font-weight: 700; }
  `,
})
export class CodeEntryComponent {
  readonly invalid = input(false);
  readonly submitted = output<string>();

  protected readonly value = signal('');
  /** Change à chaque envoi : le message d'erreur est recréé, donc ré-annoncé aux lecteurs d'écran. */
  protected readonly attempt = signal(0);

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.attempt.update((n) => n + 1);
    this.submitted.emit(this.value());
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'ag-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <a class="ag-skip" href="#contenu" (click)="skip($event)">Aller au contenu</a>
    <main id="contenu" tabindex="-1"><router-outlet /></main>
  `,
})
export class App {
  private readonly router = inject(Router);

  constructor() {
    // À chaque navigation, le focus va sur le titre de l'écran pour les lecteurs d'écran et le clavier.
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => document.querySelector<HTMLElement>('main h1')?.focus(), 0);
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected skip(event: Event): void {
    event.preventDefault();
    document.getElementById('contenu')?.focus();
  }
}

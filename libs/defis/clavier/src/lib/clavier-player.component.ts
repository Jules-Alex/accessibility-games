import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DefiSession } from '@ag/state';
import { DAYS, ROOMS, Room, TabId, isValidDate, isValidTime, nextTabId } from './clavier-content';

const MOUSE_MESSAGE_MS = 3000;

/**
 * Fausse application de réservation de salles, avec une souris inutilisable. Les pièges (contour de focus
 * retiré, menu muet, faux bouton, calendrier qui piège le focus, ordre de Tab incohérent) viennent de ce
 * composant, pas d'un bug : tout reste faisable au clavier.
 */
@Component({
  selector: 'ag-clavier-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="zone"
      role="region"
      aria-label="Application de réservation de salles (souris désactivée)"
      (keydown)="onZoneKey($event)"
    >
      <nav class="nav" aria-label="Navigation principale">
        <span class="logo">🏢 Intranet</span>
        <div class="menu">
          <div class="menu__item" data-tab="menu" tabindex="-1" (keydown.enter)="menuOpen.set(true)">Réservations ▾</div>
          @if (menuOpen()) {
            <ul class="sousmenu">
              <li>Salles</li>
              <li>Mes réservations</li>
            </ul>
          }
        </div>
        <a href="#" data-tab="annuaire" tabindex="-1" (click)="$event.preventDefault()">Annuaire</a>
        <a href="#" data-tab="aide" tabindex="0" (click)="$event.preventDefault()">Aide</a>
      </nav>

      <div class="contenu">
        <section class="salles">
          <h2>Salles disponibles</h2>
          @for (r of rooms; track r.id) {
            <div class="salle">
              <span>{{ r.label }} — {{ r.seats }} places</span>
              <div class="faux-bouton" [attr.data-tab]="r.id" tabindex="-1" (keydown.space)="choose(r.id, $event)">Choisir</div>
            </div>
          }
          <p class="selection">Salle sélectionnée : {{ roomLabel() }}</p>
        </section>

        <section class="creneau">
          <h2>Date et heure</h2>
          <label for="clavier-date">Date</label>
          <div class="ligne">
            <input
              id="clavier-date"
              data-tab="date"
              tabindex="-1"
              type="text"
              autocomplete="off"
              placeholder="jj/mm/aaaa"
              [value]="date()"
              (input)="date.set(valueOf($event))"
            />
            <button type="button" data-tab="calendrier" tabindex="-1" aria-label="Ouvrir le calendrier" (click)="openCalendar()">📅</button>
          </div>
          <label for="clavier-heure">Heure de début</label>
          <input
            id="clavier-heure"
            data-tab="heure"
            tabindex="-1"
            type="text"
            autocomplete="off"
            placeholder="hh:mm"
            [value]="time()"
            (input)="time.set(valueOf($event))"
          />
          <button type="button" class="confirmer" data-tab="confirmer" tabindex="-1" (click)="validate()">Confirmer la réservation</button>
        </section>
      </div>

      @if (calendarOpen()) {
        <div class="calendrier" role="dialog" aria-modal="true" aria-label="Calendrier" (keydown)="onDialogKey($event)">
          <p class="calendrier__titre">Octobre 2026</p>
          <div class="jours">
            @for (d of days; track d) {
              <button type="button" class="jour" [attr.aria-label]="d" (click)="pickDay(d)">{{ d.slice(0, 2) }}</button>
            }
          </div>
          <button type="button" class="fermer" (click)="closeCalendar()">Fermer</button>
        </div>
      }

      <div class="souris" aria-hidden="true" (mousedown)="$event.preventDefault()" (click)="onMouse()"></div>
      <div class="greve" role="status">
        @if (mouseMessage()) {
          🐭 La souris est en grève&nbsp;! Essayez la touche Tab
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .zone { position: relative; min-height: 420px; overflow: hidden; background: #fff; color: #1e293b; border: 3px solid #475569; border-radius: 10px; font: 16px/1.4 system-ui, sans-serif; }
    .zone *:focus, .zone *:focus-visible { outline: none; }
    .nav { display: flex; gap: 24px; align-items: center; background: #555; color: #fff; padding: 10px 16px; }
    .logo { margin-right: auto; font-weight: 700; }
    .nav a { color: #fff; text-decoration: none; }
    .menu { position: relative; }
    .menu__item { cursor: default; }
    .sousmenu { position: absolute; top: 28px; left: 0; z-index: 3; margin: 0; padding: 8px 16px; list-style: none; background: #fff; color: #1e293b; border: 1px solid #94a3b8; border-radius: 4px; white-space: nowrap; }
    .contenu { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 16px; }
    h2 { margin: 0 0 8px; font-size: 18px; }
    .salle { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
    .faux-bouton { background: #277a45; color: #fff; padding: 4px 12px; border-radius: 4px; }
    .selection { margin: 12px 0 0; font-weight: 600; }
    label { display: block; margin: 8px 0 4px; }
    input { font: inherit; padding: 4px 8px; width: 100%; box-sizing: border-box; }
    .ligne { display: flex; gap: 8px; }
    .ligne button { padding: 0 10px; }
    .confirmer { margin-top: 16px; padding: 8px 16px; font: inherit; font-weight: 700; background: #1d4ed8; color: #fff; border: 0; border-radius: 6px; }
    .calendrier { position: absolute; top: 120px; right: 40px; z-index: 5; width: 280px; padding: 12px; background: #fff; border: 2px solid #1e293b; border-radius: 8px; box-shadow: 0 4px 16px rgb(0 0 0 / 0.3); }
    .calendrier__titre { margin: 0 0 8px; font-weight: 700; }
    .jours { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .jour, .fermer { font: inherit; padding: 4px 10px; }
    .souris { position: absolute; inset: 0; z-index: 10; cursor: none; }
    .greve { position: absolute; top: 8px; left: 50%; z-index: 11; transform: translateX(-50%); padding: 6px 14px; background: #1e293b; color: #fff; border: 2px solid #facc15; border-radius: 10px; font-weight: 700; pointer-events: none; }
    .greve:empty { display: none; }
  `,
})
export class ClavierPlayerComponent {
  private readonly session = inject(DefiSession);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly rooms = ROOMS;
  protected readonly days = DAYS;

  protected readonly menuOpen = signal(false);
  protected readonly room = signal<Room | null>(null);
  protected readonly date = signal('');
  protected readonly time = signal('');
  protected readonly calendarOpen = signal(false);
  protected readonly mouseMessage = signal(false);
  private readonly validated = signal(false);
  private mouseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Même schéma que le défi 1 : une étape est validée dès que sa condition est vraie, dans l'ordre ;
    // la dernière étape est toujours « Confirmer » ; réduire `stepsTotal` retire les dernières étapes intermédiaires.
    effect(() => {
      const done = this.session.stepsDone();
      const last = this.session.stepsTotal() - 1;
      const intermediate = [this.menuOpen(), this.room() === 'turing', isValidDate(this.date()), isValidTime(this.time())];
      const met = done < last ? intermediate[done] : done === last && this.validated();
      if (met) {
        untracked(() => this.session.completeStep());
      }
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.mouseTimer !== null) {
        clearTimeout(this.mouseTimer);
      }
    });
  }

  protected roomLabel(): string {
    const selected = ROOMS.find((r) => r.id === this.room());
    return selected ? selected.label : 'aucune';
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Piège C : seul Espace choisit ; Entrée et le clic ne font rien. */
  protected choose(room: Room, event: Event): void {
    event.preventDefault();
    this.room.set(room);
  }

  /** Souris bloquée : le calque absorbe tout clic et annonce la grève pendant 3 s après le dernier clic. */
  protected onMouse(): void {
    this.mouseMessage.set(true);
    if (this.mouseTimer !== null) {
      clearTimeout(this.mouseTimer);
    }
    this.mouseTimer = setTimeout(() => this.mouseMessage.set(false), MOUSE_MESSAGE_MS);
  }

  /** Piège F : la séquence de Tab est pilotée ici ; aux deux bouts, le navigateur reprend la main. */
  protected onZoneKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || this.calendarOpen()) {
      return;
    }
    // Raccourcis système (Ctrl/Alt/Méta+Tab), saisie en cours de composition ou événement déjà traité : on ne s'en mêle pas.
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    const current = (event.target as HTMLElement).closest<HTMLElement>('[data-tab]')?.dataset['tab'] as TabId | undefined;
    if (!current) {
      return;
    }
    const next = nextTabId(current, event.shiftKey);
    if (next === null) {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
  }

  protected openCalendar(): void {
    this.calendarOpen.set(true);
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('.calendrier .jour')?.focus(), {
      injector: this.injector,
    });
  }

  protected pickDay(day: string): void {
    this.date.set(day);
  }

  /** Piège G : à la fermeture, le focus retourne au début de la page (« Aide »), pas sur le champ date. */
  protected closeCalendar(): void {
    this.calendarOpen.set(false);
    this.host.nativeElement.querySelector<HTMLElement>('[data-tab="aide"]')?.focus();
  }

  /** Piège D : Tab boucle dans la fenêtre ; Échap (et toute autre touche) ne fait rien. */
  protected onDialogKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    event.stopPropagation();
    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.calendrier button'));
    const first = items[0];
    const last = items[items.length - 1];
    if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    }
  }

  /** Un clic n'est pris en compte que si toutes les étapes avant la dernière sont faites. */
  protected validate(): void {
    if (this.session.stepsDone() >= this.session.stepsTotal() - 1) {
      this.validated.set(true);
    }
  }
}

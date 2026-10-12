import { TestBed } from '@angular/core/testing';
import { DefiSession } from '@ag/state';
import { DAYS, TAB_ORDER } from './clavier-content';
import { ClavierPlayerComponent } from './clavier-player.component';

function key(target: Element, k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function setup(stepsTotal = 5) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [DefiSession] });
  const session = TestBed.inject(DefiSession);
  session.configure(stepsTotal);
  const fixture = TestBed.createComponent(ClavierPlayerComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const settle = () => {
    for (let i = 0; i < 8; i++) {
      fixture.detectChanges();
    }
  };
  const tab = (id: string) => el.querySelector(`[data-tab="${id}"]`) as HTMLElement;
  const q = <T extends HTMLElement>(selector: string) => el.querySelector(selector) as T;
  return {
    el,
    session,
    settle,
    tab,
    q,
    openMenu: () => {
      key(tab('menu'), 'Enter');
      settle();
    },
    chooseTuring: () => {
      key(tab('turing'), ' ');
      settle();
    },
    type: (id: string, value: string) => {
      const input = tab(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      settle();
    },
    confirm: () => {
      tab('confirmer').click();
      settle();
    },
    openCalendar: () => {
      tab('calendrier').click();
      settle();
    },
  };
}

describe('ClavierPlayerComponent : progression', () => {
  it('démarre sans aucune étape validée', () => {
    expect(setup().session.stepsDone()).toBe(0);
  });

  it('joue le parcours complet au clavier et rapporte 50 points', () => {
    const { session, openMenu, chooseTuring, type, confirm } = setup();
    openMenu();
    expect(session.stepsDone()).toBe(1);
    chooseTuring();
    expect(session.stepsDone()).toBe(2);
    type('date', '12/10/2026');
    expect(session.stepsDone()).toBe(3);
    type('heure', '09:30');
    expect(session.stepsDone()).toBe(4);
    confirm();
    expect(session.stepsDone()).toBe(5);
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(50);
  });

  it('n\'avance pas avec une mauvaise salle, une date impossible ou une heure impossible', () => {
    const { session, tab, settle, openMenu, type } = setup();
    openMenu();
    key(tab('hopper'), ' ');
    settle();
    expect(session.stepsDone()).toBe(1);
    key(tab('turing'), ' ');
    settle();
    type('date', '31/02/2026');
    expect(session.stepsDone()).toBe(2);
    type('date', '12/10/2026');
    type('heure', '24:00');
    expect(session.stepsDone()).toBe(3);
  });

  it('rattrape la progression quand la page est remplie dans le désordre', () => {
    const { session, openMenu, chooseTuring, type } = setup();
    type('heure', '9h30');
    type('date', '12/10/2026');
    chooseTuring();
    expect(session.stepsDone()).toBe(0);
    openMenu();
    expect(session.stepsDone()).toBe(4);
  });

  it('ignore un clic prématuré sur « Confirmer » et ne le garde pas en mémoire', () => {
    const { session, openMenu, chooseTuring, type, confirm } = setup();
    openMenu();
    confirm();
    expect(session.stepsDone()).toBe(1);
    chooseTuring();
    type('date', '12/10/2026');
    type('heure', '09:30');
    expect(session.stepsDone()).toBe(4);
    confirm();
    expect(session.stepsDone()).toBe(5);
  });

  it('suit stepsTotal : à 4 étapes, la dernière est « Confirmer » et l\'heure disparaît', () => {
    const { session, openMenu, chooseTuring, type, confirm } = setup(4);
    openMenu();
    chooseTuring();
    type('date', '12/10/2026');
    expect(session.stepsDone()).toBe(3);
    confirm();
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(40);
  });
});

describe('ClavierPlayerComponent : pièges A à C', () => {
  it('B : le sous-menu s\'ouvre avec Entrée seulement, sans indication accessible', () => {
    const { tab, q, settle, el } = setup();
    expect(el.querySelector('.sousmenu')).toBeNull();
    key(tab('menu'), ' ');
    key(tab('menu'), 'ArrowDown');
    tab('menu').click();
    settle();
    expect(el.querySelector('.sousmenu')).toBeNull();
    key(tab('menu'), 'Enter');
    settle();
    expect(q('.sousmenu')).not.toBeNull();
    expect(tab('menu').hasAttribute('aria-expanded')).toBe(false);
    expect(tab('menu').hasAttribute('role')).toBe(false);
  });

  it('C : le faux bouton « Choisir » est un div qui obéit à Espace et pas à Entrée ni au clic', () => {
    const { session, tab, settle, q, openMenu } = setup();
    openMenu();
    expect(tab('turing').tagName).toBe('DIV');
    key(tab('turing'), 'Enter');
    tab('turing').click();
    settle();
    expect(session.stepsDone()).toBe(1);
    expect(q('.selection').textContent).not.toContain('Turing');
    const space = key(tab('turing'), ' ');
    settle();
    expect(space.defaultPrevented).toBe(true);
    expect(session.stepsDone()).toBe(2);
    expect(q('.selection').textContent).toContain('Salle Turing');
  });

  it('C : choisir la salle Hopper est possible mais ne valide pas l\'étape 2', () => {
    const { session, tab, settle, q, openMenu } = setup();
    openMenu();
    key(tab('hopper'), ' ');
    settle();
    expect(q('.selection').textContent).toContain('Salle Hopper');
    expect(session.stepsDone()).toBe(1);
  });

  it('A : la règle outline: none est présente dans le style du composant (test sur le texte source)', () => {
    // jest-preset-angular vide `styles` à la compilation (ɵcmp.styles est donc vide) : on lit le source du composant.
    const source: string = require('node:fs').readFileSync(require('node:path').join(__dirname, 'clavier-player.component.ts'), 'utf8');
    expect(source).toMatch(/\.zone \*:focus[^}]*\{\s*outline:\s*none/);
  });
});

describe('ClavierPlayerComponent : piège F, ordre de Tab', () => {
  it('seul « Aide » est atteignable naturellement ; les autres éléments sont pilotés par le code', () => {
    const { tab } = setup();
    for (const id of TAB_ORDER) {
      expect(tab(id)).not.toBeNull();
      expect(tab(id).getAttribute('tabindex')).toBe(id === 'aide' ? '0' : '-1');
    }
  });

  it('suit l\'ordre incohérent avec Tab et empêche le comportement natif', () => {
    const { tab } = setup();
    for (let i = 0; i < TAB_ORDER.length - 1; i++) {
      const next = tab(TAB_ORDER[i + 1]);
      const spy = jest.spyOn(next, 'focus');
      const event = key(tab(TAB_ORDER[i]), 'Tab');
      expect(event.defaultPrevented).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it('recule avec Maj+Tab', () => {
    const { tab } = setup();
    const spy = jest.spyOn(tab('hopper'), 'focus');
    const event = key(tab('turing'), 'Tab', { shiftKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('rend la main au navigateur aux deux bouts de la séquence', () => {
    const { tab } = setup();
    expect(key(tab('confirmer'), 'Tab').defaultPrevented).toBe(false);
    expect(key(tab('aide'), 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
  });

  it.each(['ctrlKey', 'altKey', 'metaKey', 'isComposing'] as const)('ignore Tab quand %s est actif', (modifier) => {
    const { tab } = setup();
    const spy = jest.spyOn(tab(TAB_ORDER[1]), 'focus');
    const event = key(tab(TAB_ORDER[0]), 'Tab', { [modifier]: true });
    expect(event.defaultPrevented).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ignore un Tab déjà annulé avant d\'atteindre la zone', () => {
    const { q, tab } = setup();
    q('section.zone').addEventListener('keydown', (e) => e.preventDefault(), { capture: true });
    const spy = jest.spyOn(tab(TAB_ORDER[1]), 'focus');
    const event = key(tab(TAB_ORDER[0]), 'Tab');
    expect(event.defaultPrevented).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('ClavierPlayerComponent : souris bloquée', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('affiche le message de la grève au clic et ne valide rien', () => {
    const { session, q, settle } = setup();
    expect(q('.greve').getAttribute('role')).toBe('status');
    expect(q('.greve').textContent?.trim()).toBe('');
    q<HTMLElement>('.souris').click();
    settle();
    expect(q('.greve').textContent).toContain('La souris est en grève');
    expect(q('.greve').textContent).toContain('Tab');
    expect(session.stepsDone()).toBe(0);
  });

  it('masque le message 3 s après le dernier clic, sans cumuler les minuteurs', () => {
    const { q, settle } = setup();
    q<HTMLElement>('.souris').click();
    jest.advanceTimersByTime(2000);
    q<HTMLElement>('.souris').click();
    jest.advanceTimersByTime(1500);
    settle();
    expect(q('.greve').textContent).toContain('La souris est en grève');
    jest.advanceTimersByTime(1500);
    settle();
    expect(q('.greve').textContent?.trim()).toBe('');
  });

  it('cache le calque de souris aux technologies d\'assistance', () => {
    const { q } = setup();
    expect(q('.souris').getAttribute('aria-hidden')).toBe('true');
  });

  it('mousedown sur le calque est annulé et ne fait pas perdre le focus', () => {
    const { el, q, tab } = setup();
    document.body.appendChild(el);
    try {
      tab('aide').focus();
      expect(document.activeElement).toBe(tab('aide'));
      const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      q('.souris').dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(tab('aide'));
    } finally {
      el.remove();
    }
  });
});

describe('ClavierPlayerComponent : calendrier (pièges D et G)', () => {
  it('s\'ouvre dans une fenêtre modale et propose les jours', () => {
    const { q, openCalendar, el } = setup();
    expect(el.querySelector('.calendrier')).toBeNull();
    openCalendar();
    const dialog = q('.calendrier');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el.querySelectorAll('.calendrier .jour')).toHaveLength(DAYS.length);
    expect(q('.calendrier .fermer')).not.toBeNull();
  });

  it('le focus entre dans le calendrier à l\'ouverture (premier jour)', () => {
    const { el, q, openCalendar } = setup();
    document.body.appendChild(el);
    try {
      openCalendar();
      expect(document.activeElement).toBe(q('.calendrier .jour'));
    } finally {
      el.remove();
    }
  });

  it('D : Échap ne ferme pas le calendrier', () => {
    const { q, openCalendar, settle, el } = setup();
    openCalendar();
    key(q('.calendrier .jour'), 'Escape');
    key(q('.calendrier'), 'Escape');
    settle();
    expect(el.querySelector('.calendrier')).not.toBeNull();
  });

  it('D : Tab boucle dans la fenêtre (du dernier élément au premier, et inversement)', () => {
    const { q, openCalendar } = setup();
    openCalendar();
    const first = q('.calendrier .jour');
    const last = q('.calendrier .fermer');
    const spyFirst = jest.spyOn(first, 'focus');
    const spyLast = jest.spyOn(last, 'focus');
    expect(key(last, 'Tab').defaultPrevented).toBe(true);
    expect(spyFirst).toHaveBeenCalledTimes(1);
    expect(key(first, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(spyLast).toHaveBeenCalledTimes(1);
  });

  it('D : la séquence de Tab de la page ne s\'applique pas dans la fenêtre', () => {
    const { q, tab, openCalendar } = setup();
    openCalendar();
    const spy = jest.spyOn(tab('menu'), 'focus');
    const middle = q('.calendrier .jour');
    expect(key(middle, 'Tab').defaultPrevented).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('choisir un jour remplit la date sans fermer le calendrier', () => {
    const { q, tab, openCalendar, settle, el } = setup();
    openCalendar();
    q<HTMLButtonElement>('.calendrier .jour').click();
    settle();
    expect((tab('date') as HTMLInputElement).value).toBe(DAYS[0]);
    expect(el.querySelector('.calendrier')).not.toBeNull();
  });

  it('G : fermer le calendrier remet le focus sur « Aide » et conserve la date', () => {
    const { q, tab, openCalendar, settle, el } = setup();
    openCalendar();
    q<HTMLButtonElement>('.calendrier .jour').click();
    settle();
    const spyAide = jest.spyOn(tab('aide'), 'focus');
    const spyDate = jest.spyOn(tab('date'), 'focus');
    q<HTMLButtonElement>('.calendrier .fermer').click();
    settle();
    expect(el.querySelector('.calendrier')).toBeNull();
    expect(spyAide).toHaveBeenCalledTimes(1);
    expect(spyDate).not.toHaveBeenCalled();
    expect((tab('date') as HTMLInputElement).value).toBe(DAYS[0]);
  });

  it('un jour choisi dans le calendrier valide l\'étape de la date', () => {
    const { session, q, openMenu, chooseTuring, openCalendar, settle } = setup();
    openMenu();
    chooseTuring();
    openCalendar();
    q<HTMLButtonElement>('.calendrier .jour').click();
    settle();
    expect(session.stepsDone()).toBe(3);
  });
});

describe('ClavierPlayerComponent : structure et accessibilité de la zone', () => {
  it('nomme la région et libelle les champs', () => {
    const { q, el } = setup();
    const zone = q('section.zone');
    expect(zone.getAttribute('role')).toBe('region');
    expect(zone.getAttribute('aria-label')).toContain('souris désactivée');
    for (const id of ['clavier-date', 'clavier-heure']) {
      expect(el.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });
});

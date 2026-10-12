import { TestBed } from '@angular/core/testing';
import { DefiSession, RANDOM } from '@ag/state';
import { STEPS } from './lecteur-content';
import { LecteurPlayerComponent } from './lecteur-player.component';
import { ParisTracker } from './paris-tracker';
import { VOICE_PORT, VoicePort } from './voice.service';

function fakePort(withFrench: boolean): VoicePort & { spoken: string[]; cancelled: number } {
  const port = {
    spoken: [] as string[],
    cancelled: 0,
    voices: () => (withFrench ? [{ lang: 'fr-FR', name: 'Amelie' }] : [{ lang: 'en-US', name: 'Alex' }]),
    speak: (text: string) => {
      port.spoken.push(text);
      return new Promise<void>(() => undefined);
    },
    cancel: () => {
      port.cancelled += 1;
    },
    onVoicesChanged: () => undefined,
  };
  return port;
}

function key(target: Element, k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function setup(options: { stepsTotal?: number; french?: boolean; rng?: () => number } = {}) {
  const port = fakePort(options.french ?? true);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      DefiSession,
      { provide: VOICE_PORT, useValue: port },
      { provide: RANDOM, useValue: options.rng ?? (() => 0.5) },
    ],
  });
  const session = TestBed.inject(DefiSession);
  session.configure(options.stepsTotal ?? 4);
  const tracker = TestBed.inject(ParisTracker);
  const fixture = TestBed.createComponent(LecteurPlayerComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const settle = () => {
    for (let i = 0; i < 8; i++) {
      fixture.detectChanges();
    }
  };
  const zone = () => el.querySelector('section.zone') as HTMLElement;
  const ids = () => Array.from(el.querySelectorAll('ul.liste li')).map((li) => li.getAttribute('data-id'));
  const activeId = () => el.querySelector('ul.liste li[data-active="true"]')?.getAttribute('data-id') ?? null;
  const press = (k: string, init: KeyboardEventInit = {}) => {
    const event = key(zone(), k, init);
    settle();
    return event;
  };
  /** Avance avec Tab jusqu'à l'élément demandé (échoue s'il n'existe pas). */
  const goTo = (id: string) => {
    for (let i = 0; i < 6 && activeId() !== id; i++) {
      press('Tab');
    }
    if (activeId() !== id) {
      throw new Error(`Élément introuvable : ${id}`);
    }
  };
  const choose = (id: string) => {
    goTo(id);
    press('Enter');
  };
  const typeEmail = (value: string, k = 'Enter') => {
    goTo('champ');
    const input = el.querySelector('input.champ') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    const event = key(input, k);
    settle();
    return event;
  };
  return { fixture, el, session, tracker, port, zone, ids, activeId, press, goTo, choose, typeEmail, settle };
}

describe('LecteurPlayerComponent : entrée et lecture', () => {
  it('lit l\'introduction de la première étape et démarre sans étape validée', () => {
    const { port, session, ids } = setup();
    expect(port.spoken).toEqual([STEPS[0].intro]);
    expect(session.stepsDone()).toBe(0);
    expect(ids().sort()).toEqual(['dupont', 'durand', 'martin']);
  });

  it('est une région nommée et focusable', () => {
    const { zone } = setup();
    expect(zone().getAttribute('role')).toBe('region');
    expect(zone().getAttribute('aria-label')).toContain('écran masqué');
    expect(zone().getAttribute('tabindex')).toBe('0');
  });

  it('lit l\'élément atteint avec Tab, les flèches et Maj+Tab, et empêche le comportement natif', () => {
    const { port, press, activeId } = setup();
    const first = press('Tab');
    expect(first.defaultPrevented).toBe(true);
    const firstId = activeId();
    expect(firstId).not.toBeNull();
    expect(port.spoken[port.spoken.length - 1]).toBe('lien, cliquez ici');
    press('ArrowDown');
    const second = activeId();
    press('ArrowRight');
    const third = activeId();
    expect(new Set([firstId, second, third]).size).toBe(3);
    press('ArrowUp');
    expect(activeId()).toBe(second);
    const back = press('Tab', { shiftKey: true });
    expect(back.defaultPrevented).toBe(true);
    expect(activeId()).not.toBe(second);
  });

  it('rend la main au navigateur aux deux bouts (jamais de piège clavier)', () => {
    const { press, ids } = setup();
    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(false);
    for (let i = 0; i < ids().length; i++) {
      press('Tab');
    }
    expect(press('Tab').defaultPrevented).toBe(false);
  });

  it('aux deux bouts, les flèches ne font pas défiler la page mais Tab reste libre', () => {
    const { press, ids } = setup();
    expect(press('ArrowUp').defaultPrevented).toBe(true);
    expect(press('ArrowLeft').defaultPrevented).toBe(true);
    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(false);
    for (let i = 0; i < ids().length; i++) {
      press('Tab');
    }
    expect(press('ArrowDown').defaultPrevented).toBe(true);
    expect(press('ArrowRight').defaultPrevented).toBe(true);
    expect(press('Tab').defaultPrevented).toBe(false);
  });

  it('répète la dernière phrase avec R', () => {
    const { port, press } = setup();
    press('Tab');
    const count = port.spoken.length;
    const event = press('r');
    expect(event.defaultPrevented).toBe(true);
    expect(port.spoken).toHaveLength(count + 1);
    expect(port.spoken[port.spoken.length - 1]).toBe('lien, cliquez ici');
    press('R');
    expect(port.spoken).toHaveLength(count + 2);
  });

  it('n\'active rien tant que le curseur n\'est sur aucun élément', () => {
    const { press, session } = setup();
    press('Enter');
    press(' ');
    expect(session.stepsDone()).toBe(0);
  });

  it('ignore les touches avec Ctrl, Alt ou Méta et les événements déjà annulés', () => {
    const { press, activeId, zone, settle } = setup();
    for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
      press('Tab', init);
      expect(activeId()).toBeNull();
    }
    zone().addEventListener('keydown', (e) => e.preventDefault(), { capture: true });
    key(zone(), 'Tab');
    settle();
    expect(activeId()).toBeNull();
  });
});

describe('LecteurPlayerComponent : paris et conséquences', () => {
  it('étape 1 : le bon lien valide l\'étape et compte un pari gagné', () => {
    const { session, tracker, choose, port } = setup();
    choose('dupont');
    expect(session.stepsDone()).toBe(1);
    expect(tracker.total()).toBe(1);
    expect(tracker.wins()).toBe(1);
    expect(port.spoken[port.spoken.length - 1]).toBe(STEPS[1].intro);
  });

  it('un mauvais choix dit et affiche la conséquence, recommence l\'étape et compte un pari perdu', () => {
    const { session, tracker, choose, port, el, activeId } = setup();
    choose('martin');
    expect(session.stepsDone()).toBe(0);
    expect(tracker.total()).toBe(1);
    expect(tracker.wins()).toBe(0);
    const spoken = port.spoken[port.spoken.length - 1];
    expect(spoken).toContain('Mauvais contrat ouvert');
    expect(spoken).toContain("L'étape recommence.");
    expect(spoken).toContain(STEPS[0].intro);
    const message = el.querySelector('.consequence') as HTMLElement;
    expect(message.getAttribute('role')).toBe('status');
    expect(message.textContent).toContain('Mauvais contrat ouvert');
    expect(activeId()).toBeNull();
  });

  it('remélange les options à chaque nouvelle tentative', () => {
    let calls = 0;
    const sequence = [0, 0.99, 0.5];
    const rng = () => sequence[calls++ % sequence.length];
    const { choose, ids } = setup({ rng });
    const first = ids().join(',');
    choose(ids().find((id) => id !== 'dupont') as string);
    expect(ids().join(',')).not.toBe(first);
  });

  it('étape 2 : les mauvaises icônes ont chacune leur conséquence', () => {
    const { choose, el, session } = setup();
    choose('dupont');
    choose('supprimer');
    expect(el.querySelector('.consequence')?.textContent).toContain('Document supprimé');
    choose('imprimer');
    expect(el.querySelector('.consequence')?.textContent).toContain('Impression lancée');
    expect(session.stepsDone()).toBe(1);
    choose('partager');
    expect(session.stepsDone()).toBe(2);
  });

  it('étape 3 : un e-mail invalide est refusé à voix haute, un e-mail valide fait avancer sans compter de pari', () => {
    const { choose, typeEmail, session, tracker, port } = setup();
    choose('dupont');
    choose('partager');
    expect(session.stepsDone()).toBe(2);
    const betsBefore = tracker.total();
    typeEmail('client');
    expect(session.stepsDone()).toBe(2);
    expect(port.spoken[port.spoken.length - 1]).toBe('Adresse invalide.');
    typeEmail('client@exemple.fr');
    expect(session.stepsDone()).toBe(3);
    expect(tracker.total()).toBe(betsBefore);
    expect(port.spoken[port.spoken.length - 1]).toContain('Adresse enregistrée.');
    expect(port.spoken[port.spoken.length - 1]).toContain(STEPS[3].intro);
  });

  it('parcours complet : 4 étapes, 40 points, 3 paris tous gagnés', () => {
    const { choose, typeEmail, session, tracker } = setup();
    choose('dupont');
    choose('partager');
    typeEmail('client@exemple.fr');
    choose('envoyer');
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(40);
    expect(tracker.total()).toBe(3);
    expect(tracker.wins()).toBe(3);
  });

  it('étape 4 : Annuler dit la conséquence et recommence l\'étape', () => {
    const { choose, typeEmail, session, el } = setup();
    choose('dupont');
    choose('partager');
    typeEmail('client@exemple.fr');
    choose('annuler');
    expect(el.querySelector('.consequence')?.textContent).toContain('Envoi annulé');
    expect(session.stepsDone()).toBe(3);
    choose('envoyer');
    expect(session.allDone()).toBe(true);
  });

  it('suit stepsTotal : à 3 étapes le défi se termine après l\'e-mail', () => {
    const { choose, typeEmail, session } = setup({ stepsTotal: 3 });
    choose('dupont');
    choose('partager');
    typeEmail('client@exemple.fr');
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(30);
  });
});

describe('LecteurPlayerComponent : champ e-mail', () => {
  it('les touches tapées dans le champ ne répètent, n\'activent ni ne naviguent', () => {
    const { choose, goTo, port, el, session, activeId } = setup();
    choose('dupont');
    choose('partager');
    goTo('champ');
    const input = el.querySelector('input.champ') as HTMLInputElement;
    const count = port.spoken.length;
    for (const k of ['r', 'R', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
      const event = key(input, k);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(port.spoken).toHaveLength(count);
    expect(activeId()).toBe('champ');
    expect(session.stepsDone()).toBe(2);
  });

  it('Tab depuis le champ rend la main au navigateur', () => {
    const { choose, goTo, el } = setup();
    choose('dupont');
    choose('partager');
    goTo('champ');
    const input = el.querySelector('input.champ') as HTMLInputElement;
    expect(key(input, 'Tab').defaultPrevented).toBe(false);
    expect(key(input, 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
  });

  it('place le focus sur le champ quand le curseur l\'atteint', () => {
    const { choose, goTo, el } = setup();
    document.body.appendChild(el);
    try {
      choose('dupont');
      choose('partager');
      goTo('champ');
      expect(document.activeElement).toBe(el.querySelector('input.champ'));
    } finally {
      el.remove();
    }
  });
});

describe('LecteurPlayerComponent : focus', () => {
  it('ramène le focus sur la zone après un e-mail valide (le champ disparaît)', () => {
    const { choose, typeEmail, zone, el, session } = setup();
    document.body.appendChild(el);
    try {
      choose('dupont');
      choose('partager');
      typeEmail('client@exemple.fr');
      expect(session.stepsDone()).toBe(3);
      expect(el.querySelector('input.champ')).toBeNull();
      expect(document.activeElement).toBe(zone());
    } finally {
      el.remove();
    }
  });

  it('ne vole pas le focus lors d\'un mauvais choix ou d\'un e-mail invalide', () => {
    const { choose, typeEmail, el } = setup();
    const outside = document.createElement('button');
    document.body.append(outside);
    document.body.appendChild(el);
    try {
      outside.focus();
      choose('martin');
      expect(document.activeElement).toBe(outside);
      choose('dupont');
      choose('partager');
      outside.focus();
      typeEmail('client');
      expect(document.activeElement).toBe(el.querySelector('input.champ'));
    } finally {
      el.remove();
      outside.remove();
    }
  });
});

describe('LecteurPlayerComponent : champ e-mail et retour dans la zone', () => {
  it('Maj+Tab hors du champ puis Tab : le curseur revient sur le champ, qui est relu et refocalisé', () => {
    const { choose, goTo, press, zone, el, port, activeId, settle } = setup();
    choose('dupont');
    choose('partager');
    goTo('champ');
    const input = el.querySelector('input.champ') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    // Maj+Tab depuis le champ : le navigateur (rendu ici par un focus) renvoie sur la zone.
    expect(key(input, 'Tab', { shiftKey: true }).defaultPrevented).toBe(false);
    zone().focus();
    settle();
    expect(document.activeElement).toBe(zone());
    expect(activeId()).toBeNull();
    const event = press('Tab');
    expect(event.defaultPrevented).toBe(true);
    expect(activeId()).toBe('champ');
    expect(document.activeElement).toBe(input);
    expect(port.spoken[port.spoken.length - 1]).toBe('zone de texte');
    // Tab depuis le champ rend toujours la main au navigateur.
    expect(key(input, 'Tab').defaultPrevented).toBe(false);
  });
});

describe('LecteurPlayerComponent : double activation', () => {
  it('deux Entrée avant le rendu ne valident qu\'une étape et ne comptent qu\'un pari', () => {
    const { goTo, zone, session, tracker, settle } = setup();
    goTo('dupont');
    key(zone(), 'Enter');
    key(zone(), 'Enter');
    settle();
    expect(session.stepsDone()).toBe(1);
    expect(tracker.total()).toBe(1);
  });

  it('deux Entrée sur un mauvais choix ne comptent qu\'un pari', () => {
    const { goTo, zone, tracker, settle } = setup();
    goTo('martin');
    key(zone(), 'Enter');
    key(zone(), 'Enter');
    settle();
    expect(tracker.total()).toBe(1);
  });

  it('deux Entrée dans le champ ne valident qu\'une étape', () => {
    const { choose, goTo, el, session, settle } = setup();
    choose('dupont');
    choose('partager');
    goTo('champ');
    const input = el.querySelector('input.champ') as HTMLInputElement;
    input.value = 'client@exemple.fr';
    input.dispatchEvent(new Event('input'));
    key(input, 'Enter');
    key(input, 'Enter');
    settle();
    expect(session.stepsDone()).toBe(3);
  });
});

describe('LecteurPlayerComponent : focus au démarrage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('prend le focus clavier dès le rendu quand il est sur le titre du défi', () => {
    const heading = document.createElement('h1');
    heading.tabIndex = -1;
    document.body.appendChild(heading);
    try {
      heading.focus();
      const { zone } = setup();
      expect(document.activeElement).toBe(zone());
    } finally {
      heading.remove();
    }
  });

  it('le reprend si l\'hôte replace le focus sur le titre juste après', () => {
    const heading = document.createElement('h1');
    heading.tabIndex = -1;
    document.body.appendChild(heading);
    try {
      const { zone } = setup();
      heading.focus();
      jest.advanceTimersByTime(100);
      expect(document.activeElement).toBe(zone());
    } finally {
      heading.remove();
    }
  });

  it('ne vole pas le focus à un bouton (Abandonner) déjà atteint', () => {
    const abandon = document.createElement('button');
    document.body.appendChild(abandon);
    try {
      const { zone } = setup();
      abandon.focus();
      jest.advanceTimersByTime(200);
      expect(document.activeElement).toBe(abandon);
      expect(document.activeElement).not.toBe(zone());
    } finally {
      abandon.remove();
    }
  });
});

describe('LecteurPlayerComponent : voix, sous-titres et nettoyage', () => {
  it('sans voix française, affiche les sous-titres de la dernière phrase', () => {
    const { el, press } = setup({ french: false });
    expect(el.querySelector('.sous-titres')?.textContent).toContain(STEPS[0].intro);
    press('Tab');
    expect(el.querySelector('.sous-titres')?.textContent).toContain('lien, cliquez ici');
  });

  it('avec une voix française, n\'affiche pas de sous-titres', () => {
    expect(setup({ french: true }).el.querySelector('.sous-titres')).toBeNull();
  });

  it('anime l\'onde pendant que la voix parle', () => {
    const { el } = setup();
    expect(el.querySelector('.onde')?.classList.contains('onde--active')).toBe(true);
  });

  it('coupe la voix quand le composant est détruit', () => {
    const { fixture, port } = setup();
    const before = port.cancelled;
    fixture.destroy();
    expect(port.cancelled).toBeGreaterThan(before);
  });

  it('repart de zéro le compteur de paris à chaque partie', () => {
    const first = setup();
    first.choose('martin');
    expect(first.tracker.total()).toBe(1);
    const second = setup();
    expect(second.tracker.total()).toBe(0);
  });
});

import { TestBed } from '@angular/core/testing';
import { DefiSession, RANDOM } from '@ag/state';
import { AUDIO_PORT, AudioPort } from './audio-port';
import { AlternativeMode } from './alternative-mode';
import { CLIPS } from './surdite-content';
import { SurditePlayerComponent } from './surdite-player.component';
import { SurditeTracker } from './surdite-tracker';

interface FakePort extends AudioPort {
  loads: string[];
  plays: string[];
  stops: number;
  finish(): void;
  failLoad: boolean;
}

function fakePort(): FakePort {
  let pending: (() => void)[] = [];
  const port: FakePort = {
    loads: [],
    plays: [],
    stops: 0,
    failLoad: false,
    load: (url) => {
      port.loads.push(url);
      return port.failLoad ? Promise.reject(new Error('introuvable')) : Promise.resolve(4.2);
    },
    play: (url) =>
      new Promise<void>((resolve) => {
        port.plays.push(url);
        pending.push(resolve);
      }),
    stop: () => {
      port.stops += 1;
      pending.forEach((r) => r());
      pending = [];
    },
    finish: () => {
      pending.forEach((r) => r());
      pending = [];
    },
  };
  return port;
}

const mounted: HTMLElement[] = [];

function setup(options: { stepsTotal?: number; port?: FakePort | null } = {}) {
  const port = options.port === undefined ? fakePort() : options.port;
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [DefiSession, { provide: RANDOM, useValue: () => 0.5 }, { provide: AUDIO_PORT, useValue: port }],
  });
  const session = TestBed.inject(DefiSession);
  session.configure(options.stepsTotal ?? 5);
  const tracker = TestBed.inject(SurditeTracker);
  const alternative = TestBed.inject(AlternativeMode);
  const fixture = TestBed.createComponent(SurditePlayerComponent);
  const el = fixture.nativeElement as HTMLElement;
  document.body.appendChild(el);
  mounted.push(el);
  fixture.detectChanges();
  const settle = async () => {
    for (let i = 0; i < 6; i++) {
      fixture.detectChanges();
      await Promise.resolve();
    }
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const option = (id: string) => el.querySelector(`button.reponse[data-id="${id}"]`) as HTMLButtonElement;
  const listenButton = () => el.querySelector('button.ecouter') as HTMLButtonElement;
  const question = () => el.querySelector('p.question') as HTMLElement;
  const left = () => (el.querySelector('.ecoutes') as HTMLElement).textContent?.trim();
  const pressR = async (key = 'r') => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await settle();
  };
  const pick = async (id: string) => {
    option(id).click();
    await settle();
  };
  const playAll = async () => {
    await pick('nom-dumont');
    await pick('dossier-4812');
    await pick('jour-mardi-14');
    await pick('alerte-urgence');
    await pick('bouton-droite');
  };
  return { fixture, el, session, tracker, alternative, port, settle, option, listenButton, question, left, pressR, pick, playAll };
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.remove();
  }
});

describe('SurditePlayerComponent : première étape', () => {
  it('pose la première question, propose les 4 noms et annonce 3 écoutes', async () => {
    const { el, question, left, settle } = setup();
    await settle();
    expect(question().textContent).toContain('Quel est le nom du client ?');
    expect(el.querySelectorAll('button.reponse')).toHaveLength(4);
    expect(left()).toBe('🔁 Écoutes restantes : 3 (touche R)');
    expect(el.querySelector('.transcription')).toBeNull();
  });

  it('précharge l\'extrait et affiche sa durée', async () => {
    const { el, port, settle } = setup();
    await settle();
    expect(port?.loads).toEqual([CLIPS[0].url]);
    expect(el.querySelector('.duree')?.textContent?.trim()).toBe('0:05');
  });

  it('ne lance aucune lecture tout seul', async () => {
    const { port, settle } = setup();
    await settle();
    expect(port?.plays).toEqual([]);
  });
});

describe('SurditePlayerComponent : écoutes', () => {
  it('le bouton lance l\'extrait et décompte une écoute ; l\'onde bouge pendant la lecture', async () => {
    const { el, port, listenButton, left, settle } = setup();
    listenButton().click();
    await settle();
    expect(port?.plays).toEqual([CLIPS[0].url]);
    expect(left()).toContain('Écoutes restantes : 2');
    expect(el.querySelector('.onde')?.classList.contains('onde--active')).toBe(true);
    port?.finish();
    await settle();
    expect(el.querySelector('.onde')?.classList.contains('onde--active')).toBe(false);
  });

  it('la touche R (majuscule ou minuscule) réécoute ; elle est ignorée pendant une lecture', async () => {
    const { port, pressR, left, settle } = setup();
    await pressR('r');
    expect(port?.plays).toHaveLength(1);
    await pressR('R');
    expect(port?.plays).toHaveLength(1);
    expect(left()).toContain('Écoutes restantes : 2');
    port?.finish();
    await settle();
    await pressR('R');
    expect(port?.plays).toHaveLength(2);
    expect(left()).toContain('Écoutes restantes : 1');
  });

  it('ignore la touche R avec Ctrl, Alt ou Méta', async () => {
    const { port, settle } = setup();
    for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true, ...init }));
    }
    await settle();
    expect(port?.plays).toEqual([]);
  });

  it('ignore les répétitions automatiques de la touche R (touche maintenue)', async () => {
    const { port, settle } = setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', repeat: true, bubbles: true, cancelable: true }));
    await settle();
    expect(port?.plays).toEqual([]);
  });

  it('le compteur d\'écoutes n\'est pas une région live (il ne doit pas parler par-dessus l\'extrait)', () => {
    const { el } = setup();
    const counter = el.querySelector('.ecoutes');
    expect(counter).not.toBeNull();
    expect(counter?.getAttribute('role')).toBeNull();
    expect(counter?.closest('[aria-live]')).toBeNull();
  });

  it('3 écoutes au maximum : la quatrième est impossible et le bouton se désactive', async () => {
    const { port, listenButton, pressR, settle, left } = setup();
    for (let i = 0; i < 3; i++) {
      await pressR('r');
      port?.finish();
      await settle();
    }
    expect(port?.plays).toHaveLength(3);
    expect(left()).toContain('Écoutes restantes : 0');
    expect(listenButton().getAttribute('aria-disabled')).toBe('true');
    await pressR('r');
    listenButton().click();
    await settle();
    expect(port?.plays).toHaveLength(3);
  });

  it('le compteur repart à 3 à l\'étape suivante, qui précharge son propre extrait', async () => {
    const { port, pressR, settle, pick, left } = setup();
    await pressR('r');
    port?.finish();
    await settle();
    expect(left()).toContain('Écoutes restantes : 2');
    await pick('nom-dumont');
    expect(left()).toContain('Écoutes restantes : 3');
    expect(port?.loads).toEqual([CLIPS[0].url, CLIPS[1].url]);
  });

  it('un choix coupe le son en cours', async () => {
    const { port, pressR, pick } = setup();
    await pressR('r');
    const before = port?.stops ?? 0;
    await pick('nom-dupont');
    expect(port?.stops).toBeGreaterThan(before);
  });
});

describe('SurditePlayerComponent : décisions', () => {
  it('une bonne décision est enregistrée, avance l\'étape et ne montre aucun point', async () => {
    const { pick, session, tracker, question } = setup();
    await pick('nom-dumont');
    expect(session.stepsDone()).toBe(1);
    expect(session.points()).toBe(0);
    expect(session.gain()).toBeNull();
    expect(session.finalPoints()).toBe(10);
    expect(tracker.decisions()[0]).toMatchObject({ step: 0, result: 'reussi', choice: 'Vous avez rappelé Madame Dumont' });
    expect(question().textContent).toContain('numéro de dossier');
  });

  it('un mauvais choix ne bloque pas : décision ratée, étape suivante, aucun point', async () => {
    const { pick, session, tracker, question } = setup();
    await pick('nom-dupont');
    expect(session.stepsDone()).toBe(1);
    expect(session.finalPoints()).toBe(0);
    expect(tracker.decisions()[0]).toMatchObject({ step: 0, result: 'rate' });
    expect(tracker.decisions()[0].sentence).toContain('Madame Dupont');
    expect(question().textContent).toContain('numéro de dossier');
  });

  it('un double clic rapide ne valide pas deux étapes', async () => {
    const { option, settle, session, tracker } = setup();
    const button = option('nom-dumont');
    button.click();
    button.click();
    await settle();
    expect(session.stepsDone()).toBe(1);
    expect(tracker.decisions()).toHaveLength(1);
  });

  it('un clic sur un bouton de l\'ancienne étape, avant le rendu de la suivante, est ignoré', async () => {
    const { option, settle, session, tracker } = setup();
    const oldButton = option('nom-dupont');
    option('nom-dumont').click();
    oldButton.click();
    await settle();
    expect(session.stepsDone()).toBe(1);
    expect(tracker.decisions()).toHaveLength(1);
  });

  it('parcours complet : 5 étapes, 50 points cachés, toutes réussies', async () => {
    const { playAll, session, tracker } = setup();
    await playAll();
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(50);
    expect(session.points()).toBe(0);
    expect(tracker.decisions().map((d) => d.result)).toEqual(['reussi', 'reussi', 'reussi', 'reussi', 'reussi']);
  });

  it('tout raté : le défi va au bout sans aucun point', async () => {
    const { pick, session, tracker } = setup();
    await pick('nom-dupont');
    await pick('dossier-4832');
    await pick('jour-jeudi-14');
    await pick('alerte-information');
    await pick('bouton-gauche');
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(0);
    expect(tracker.decisions().map((d) => d.result)).toEqual(['rate', 'rate', 'rate', 'rate', 'rate']);
  });

  it('une partie interrompue garde les points des décisions prises', async () => {
    const { pick, session } = setup();
    await pick('nom-dumont');
    await pick('dossier-4832');
    expect(session.finalPoints()).toBe(10);
  });

  it('suit stepsTotal : à 3 étapes le défi se termine après la troisième décision', async () => {
    const { pick, session, el } = setup({ stepsTotal: 3 });
    await pick('nom-dumont');
    await pick('dossier-4812');
    await pick('jour-mardi-14');
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(30);
    expect(el.querySelector('p.question')).toBeNull();
  });

  it('repart de zéro à chaque partie', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DefiSession, { provide: RANDOM, useValue: () => 0.5 }, { provide: AUDIO_PORT, useValue: fakePort() }],
    });
    TestBed.inject(DefiSession).configure(5);
    const tracker = TestBed.inject(SurditeTracker);
    tracker.record(0, { result: 'rate', choice: 'x', sentence: 'x' });
    TestBed.createComponent(SurditePlayerComponent);
    expect(tracker.decisions()).toEqual([]);
    expect(tracker.played()).toBe(true);
  });
});

describe('SurditePlayerComponent : options', () => {
  it('l\'étape 5 propose deux boutons sans texte, gauche puis droite, nommés par leur position seulement', async () => {
    const { pick, el, option } = setup();
    await pick('nom-dumont');
    await pick('dossier-4812');
    await pick('jour-mardi-14');
    await pick('alerte-urgence');
    const buttons = Array.from(el.querySelectorAll('button.reponse'));
    expect(buttons.map((b) => b.getAttribute('data-id'))).toEqual(['bouton-gauche', 'bouton-droite']);
    expect(buttons.every((b) => b.textContent?.trim() === '')).toBe(true);
    expect(option('bouton-gauche').getAttribute('aria-label')).toBe('Bouton de gauche');
    expect(option('bouton-droite').getAttribute('aria-label')).toBe('Bouton de droite');
  });

  it('les options des étapes 1 à 4 sont des vrais boutons avec leur libellé', async () => {
    const { el, option } = setup();
    expect(option('nom-dumont').tagName).toBe('BUTTON');
    expect(option('nom-dumont').getAttribute('type')).toBe('button');
    expect(option('nom-dumont').textContent?.trim()).toBe('Madame Dumont');
    expect(el.querySelectorAll('button.reponse')).toHaveLength(4);
  });
});

describe('SurditePlayerComponent : alternative et son indisponible', () => {
  it('« Besoin d\'une alternative ? » affiche et masque la transcription de l\'étape', async () => {
    const { el, settle } = setup();
    const link = el.querySelector('button.lien') as HTMLButtonElement;
    expect(link.textContent).toContain('Besoin d\'une alternative ?');
    expect(link.getAttribute('aria-pressed')).toBe('false');
    link.click();
    await settle();
    expect(el.querySelector('.transcription')?.textContent).toContain('Bonjour, ici Madame Dumont');
    expect(link.getAttribute('aria-pressed')).toBe('true');
    link.click();
    await settle();
    expect(el.querySelector('.transcription')).toBeNull();
  });

  it('la transcription activée sur la consigne s\'affiche dès la première étape', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DefiSession, { provide: RANDOM, useValue: () => 0.5 }, { provide: AUDIO_PORT, useValue: fakePort() }],
    });
    TestBed.inject(DefiSession).configure(5);
    TestBed.inject(AlternativeMode).enable();
    const fixture = TestBed.createComponent(SurditePlayerComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.transcription')).not.toBeNull();
  });

  it('quand le son ne se charge pas : message clair, transcription affichée, écoute désactivée, jeu toujours possible', async () => {
    const port = fakePort();
    port.failLoad = true;
    const { el, listenButton, settle, pick, session } = setup({ port });
    await settle();
    expect(el.querySelector('.erreur-son')?.getAttribute('role')).toBe('status');
    expect(el.querySelector('.erreur-son')?.textContent).toContain('Le son n\'a pas pu être chargé');
    expect(el.querySelector('.transcription')?.textContent).toContain('Madame Dumont');
    expect(listenButton().getAttribute('aria-disabled')).toBe('true');
    listenButton().click();
    await settle();
    expect(port.plays).toEqual([]);
    await pick('nom-dumont');
    expect(session.stepsDone()).toBe(1);
  });

  it('sans Web Audio (port nul) : même repli sur la transcription, sans erreur', async () => {
    const { el, settle, pick, session } = setup({ port: null });
    await settle();
    expect(el.querySelector('.erreur-son')).not.toBeNull();
    expect(el.querySelector('.transcription')).not.toBeNull();
    await pick('nom-dumont');
    expect(session.stepsDone()).toBe(1);
  });
});

describe('SurditePlayerComponent : focus clavier et nettoyage', () => {
  it('rend le focus à la question quand le bouton cliqué disparaît avec l\'étape', async () => {
    const { option, settle, question } = setup();
    option('nom-dumont').focus();
    expect(document.activeElement).toBe(option('nom-dumont'));
    option('nom-dumont').click();
    await settle();
    expect(document.activeElement).toBe(question());
    expect(question().getAttribute('tabindex')).toBe('-1');
  });

  it('ne vole pas le focus à un élément extérieur (par exemple « Abandonner »)', async () => {
    const { option, settle } = setup();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mounted.push(outside);
    outside.focus();
    option('nom-dumont').click();
    await settle();
    expect(document.activeElement).toBe(outside);
  });

  it('coupe le son quand le composant est détruit', () => {
    const { fixture, port } = setup();
    const before = port?.stops ?? 0;
    fixture.destroy();
    expect(port?.stops).toBeGreaterThan(before);
  });
});

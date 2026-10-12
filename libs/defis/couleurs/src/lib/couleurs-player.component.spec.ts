import { TestBed } from '@angular/core/testing';
import { DefiSession, RANDOM } from '@ag/state';
import { DEUTERANOPIE_MATRIX } from './couleurs-content';
import { CouleursPlayerComponent } from './couleurs-player.component';
import { CouleursTracker } from './couleurs-tracker';

const mounted: HTMLElement[] = [];

function setup(options: { stepsTotal?: number } = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [DefiSession, { provide: RANDOM, useValue: () => 0.5 }] });
  const session = TestBed.inject(DefiSession);
  session.configure(options.stepsTotal ?? 5);
  const tracker = TestBed.inject(CouleursTracker);
  const fixture = TestBed.createComponent(CouleursPlayerComponent);
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
  const item = (id: string) => el.querySelector(`button[data-id="${id}"]`) as HTMLButtonElement;
  const message = () => el.querySelector('p.message') as HTMLElement;
  const pick = async (id: string) => {
    item(id).click();
    await settle();
  };
  const playAll = async () => {
    await pick('delta');
    await pick('depassement');
    await pick('budget');
    for (const id of ['gamma', 'omega', 'lambda', 'theta', 'zeta']) {
      await pick(id);
    }
    await pick('vert');
  };
  return { fixture, el, session, tracker, settle, item, message, pick, playAll };
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.remove();
  }
});

describe('CouleursPlayerComponent : page filtrée et premier message', () => {
  it('définit le filtre de daltonisme et l\'applique à la page simulée', () => {
    const { el } = setup();
    const matrix = el.querySelector('svg.defs filter#ag-deuteranopie feColorMatrix');
    expect(matrix?.getAttribute('type')).toBe('matrix');
    expect(matrix?.getAttribute('values')).toBe(DEUTERANOPIE_MATRIX);
    expect(el.querySelector('div.page')?.getAttribute('data-filtre')).toBe('deuteranopie');
    expect(el.querySelector('svg.defs')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('affiche le message du PMO et les 8 projets de la première étape', () => {
    const { el, message, session } = setup();
    expect(message().textContent).toContain('PMO');
    expect(message().textContent).toContain('Un projet est en retard, on le présente au comité dans 2 minutes.');
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(8);
    expect(session.stepsDone()).toBe(0);
  });
});

describe('CouleursPlayerComponent : décisions', () => {
  it('une bonne décision enregistre un succès et avance l\'étape, sans point avant la fin', async () => {
    const { pick, session, tracker, message } = setup();
    await pick('delta');
    expect(session.stepsDone()).toBe(1);
    expect(session.points()).toBe(0);
    expect(session.gain()).toBeNull();
    expect(session.finalPoints()).toBe(10);
    expect(tracker.decisions()).toHaveLength(1);
    expect(tracker.decisions()[0]).toMatchObject({ step: 0, result: 'reussi', choice: 'Vous avez ouvert Delta' });
    expect(message().textContent).toContain('Direction financière');
  });

  it('un mauvais choix ne bloque pas : décision ratée, étape suivante, toujours aucun point', async () => {
    const { pick, session, tracker, message, el } = setup();
    await pick('alpha');
    expect(session.stepsDone()).toBe(1);
    expect(session.points()).toBe(0);
    expect(session.finalPoints()).toBe(0);
    expect(tracker.decisions()[0]).toMatchObject({ step: 0, result: 'rate' });
    expect(tracker.decisions()[0].sentence).toContain('Vous ouvrez Alpha');
    expect(message().textContent).toContain('dérapage budgétaire');
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(5);
  });

  it('un double clic rapide ne valide pas deux étapes', async () => {
    const { item, settle, session, tracker } = setup();
    const delta = item('delta');
    delta.click();
    delta.click();
    await settle();
    expect(session.stepsDone()).toBe(1);
    expect(tracker.decisions()).toHaveLength(1);
  });

  it('le classement de l\'étape 4 se décide quand les 5 projets sont classés', async () => {
    const { pick, session, tracker, message } = setup();
    await pick('delta');
    await pick('depassement');
    await pick('budget');
    expect(message().textContent).toContain('ordre de traitement');
    for (const id of ['gamma', 'omega', 'lambda', 'theta']) {
      await pick(id);
    }
    expect(session.stepsDone()).toBe(3);
    await pick('zeta');
    expect(session.stepsDone()).toBe(4);
    expect(tracker.decisions()[3]).toMatchObject({ step: 3, result: 'reussi' });
    expect(message().textContent).toContain('Comité de pilotage');
  });

  it('parcours complet : 5 étapes, 50 points cachés (rien d\'affiché), toutes réussies', async () => {
    const { playAll, session, tracker } = setup();
    await playAll();
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(50);
    expect(session.points()).toBe(0);
    expect(session.gain()).toBeNull();
    expect(tracker.decisions().map((d) => d.result)).toEqual(['reussi', 'reussi', 'reussi', 'reussi', 'reussi']);
  });

  it('tout raté : le défi va au bout, sans aucun point ni gain', async () => {
    const { pick, session, tracker } = setup();
    await pick('alpha');
    await pick('reporte');
    await pick('debut');
    for (const id of ['omega', 'lambda', 'theta', 'zeta', 'gamma']) {
      await pick(id);
    }
    await pick('olive');
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(0);
    expect(session.gain()).toBeNull();
    expect(tracker.decisions().map((d) => d.result)).toEqual(['rate', 'rate', 'rate', 'rate', 'rate']);
  });

  it('classement partiel : une demi-décision, soit 45 points au total', async () => {
    const { pick, session, tracker } = setup();
    await pick('delta');
    await pick('depassement');
    await pick('budget');
    for (const id of ['gamma', 'omega', 'lambda', 'zeta', 'theta']) {
      await pick(id);
    }
    await pick('vert');
    expect(tracker.decisions()[3].result).toBe('partiel');
    expect(session.finalPoints()).toBe(45);
    expect(session.points()).toBe(0);
  });

  it('une partie interrompue garde les points des décisions prises (les manquantes valent 0)', async () => {
    const { pick, session } = setup();
    await pick('delta');
    await pick('reporte');
    expect(session.stepsDone()).toBe(2);
    expect(session.finalPoints()).toBe(10);
  });

  it('suit stepsTotal : à 3 étapes le défi se termine après la troisième décision', async () => {
    const { pick, session, el } = setup({ stepsTotal: 3 });
    await pick('delta');
    await pick('depassement');
    await pick('budget');
    expect(session.allDone()).toBe(true);
    expect(session.finalPoints()).toBe(30);
    expect(el.querySelector('p.message')).toBeNull();
  });

  it('repart de zéro à chaque partie', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [DefiSession, { provide: RANDOM, useValue: () => 0.5 }] });
    TestBed.inject(DefiSession).configure(5);
    const tracker = TestBed.inject(CouleursTracker);
    tracker.record(0, { result: 'rate', choice: 'x', sentence: 'x' });
    TestBed.createComponent(CouleursPlayerComponent);
    expect(tracker.decisions()).toEqual([]);
  });
});

describe('CouleursPlayerComponent : focus clavier', () => {
  it('rend le focus au message quand l\'élément cliqué disparaît avec l\'étape', async () => {
    const { item, settle, message } = setup();
    item('delta').focus();
    expect(document.activeElement).toBe(item('delta'));
    item('delta').click();
    await settle();
    expect(document.activeElement).toBe(message());
    expect(message().getAttribute('tabindex')).toBe('-1');
  });

  it('ne vole pas le focus à un élément extérieur (par exemple « Abandonner »)', async () => {
    const { item, settle } = setup();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mounted.push(outside);
    outside.focus();
    item('delta').click();
    await settle();
    expect(document.activeElement).toBe(outside);
  });

  it('garde le focus dans la page après le classement (étape 4)', async () => {
    const { pick, item, settle, message } = setup();
    await pick('delta');
    await pick('depassement');
    await pick('budget');
    for (const id of ['gamma', 'omega', 'lambda', 'theta']) {
      await pick(id);
    }
    item('zeta').focus();
    item('zeta').click();
    await settle();
    expect(document.activeElement).toBe(message());
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { makeResult } from '@ag/domain';
import { DEFI_DEFINITIONS, GameStore, RANDOM, STORAGE, createMemoryStorage } from '@ag/state';
import { DEFINITIONS } from './definitions';
import { routes } from './routes';

async function settle(harness: RouterTestingHarness): Promise<void> {
  for (let i = 0; i < 10; i++) {
    harness.detectChanges();
    await Promise.resolve();
  }
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function button(el: HTMLElement, text: string): HTMLButtonElement {
  const found = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));
  if (!found) {
    throw new Error(`Bouton introuvable : ${text}`);
  }
  return found;
}

async function pick(harness: RouterTestingHarness, el: HTMLElement, id: string): Promise<void> {
  const target = el.querySelector(`ag-couleurs-player button[data-id="${id}"]`) as HTMLButtonElement | null;
  if (!target) {
    throw new Error(`Élément introuvable : ${id}`);
  }
  target.click();
  await settle(harness);
}

async function startDefi4(): Promise<{ harness: RouterTestingHarness; el: HTMLElement; store: GameStore }> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: STORAGE, useValue: createMemoryStorage() },
      { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
      { provide: RANDOM, useValue: () => 0.5 },
    ],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  for (const id of [1, 2, 3] as const) {
    store.recordResult(makeResult(id, 'expire', 0, 0));
    store.unlock(id);
  }
  const harness = await RouterTestingHarness.create('/defi/4');
  const el = harness.routeNativeElement as HTMLElement;
  await settle(harness);
  return { harness, el, store };
}

describe('défi 4 (couleurs) dans le parcours', () => {
  it('affiche la consigne propre au défi 4', async () => {
    const { el } = await startDefi4();
    expect(el.textContent).toContain('Couleurs');
    expect(el.textContent).toContain('daltonisme');
    expect(el.textContent).toContain('Le comité de pilotage démarre dans 2 minutes');
    expect(el.textContent).toContain('Ouvrir le projet en retard');
  });

  it('se joue de bout en bout : 5 décisions réussies, 50 points comptés à la fin, comité unanime', async () => {
    const { harness, el, store } = await startDefi4();
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 1/5');
    await pick(harness, el, 'delta');
    expect(el.textContent).toContain('Étape 2/5');
    await pick(harness, el, 'depassement');
    await pick(harness, el, 'budget');
    for (const id of ['gamma', 'omega', 'lambda', 'theta', 'zeta']) {
      await pick(harness, el, id);
    }
    await pick(harness, el, 'vert');
    expect(store.resultFor(4)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître des couleurs');
    expect(el.textContent).toContain('📋 Vos décisions du comité');
    expect(el.textContent).toContain('📰 Compte rendu du comité de pilotage');
    expect(el.textContent).toContain('Plan adopté à l\'unanimité');
    expect(el.textContent).toContain('Des priorités illisibles');
  });

  it('un parcours tout raté va quand même au bout et raconte la séance suspendue', async () => {
    const { harness, el, store } = await startDefi4();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'alpha');
    await pick(harness, el, 'reporte');
    await pick(harness, el, 'debut');
    for (const id of ['omega', 'lambda', 'theta', 'zeta', 'gamma']) {
      await pick(harness, el, id);
    }
    await pick(harness, el, 'olive');
    expect(store.resultFor(4)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 0 });
    expect(el.textContent).toContain('Joueur');
    expect(el.textContent).not.toContain('Maître des couleurs');
    expect(el.textContent).toContain('Séance suspendue');
    expect(el.textContent).toContain('Vous ouvrez Alpha, qui allait très bien.');
    expect(el.textContent).toContain('Raté');
  });

  it('3 décisions réussies sur 5 : 30 points, badge Persévérant', async () => {
    const { harness, el, store } = await startDefi4();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'delta');
    await pick(harness, el, 'depassement');
    await pick(harness, el, 'budget');
    for (const id of ['omega', 'lambda', 'theta', 'zeta', 'gamma']) {
      await pick(harness, el, id);
    }
    await pick(harness, el, 'olive');
    expect(store.resultFor(4)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 30 });
    expect(el.textContent).toContain('Persévérant');
    expect(el.textContent).toContain('Adopté sous réserve');
  });

  it('laisse « Abandonner » utilisable : fin partielle, les bonnes réponses sont comptées', async () => {
    const { harness, el, store } = await startDefi4();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'delta');
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(4)).toMatchObject({ outcome: 'abandonne', stepsDone: 1, points: 10 });
    expect(el.textContent).toContain('Défi abandonné');
    expect(el.textContent).toContain('Non abordée');
    expect(el.textContent).toContain('Séance levée en cours de route');
    expect(el.textContent).toContain('Vous ouvrez Delta du premier coup');
    expect(el.textContent).toContain('Vous cherchez encore l\'origine du dérapage');
  });

  it('abandon dès le départ : aucun point, cartes « Non abordée » et séance ajournée', async () => {
    const { harness, el, store } = await startDefi4();
    button(el, 'Démarrer').click();
    await settle(harness);
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(4)).toMatchObject({ outcome: 'abandonne', stepsDone: 0, points: 0 });
    expect(el.textContent).toContain('Défi abandonné');
    expect(el.textContent).toContain('Vos décisions du comité');
    expect(el.textContent).toContain('Séance ajournée');
    expect(el.textContent).toContain('Vous n\'avez ouvert aucun projet');
  });

  it('rechargement sur l\'écran de fin : résultat déjà enregistré, aucun bloc de décisions contradictoire', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: STORAGE, useValue: createMemoryStorage() },
        { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
        { provide: RANDOM, useValue: () => 0.5 },
      ],
    });
    const store = TestBed.inject(GameStore);
    store.setPseudo('Jules');
    for (const id of [1, 2, 3] as const) {
      store.recordResult(makeResult(id, 'expire', 0, 0));
      store.unlock(id);
    }
    store.recordResult(makeResult(4, 'termine', 5, 50));
    const harness = await RouterTestingHarness.create('/defi/4');
    const el = harness.routeNativeElement as HTMLElement;
    await settle(harness);
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).not.toContain('Vos décisions du comité');
    expect(el.textContent).not.toContain('Non abordée');
    expect(el.textContent).not.toContain('Séance ajournée');
  });
});

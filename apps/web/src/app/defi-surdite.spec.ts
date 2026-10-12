import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { makeResult } from '@ag/domain';
import { AUDIO_PORT, AudioPort } from '@ag/defi-surdite';
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
  const target = el.querySelector(`ag-surdite-player button.reponse[data-id="${id}"]`) as HTMLButtonElement | null;
  if (!target) {
    throw new Error(`Option introuvable : ${id}`);
  }
  target.click();
  await settle(harness);
}

async function startDefi5(withAudio = true) {
  const plays: string[] = [];
  const port: AudioPort | null = withAudio
    ? {
        load: () => Promise.resolve(5),
        play: (url) => {
          plays.push(url);
          return Promise.resolve();
        },
        stop: () => undefined,
      }
    : null;
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: STORAGE, useValue: createMemoryStorage() },
      { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
      { provide: RANDOM, useValue: () => 0.5 },
      { provide: AUDIO_PORT, useValue: port },
    ],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  for (const id of [1, 2, 3, 4] as const) {
    store.recordResult(makeResult(id, 'expire', 0, 0));
    store.unlock(id);
  }
  const harness = await RouterTestingHarness.create('/defi/5');
  const el = harness.routeNativeElement as HTMLElement;
  await settle(harness);
  return { harness, el, store, plays };
}

describe('défi 5 (malentendance) dans le parcours', () => {
  it('affiche la consigne propre au défi 5 : casque, test du son, écoutes et alternative', async () => {
    const { el } = await startDefi5();
    expect(el.textContent).toContain('Malentendance');
    expect(el.textContent).toContain('Un client important a laissé un message vocal urgent');
    expect(el.textContent).toContain('Mettez votre casque');
    expect(el.textContent).toContain('3 écoutes par étape (touche R)');
    expect(button(el, 'Tester le son')).toBeDefined();
    expect(button(el, 'Besoin d\'une alternative (transcription) ?')).toBeDefined();
  });

  it('« Tester le son » joue l\'échantillon de la consigne', async () => {
    const { harness, el, plays } = await startDefi5();
    button(el, 'Tester le son').click();
    await settle(harness);
    expect(plays).toEqual(['audio/defi5/test-echantillon.wav']);
  });

  it('se joue de bout en bout : 5 décisions réussies, 50 points, client conquis', async () => {
    const { harness, el, store } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 1/5');
    await pick(harness, el, 'nom-dumont');
    expect(el.textContent).toContain('Étape 2/5');
    await pick(harness, el, 'dossier-4812');
    await pick(harness, el, 'jour-mardi-14');
    await pick(harness, el, 'alerte-urgence');
    await pick(harness, el, 'bouton-droite');
    expect(store.resultFor(5)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître de l\'oreille');
    expect(el.textContent).toContain('📋 Vos décisions');
    expect(el.textContent).toContain('📰 Compte rendu de la relation client');
    expect(el.textContent).toContain('Client conquis');
    expect(el.textContent).toContain('Une information donnée uniquement à l\'oral');
  });

  it('un parcours tout raté va quand même au bout : 0 point, badge Joueur, client perdu', async () => {
    const { harness, el, store } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'nom-dupont');
    await pick(harness, el, 'dossier-4832');
    await pick(harness, el, 'jour-jeudi-14');
    await pick(harness, el, 'alerte-information');
    await pick(harness, el, 'bouton-gauche');
    expect(store.resultFor(5)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 0 });
    expect(el.textContent).toContain('Joueur');
    expect(el.textContent).not.toContain('Maître de l\'oreille');
    expect(el.textContent).toContain('Client perdu');
    expect(el.textContent).toContain('Vous rappelez Madame Dupont');
  });

  it('3 décisions réussies sur 5 : 30 points, badge Persévérant', async () => {
    const { harness, el, store } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'nom-dumont');
    await pick(harness, el, 'dossier-4812');
    await pick(harness, el, 'jour-mardi-14');
    await pick(harness, el, 'alerte-information');
    await pick(harness, el, 'bouton-gauche');
    expect(store.resultFor(5)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 30 });
    expect(el.textContent).toContain('Persévérant');
    expect(el.textContent).toContain('Client rappelé, avec quelques malentendus');
  });

  it('limite à 3 écoutes par étape à travers l\'interface', async () => {
    const { harness, el, plays } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    for (let i = 0; i < 4; i++) {
      (el.querySelector('ag-surdite-player button.ecouter') as HTMLButtonElement).click();
      await settle(harness);
    }
    expect(plays).toHaveLength(3);
    expect(el.textContent).toContain('Écoutes restantes : 0');
  });

  it('laisse « Abandonner » utilisable : fin partielle, bonnes réponses comptées, phrases « temps écoulé »', async () => {
    const { harness, el, store } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    await pick(harness, el, 'nom-dumont');
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(5)).toMatchObject({ outcome: 'abandonne', stepsDone: 1, points: 10 });
    expect(el.textContent).toContain('Défi abandonné');
    expect(el.textContent).toContain('Non abordée');
    expect(el.textContent).toContain('Vous reconnaissez Madame Dumont');
    expect(el.textContent).toContain('Le numéro de dossier se perd');
    expect(el.textContent).toContain('Appel interrompu');
  });

  it('abandon dès le départ : aucun point, cartes « Non abordée », client en attente', async () => {
    const { harness, el, store } = await startDefi5();
    button(el, 'Démarrer').click();
    await settle(harness);
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(5)).toMatchObject({ outcome: 'abandonne', stepsDone: 0, points: 0 });
    expect(el.textContent).toContain('Client en attente');
    expect(el.textContent).toContain('Le nom du client reste un mystère');
  });

  it('sans Web Audio : le jeu reste jouable avec la transcription affichée et un message clair', async () => {
    const { harness, el, store } = await startDefi5(false);
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Le son n\'a pas pu être chargé');
    expect(el.textContent).toContain('Bonjour, ici Madame Dumont');
    await pick(harness, el, 'nom-dumont');
    await pick(harness, el, 'dossier-4812');
    await pick(harness, el, 'jour-mardi-14');
    await pick(harness, el, 'alerte-urgence');
    await pick(harness, el, 'bouton-droite');
    expect(store.resultFor(5)).toMatchObject({ outcome: 'termine', points: 50 });
  });

  it('après un rechargement de la page sur l\'écran de fin, le bloc de décisions ne contredit pas le résultat enregistré', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: STORAGE, useValue: createMemoryStorage() },
        { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
        { provide: AUDIO_PORT, useValue: null },
      ],
    });
    const store = TestBed.inject(GameStore);
    store.setPseudo('Jules');
    for (const id of [1, 2, 3, 4] as const) {
      store.recordResult(makeResult(id, 'expire', 0, 0));
      store.unlock(id);
    }
    store.recordResult(makeResult(5, 'termine', 5, 50));
    const harness = await RouterTestingHarness.create('/defi/5');
    const el = harness.routeNativeElement as HTMLElement;
    await settle(harness);
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).not.toContain('Vos décisions');
    expect(el.textContent).not.toContain('Non abordée');
  });
});

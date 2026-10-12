import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { makeResult } from '@ag/domain';
import { VOICE_PORT, VoicePort } from '@ag/defi-lecteur';
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

function press(el: HTMLElement, k: string): void {
  (el.querySelector('ag-lecteur-player section.zone') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

function activeId(el: HTMLElement): string | null {
  return el.querySelector('ul.liste li[data-active="true"]')?.getAttribute('data-id') ?? null;
}

async function choose(harness: RouterTestingHarness, el: HTMLElement, id: string): Promise<void> {
  for (let i = 0; i < 6 && activeId(el) !== id; i++) {
    press(el, 'Tab');
    await settle(harness);
  }
  expect(activeId(el)).toBe(id);
  press(el, 'Enter');
  await settle(harness);
}

async function typeEmail(harness: RouterTestingHarness, el: HTMLElement, value: string): Promise<void> {
  for (let i = 0; i < 3 && activeId(el) !== 'champ'; i++) {
    press(el, 'Tab');
    await settle(harness);
  }
  const input = el.querySelector('input.champ') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await settle(harness);
}

async function startDefi3(withFrench = true): Promise<{ harness: RouterTestingHarness; el: HTMLElement; store: GameStore; spoken: string[] }> {
  const spoken: string[] = [];
  const port: VoicePort = {
    voices: () => (withFrench ? [{ lang: 'fr-FR', name: 'Amelie' }] : []),
    speak: (text) => {
      spoken.push(text);
      return new Promise<void>(() => undefined);
    },
    cancel: () => undefined,
    onVoicesChanged: () => undefined,
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: STORAGE, useValue: createMemoryStorage() },
      { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
      { provide: VOICE_PORT, useValue: port },
      { provide: RANDOM, useValue: () => 0.5 },
    ],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  for (const id of [1, 2] as const) {
    store.recordResult(makeResult(id, 'expire', 0, 0));
    store.unlock(id);
  }
  const harness = await RouterTestingHarness.create('/defi/3');
  const el = harness.routeNativeElement as HTMLElement;
  await settle(harness);
  return { harness, el, store, spoken };
}

describe('défi 3 (lecteur d\'écran) dans le parcours', () => {
  it('affiche la consigne propre au défi 3, le test de la voix et les touches', async () => {
    const { el } = await startDefi3();
    expect(el.textContent).toContain('Lecteur d\'écran');
    expect(el.textContent).toContain('Vous ne voyez pas l\'écran');
    expect(el.textContent).toContain('Mettez votre casque');
    expect(button(el, 'Tester la voix')).toBeDefined();
    expect(el.textContent).toContain('R pour répéter');
  });

  it('se joue de bout en bout : 4 étapes, 40 points, 3 paris sur 3 affichés à la fin', async () => {
    const { harness, el, store } = await startDefi3();
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 1/4');
    await choose(harness, el, 'dupont');
    expect(el.textContent).toContain('Étape 2/4');
    await choose(harness, el, 'partager');
    await typeEmail(harness, el, 'client@exemple.fr');
    await choose(harness, el, 'envoyer');
    expect(store.resultFor(3)).toMatchObject({ outcome: 'termine', stepsDone: 4, points: 40 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître de l\'écoute');
    expect(el.textContent).toContain('🎲 Vos paris');
    expect(el.textContent).toContain('3 gagnés sur 3');
    expect(el.textContent).toContain('Des boutons sans nom');
  });

  it('après « Démarrer », le focus clavier est sur la zone (et non sur le titre ou « Abandonner »)', async () => {
    const { harness, el } = await startDefi3();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    try {
      button(el, 'Démarrer').click();
      await settle(harness);
      jest.advanceTimersByTime(200); // le titre du défi reçoit le focus après un setTimeout(0) de l'hôte
      await settle(harness);
      expect(document.activeElement).toBe(el.querySelector('ag-lecteur-player section.zone'));
    } finally {
      jest.useRealTimers();
    }
  });

  it('un mauvais choix puis le bon : 3 paris gagnés sur 4 à la fin', async () => {
    const { harness, el } = await startDefi3();
    button(el, 'Démarrer').click();
    await settle(harness);
    await choose(harness, el, 'martin');
    expect(el.querySelector('.consequence')?.textContent).toContain('Mauvais contrat ouvert');
    expect(el.textContent).toContain('Étape 1/4');
    await choose(harness, el, 'dupont');
    await choose(harness, el, 'partager');
    await typeEmail(harness, el, 'client@exemple.fr');
    await choose(harness, el, 'envoyer');
    expect(el.textContent).toContain('3 gagnés sur 4');
  });

  it('sans voix française, la consigne le dit et le jeu affiche des sous-titres', async () => {
    const { harness, el } = await startDefi3(false);
    expect(el.textContent).toContain('Aucune voix française');
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.querySelector('.sous-titres')?.textContent).toContain('Liste de documents');
  });

  it('laisse « Abandonner » utilisable et enregistre les étapes faites', async () => {
    const { harness, el, store } = await startDefi3();
    button(el, 'Démarrer').click();
    await settle(harness);
    await choose(harness, el, 'dupont');
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(3)).toMatchObject({ outcome: 'abandonne', stepsDone: 1 });
    expect(el.textContent).toContain('Défi abandonné');
    expect(el.textContent).toContain('1 gagné sur 1');
  });
});

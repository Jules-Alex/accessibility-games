import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { makeResult } from '@ag/domain';
import { DEFI_DEFINITIONS, GameStore, STORAGE, createMemoryStorage } from '@ag/state';
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

function key(target: Element, k: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

function type(el: HTMLElement, id: string, value: string): void {
  const input = el.querySelector(`[data-tab="${id}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function startDefi2(): Promise<{ harness: RouterTestingHarness; el: HTMLElement; store: GameStore }> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: STORAGE, useValue: createMemoryStorage() },
      { provide: DEFI_DEFINITIONS, useValue: DEFINITIONS },
    ],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  store.recordResult(makeResult(1, 'expire', 0, 0));
  store.unlock(1);
  const harness = await RouterTestingHarness.create('/defi/2');
  const el = harness.routeNativeElement as HTMLElement;
  await settle(harness);
  return { harness, el, store };
}

describe('défi 2 (clavier) dans le parcours', () => {
  afterEach(() => jest.useRealTimers());

  it('affiche la consigne propre au défi 2', async () => {
    const { el } = await startDefi2();
    expect(el.textContent).toContain('Navigation clavier');
    expect(el.textContent).toContain('Votre souris est inutilisable');
    expect(el.textContent).toContain('Ouvrir le menu');
  });

  it('se joue de bout en bout au clavier : 5 étapes, 50 points, défi terminé', async () => {
    const { harness, el, store } = await startDefi2();
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 1/5');
    key(el.querySelector('[data-tab="menu"]') as Element, 'Enter');
    await settle(harness);
    expect(el.textContent).toContain('Étape 2/5');
    key(el.querySelector('[data-tab="turing"]') as Element, ' ');
    type(el, 'date', '12/10/2026');
    type(el, 'heure', '09:30');
    await settle(harness);
    (el.querySelector('[data-tab="confirmer"]') as HTMLButtonElement).click();
    await settle(harness);
    expect(store.resultFor(2)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître du clavier');
    expect(el.textContent).toContain('Des fonctions inutilisables sans souris');
  });

  it('bloque la souris : un clic affiche la grève et ne fait pas avancer le défi', async () => {
    const { harness, el, store } = await startDefi2();
    button(el, 'Démarrer').click();
    await settle(harness);
    (el.querySelector('.souris') as HTMLElement).click();
    await settle(harness);
    expect(el.textContent).toContain('La souris est en grève');
    expect(el.textContent).toContain('Étape 1/5');
    expect(store.resultFor(2)).toBeUndefined();
  });

  it('laisse le bouton « Abandonner » du HUD utilisable à la souris', async () => {
    const { harness, el, store } = await startDefi2();
    button(el, 'Démarrer').click();
    await settle(harness);
    button(el, 'Abandonner').click();
    await settle(harness);
    expect(store.resultFor(2)).toMatchObject({ outcome: 'abandonne', stepsDone: 0 });
    expect(el.textContent).toContain('Défi abandonné');
  });

  it('enregistre les étapes réellement faites quand le temps est écoulé', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    const { harness, el, store } = await startDefi2();
    button(el, 'Démarrer').click();
    await settle(harness);
    key(el.querySelector('[data-tab="menu"]') as Element, 'Enter');
    key(el.querySelector('[data-tab="turing"]') as Element, ' ');
    await settle(harness);
    jest.advanceTimersByTime(121_000);
    await settle(harness);
    expect(store.resultFor(2)).toMatchObject({ outcome: 'expire', stepsDone: 2, points: 20 });
    expect(el.textContent).toContain('Temps écoulé');
  });
});

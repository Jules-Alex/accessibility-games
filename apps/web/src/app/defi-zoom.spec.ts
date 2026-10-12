import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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

function type(el: HTMLElement, selector: string, value: string): void {
  const input = el.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function startGame(): Promise<{ harness: RouterTestingHarness; el: HTMLElement; store: GameStore }> {
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
  const harness = await RouterTestingHarness.create('/defi/1');
  const el = harness.routeNativeElement as HTMLElement;
  await settle(harness);
  return { harness, el, store };
}

describe('défi 1 (zoom) dans le parcours', () => {
  afterEach(() => jest.useRealTimers());

  it('affiche la consigne propre au défi 1', async () => {
    const { el } = await startGame();
    expect(el.textContent).toContain('zoom à 400 %');
    expect(el.textContent).toContain('Relever le n° de commande');
  });

  it('se joue de bout en bout : 5 étapes, 50 points, défi terminé', async () => {
    const { harness, el, store } = await startGame();
    button(el, 'Démarrer').click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 1/5');
    (el.querySelector('button.num') as HTMLButtonElement).click();
    await settle(harness);
    expect(el.textContent).toContain('Étape 2/5');
    type(el, '#zoom-ref', 'CMD-48127');
    const select = el.querySelector('#zoom-motif') as HTMLSelectElement;
    select.value = 'Erreur de livraison';
    select.dispatchEvent(new Event('change'));
    type(el, '#zoom-promo', 'PROMO25');
    await settle(harness);
    button(el, 'Valider la commande').click();
    await settle(harness);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître du zoom');
    expect(el.textContent).toContain('Interface qui ne s\'adapte pas au zoom');
    expect(TestBed.inject(Router).url).toBe('/defi/1');
  });

  it('enregistre les étapes réellement faites quand le temps est écoulé', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    const { harness, el, store } = await startGame();
    button(el, 'Démarrer').click();
    await settle(harness);
    (el.querySelector('button.num') as HTMLButtonElement).click();
    type(el, '#zoom-ref', 'CMD-48127');
    await settle(harness);
    jest.advanceTimersByTime(121_000);
    await settle(harness);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'expire', stepsDone: 2, points: 20 });
    expect(el.textContent).toContain('Temps écoulé');
  });
});

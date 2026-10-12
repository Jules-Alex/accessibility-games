import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { UNLOCK_CODES } from '@ag/domain';
import { DEFI_DEFINITIONS, GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { PLACEHOLDER_DEFINITIONS } from './placeholder-defis';
import { routes } from './routes';

async function settle(harness: RouterTestingHarness): Promise<void> {
  for (let i = 0; i < 6; i++) {
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

function type(el: HTMLElement, value: string): void {
  const input = el.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('parcours complet', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: STORAGE, useValue: createMemoryStorage() },
        { provide: DEFI_DEFINITIONS, useValue: PLACEHOLDER_DEFINITIONS },
      ],
    });
  });

  it('renvoie à l\'accueil quand on ouvre un défi sans pseudonyme', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/defi/3');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('joue les cinq défis puis arrive au résultat et à l\'engagement', async () => {
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;
    const router = TestBed.inject(Router);

    type(el, 'Jules');
    await settle(harness);
    expect(router.url).toBe('/defi/1');

    for (const id of [1, 2, 3, 4, 5] as const) {
      const host = harness.routeNativeElement as HTMLElement;
      button(host, 'Démarrer').click();
      await settle(harness);
      button(host, 'Valider l\'étape').click();
      await settle(harness);
      button(host, 'Abandonner').click();
      await settle(harness);
      expect(host.textContent).toContain('Défi abandonné');
      type(host, UNLOCK_CODES[id]);
      await settle(harness);
      expect(router.url).toBe(id < 5 ? `/defi/${id + 1}` : '/resultat');
    }

    const store = TestBed.inject(GameStore);
    expect(store.results()).toHaveLength(5);
    expect(store.totalPoints()).toBe(50);
    expect(store.abandonedIds()).toEqual([1, 2, 3, 4, 5]);

    const resultat = harness.routeNativeElement as HTMLElement;
    expect(resultat.textContent).toContain('Bravo, Jules');
    expect(resultat.textContent).toContain('0 défi joué sur 5 · 5 défis abandonnés');
    (resultat.querySelector('a[href="/engagement"]') as HTMLAnchorElement).click();
    await settle(harness);
    expect(router.url).toBe('/engagement');
  });

  it('empêche de sauter un défi par URL directe', async () => {
    TestBed.inject(GameStore).setPseudo('Jules');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/defi/4');
    expect(TestBed.inject(Router).url).toBe('/defi/1');
    await harness.navigateByUrl('/resultat');
    expect(TestBed.inject(Router).url).toBe('/defi/1');
  });

  it('redirige une route inconnue vers l\'accueil', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/nimporte/quoi');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('affiche les codes sur l\'écran animateur sans pseudonyme', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/animateur');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain(UNLOCK_CODES[1]);
  });
});

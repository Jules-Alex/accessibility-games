import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { makeResult } from '@ag/domain';
import { GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { defiGuard, resultatGuard } from './guards';

function runDefi(id: string | null): boolean | UrlTree {
  const route = { paramMap: convertToParamMap(id === null ? {} : { id }) } as unknown as ActivatedRouteSnapshot;
  return TestBed.runInInjectionContext(() => defiGuard(route, {} as RouterStateSnapshot)) as boolean | UrlTree;
}

function runResultat(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    resultatGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

function url(result: boolean | UrlTree): string {
  return TestBed.inject(Router).serializeUrl(result as UrlTree);
}

describe('gardes de navigation', () => {
  let store: GameStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: STORAGE, useValue: createMemoryStorage() }],
    });
    store = TestBed.inject(GameStore);
  });

  it('renvoie à l\'accueil sans pseudonyme', () => {
    expect(url(runDefi('1'))).toBe('/');
    expect(url(runDefi('3'))).toBe('/');
    expect(url(runResultat())).toBe('/');
  });

  it('autorise le défi 1 avec un pseudonyme', () => {
    store.setPseudo('Jules');
    expect(runDefi('1')).toBe(true);
  });

  it('redirige une URL directe vers l\'étape à jouer', () => {
    store.setPseudo('Jules');
    expect(url(runDefi('3'))).toBe('/defi/1');
    expect(url(runResultat())).toBe('/defi/1');
    store.recordResult(makeResult(1, 'expire', 0, 0));
    store.unlock(1);
    expect(url(runDefi('4'))).toBe('/defi/2');
  });

  it('redirige un identifiant invalide sans boucle', () => {
    store.setPseudo('Jules');
    for (const bad of ['abc', '0', '9', '', null]) {
      const redirected = runDefi(bad);
      expect(url(redirected)).toBe('/defi/1');
    }
  });

  it('autorise les défis suivants et le résultat une fois débloqués', () => {
    store.setPseudo('Jules');
    for (const id of [1, 2, 3, 4, 5] as const) {
      store.recordResult(makeResult(id, 'expire', 0, 0));
      store.unlock(id);
    }
    expect(runDefi('5')).toBe(true);
    expect(runResultat()).toBe(true);
  });
});

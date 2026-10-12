import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { parseDefiId } from '@ag/domain';
import { GameStore } from '@ag/state';

/** Sans pseudonyme : accueil. Avec pseudonyme : première étape pas encore débloquée. */
function fallback(store: GameStore, router: Router) {
  return router.createUrlTree(store.hasPseudo() ? store.resumeRoute() : ['/']);
}

export const defiGuard: CanActivateFn = (route) => {
  const store = inject(GameStore);
  const router = inject(Router);
  const id = parseDefiId(route.paramMap.get('id'));
  if (id !== null && store.canAccessDefi(id)) {
    return true;
  }
  return fallback(store, router);
};

export const resultatGuard: CanActivateFn = () => {
  const store = inject(GameStore);
  const router = inject(Router);
  return store.canAccessResultat() ? true : fallback(store, router);
};

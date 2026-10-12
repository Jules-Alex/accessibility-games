import { TestBed } from '@angular/core/testing';
import { makeResult } from '@ag/domain';
import { GameStore } from './game-store';
import { STORAGE, StoragePort, createMemoryStorage } from './storage';

const KEY = 'ag_state_v1';

function setup(initial?: string): { store: GameStore; storage: StoragePort } {
  const storage = createMemoryStorage();
  if (initial !== undefined) {
    storage.set(KEY, initial);
  }
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE, useValue: storage }] });
  return { store: TestBed.inject(GameStore), storage };
}

describe('GameStore', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('démarre vide et en mode animé', () => {
    const { store } = setup();
    expect(store.hasPseudo()).toBe(false);
    expect(store.results()).toEqual([]);
    expect(store.mode()).toBe('anime');
    expect(store.totalPoints()).toBe(0);
  });

  it('nettoie le pseudonyme et refuse un pseudonyme vide', () => {
    const { store } = setup();
    expect(store.setPseudo('   ')).toBe(false);
    expect(store.hasPseudo()).toBe(false);
    expect(store.setPseudo('  Jules  ')).toBe(true);
    expect(store.pseudo()).toBe('Jules');
  });

  it('enregistre un résultat une seule fois par défi (retour arrière sans double comptage)', () => {
    const { store } = setup();
    expect(store.recordResult(makeResult(1, 'expire', 3, 30))).toBe(true);
    expect(store.recordResult(makeResult(1, 'termine', 5, 50))).toBe(false);
    expect(store.results()).toHaveLength(1);
    expect(store.totalPoints()).toBe(30);
    expect(store.resultFor(1)?.stepsDone).toBe(3);
  });

  it('calcule score, défis joués, abandonnés et badges', () => {
    const { store } = setup();
    store.recordResult(makeResult(1, 'termine', 5, 50));
    store.recordResult(makeResult(2, 'abandonne', 1, 10));
    store.recordResult(makeResult(3, 'expire', 2, 20));
    expect(store.totalPoints()).toBe(80);
    expect(store.playedCount()).toBe(2);
    expect(store.abandonedIds()).toEqual([2]);
    expect(store.badgeGroups().map((g) => g.label)).toEqual(['Maître du zoom', 'Persévérant']);
  });

  it('ne débloque qu\'un défi déjà joué', () => {
    const { store } = setup();
    expect(store.unlock(1)).toBe(false);
    store.recordResult(makeResult(1, 'expire', 0, 0));
    expect(store.unlock(1)).toBe(true);
    expect(store.isUnlocked(1)).toBe(true);
  });

  it('contrôle l\'accès aux défis', () => {
    const { store } = setup();
    expect(store.canAccessDefi(1)).toBe(false);
    store.setPseudo('Jules');
    expect(store.canAccessDefi(1)).toBe(true);
    expect(store.canAccessDefi(2)).toBe(false);
    store.recordResult(makeResult(1, 'expire', 0, 0));
    expect(store.canAccessDefi(2)).toBe(false);
    store.unlock(1);
    expect(store.canAccessDefi(2)).toBe(true);
    expect(store.canAccessDefi(3)).toBe(false);
  });

  it('autorise le résultat seulement après le déblocage du défi 5', () => {
    const { store } = setup();
    store.setPseudo('Jules');
    expect(store.canAccessResultat()).toBe(false);
    for (const id of [1, 2, 3, 4, 5] as const) {
      store.recordResult(makeResult(id, 'expire', 0, 0));
      store.unlock(id);
    }
    expect(store.canAccessResultat()).toBe(true);
  });

  it('indique où reprendre le parcours', () => {
    const { store } = setup();
    store.setPseudo('Jules');
    expect(store.resumeRoute()).toEqual(['/defi', 1]);
    store.recordResult(makeResult(1, 'expire', 0, 0));
    store.unlock(1);
    expect(store.resumeRoute()).toEqual(['/defi', 2]);
    for (const id of [2, 3, 4, 5] as const) {
      store.recordResult(makeResult(id, 'expire', 0, 0));
      store.unlock(id);
    }
    expect(store.resumeRoute()).toEqual(['/resultat']);
  });

  it('persiste puis recharge l\'état', () => {
    const first = setup();
    first.store.setPseudo('Jules');
    first.store.recordResult(makeResult(1, 'expire', 2, 20));
    first.store.unlock(1);
    const saved = first.storage.get(KEY) as string;
    TestBed.resetTestingModule();
    const second = setup(saved);
    expect(second.store.pseudo()).toBe('Jules');
    expect(second.store.totalPoints()).toBe(20);
    expect(second.store.isUnlocked(1)).toBe(true);
  });

  it('repart de zéro avec un JSON invalide ou un mauvais format', () => {
    for (const bad of ['{pas du json', '42', 'null', '"texte"', '[]']) {
      TestBed.resetTestingModule();
      const { store } = setup(bad);
      expect(store.hasPseudo()).toBe(false);
      expect(store.results()).toEqual([]);
    }
  });

  it('ignore les entrées invalides ou en double d\'un état partiellement corrompu', () => {
    const { store } = setup(
      JSON.stringify({
        pseudo: 'Jules',
        results: [
          { defiId: 1, outcome: 'expire', stepsDone: 1, points: 10 },
          { defiId: 1, outcome: 'termine', stepsDone: 5, points: 50 },
          { defiId: 9, outcome: 'expire', stepsDone: 1, points: 10 },
          'x',
        ],
        unlocked: [1, 1, 8, 'a'],
      }),
    );
    expect(store.results()).toHaveLength(1);
    expect(store.totalPoints()).toBe(10);
    expect(store.isUnlocked(1)).toBe(true);
  });

  it('se réinitialise', () => {
    const { store, storage } = setup();
    store.setPseudo('Jules');
    store.reset();
    expect(store.hasPseudo()).toBe(false);
    expect(storage.get(KEY)).toBeNull();
  });

  it('compte comme abandonné un défi démarré puis quitté (rechargement de la page)', () => {
    const { store } = setup();
    store.markStarted(2);
    expect(store.settleStarted()).toBe(true);
    expect(store.resultFor(2)).toMatchObject({ outcome: 'abandonne', stepsDone: 0, points: 0 });
    expect(store.settleStarted()).toBe(false);
  });

  it('ne modifie pas un défi démarré qui a déjà un résultat', () => {
    const { store } = setup();
    store.markStarted(1);
    store.recordResult(makeResult(1, 'expire', 3, 30));
    expect(store.settleStarted()).toBe(false);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'expire', stepsDone: 3 });
    store.markStarted(1);
    expect(store.settleStarted()).toBe(false);
  });

  it('retient le défi démarré après rechargement', () => {
    const first = setup();
    first.store.markStarted(3);
    const saved = first.storage.get(KEY) as string;
    TestBed.resetTestingModule();
    const second = setup(saved);
    expect(second.store.settleStarted()).toBe(true);
    expect(second.store.resultFor(3)?.outcome).toBe('abandonne');
  });

  it('oublie le défi démarré à la réinitialisation', () => {
    const { store } = setup();
    store.markStarted(4);
    store.reset();
    expect(store.settleStarted()).toBe(false);
  });
});

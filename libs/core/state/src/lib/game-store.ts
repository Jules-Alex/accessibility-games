import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DEFI_IDS,
  DefiId,
  DefiResult,
  SessionMode,
  abandonedIds,
  badgeForResult,
  badgeGroups,
  isDefiId,
  isDefiResult,
  makeResult,
  playedCount,
  sanitizePseudo,
  totalPoints,
} from '@ag/domain';
import { STORAGE, StoragePort } from './storage';

const STORAGE_KEY = 'ag_state_v1';

interface PersistedState {
  pseudo: string;
  results: DefiResult[];
  unlocked: DefiId[];
  /** Défi lancé mais pas encore terminé : s'il reste là au rechargement, il compte comme abandonné. */
  started: DefiId | null;
}

function emptyState(): PersistedState {
  return { pseudo: '', results: [], unlocked: [], started: null };
}

function load(storage: StoragePort): PersistedState {
  const raw = storage.get(STORAGE_KEY);
  if (!raw) {
    return emptyState();
  }
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return emptyState();
    }
    const d = data as Record<string, unknown>;
    const pseudo = typeof d['pseudo'] === 'string' ? sanitizePseudo(d['pseudo']) : '';
    const rawResults = Array.isArray(d['results']) ? d['results'].filter(isDefiResult) : [];
    const results: DefiResult[] = [];
    for (const r of rawResults) {
      if (!results.some((x) => x.defiId === r.defiId)) {
        results.push(makeResult(r.defiId, r.outcome, r.stepsDone, r.points));
      }
    }
    const unlocked = Array.isArray(d['unlocked']) ? [...new Set(d['unlocked'].filter(isDefiId))] : [];
    const started = isDefiId(d['started']) ? d['started'] : null;
    return { pseudo, results, unlocked, started };
  } catch {
    return emptyState();
  }
}

@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly storage = inject(STORAGE);
  private readonly state = signal<PersistedState>(load(this.storage));

  readonly mode = signal<SessionMode>('anime');

  readonly pseudo = computed(() => this.state().pseudo);
  readonly hasPseudo = computed(() => this.state().pseudo.length > 0);
  readonly results = computed(() => this.state().results);
  readonly totalPoints = computed(() => totalPoints(this.results()));
  readonly playedCount = computed(() => playedCount(this.results()));
  readonly abandonedIds = computed(() => abandonedIds(this.results()));
  readonly badges = computed(() => this.results().map(badgeForResult));
  readonly badgeGroups = computed(() => badgeGroups(this.badges()));

  setPseudo(raw: string): boolean {
    const pseudo = sanitizePseudo(raw);
    if (!pseudo) {
      return false;
    }
    this.update({ ...this.state(), pseudo });
    return true;
  }

  /** Un seul résultat par défi : un retour arrière ne permet ni de rejouer ni de doubler les points. */
  recordResult(result: DefiResult): boolean {
    if (this.resultFor(result.defiId)) {
      return false;
    }
    const clean = makeResult(result.defiId, result.outcome, result.stepsDone, result.points);
    const current = this.state();
    this.update({
      ...current,
      results: [...current.results, clean],
      started: current.started === clean.defiId ? null : current.started,
    });
    return true;
  }

  /** Note qu'un défi vient de démarrer (pour le compter comme abandonné s'il est quitté en cours de route). */
  markStarted(id: DefiId): void {
    if (!this.resultFor(id) && this.state().started !== id) {
      this.update({ ...this.state(), started: id });
    }
  }

  /** Règle un défi resté « démarré » sans résultat (page rechargée) : il compte comme abandonné. */
  settleStarted(): boolean {
    const id = this.state().started;
    if (id === null) {
      return false;
    }
    if (this.resultFor(id)) {
      this.update({ ...this.state(), started: null });
      return false;
    }
    return this.recordResult(makeResult(id, 'abandonne', 0, 0));
  }

  resultFor(id: DefiId): DefiResult | undefined {
    return this.state().results.find((r) => r.defiId === id);
  }

  /** Débloque le défi suivant ; refusé si le défi n'a pas été joué. */
  unlock(id: DefiId): boolean {
    if (!this.resultFor(id)) {
      return false;
    }
    if (!this.isUnlocked(id)) {
      this.update({ ...this.state(), unlocked: [...this.state().unlocked, id] });
    }
    return true;
  }

  isUnlocked(id: DefiId): boolean {
    return this.state().unlocked.includes(id);
  }

  canAccessDefi(id: DefiId): boolean {
    if (!this.hasPseudo()) {
      return false;
    }
    return id === 1 || this.isUnlocked((id - 1) as DefiId);
  }

  canAccessResultat(): boolean {
    return this.hasPseudo() && this.isUnlocked(5);
  }

  /** Première étape du parcours qui n'est pas encore débloquée. */
  resumeRoute(): (string | number)[] {
    for (const id of DEFI_IDS) {
      if (!this.isUnlocked(id)) {
        return ['/defi', id];
      }
    }
    return ['/resultat'];
  }

  reset(): void {
    this.storage.remove(STORAGE_KEY);
    this.state.set(emptyState());
  }

  private update(next: PersistedState): void {
    this.state.set(next);
    this.storage.set(STORAGE_KEY, JSON.stringify(next));
  }
}

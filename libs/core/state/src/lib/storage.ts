import { InjectionToken } from '@angular/core';

export interface StoragePort {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryStorage(): StoragePort {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
    },
    remove: (key) => {
      map.delete(key);
    },
  };
}

/** `localStorage` avec repli en mémoire quand il est indisponible (navigation privée, quota…). */
export function createBrowserStorage(): StoragePort {
  const fallback = createMemoryStorage();
  return {
    get: (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return fallback.get(key);
      }
    },
    set: (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        fallback.set(key, value);
      }
    },
    remove: (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        fallback.remove(key);
      }
    },
  };
}

export const STORAGE = new InjectionToken<StoragePort>('AG_STORAGE', {
  providedIn: 'root',
  factory: createBrowserStorage,
});

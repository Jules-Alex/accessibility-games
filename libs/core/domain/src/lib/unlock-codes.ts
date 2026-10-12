import { DefiId } from './defis';

/**
 * Code donné par les présentateurs après le débrief de chaque défi.
 * Vérifié côté client : il sert l'engagement du groupe, pas la sécurité.
 */
export const UNLOCK_CODES: Readonly<Record<DefiId, string>> = {
  1: '4821',
  2: '1937',
  3: '7305',
  4: '2648',
  5: '9154',
};

/** Ne garde que les chiffres (espaces, insécables, tirets ignorés ; pleine largeur converti). */
export function normalizeCode(input: string): string {
  return input.normalize('NFKC').replace(/\D/gu, '');
}

/**
 * Accepte le code seul (« 4821 », « 4 8 2 1 »), mais aussi un message collé tel quel depuis Teams
 * (« Code défi 1 : 4821 ») : on regarde le code entier, chaque suite de chiffres, puis les 4 derniers chiffres.
 */
export function isValidCode(defiId: DefiId, input: string): boolean {
  const expected = UNLOCK_CODES[defiId];
  const all = normalizeCode(input);
  if (all === expected) {
    return true;
  }
  const runs: string[] = input.normalize('NFKC').match(/\d+/gu) ?? [];
  return runs.includes(expected) || (all.length > expected.length && all.endsWith(expected));
}

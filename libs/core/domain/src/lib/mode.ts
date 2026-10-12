export type SessionMode = 'anime' | 'autonome';

/** `?mode=autonome` active le mode sans animateur ; tout le reste est le mode animé. */
export function readModeFromSearch(search: string): SessionMode {
  return new URLSearchParams(search).get('mode') === 'autonome' ? 'autonome' : 'anime';
}

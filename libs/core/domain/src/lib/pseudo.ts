export const PSEUDO_MAX_LENGTH = 20;

export function sanitizePseudo(raw: string): string {
  const cleaned = raw.replace(/\p{Cc}/gu, ' ').replace(/\s+/gu, ' ').trim();
  return Array.from(cleaned).slice(0, PSEUDO_MAX_LENGTH).join('').trim();
}

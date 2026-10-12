export const LAST_SECONDS_MS = 20_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatMmSs(ms: number): string {
  const safe = Number.isFinite(ms) ? ms : 0;
  const totalSeconds = Math.max(0, Math.ceil(safe / 1000));
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

/** Pourcentage de temps restant, borné entre 0 et 100. */
export function gaugePercent(remainingMs: number, totalMs: number): number {
  if (!(totalMs > 0)) {
    return 0;
  }
  return Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
}

export function isLastSeconds(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= LAST_SECONDS_MS;
}

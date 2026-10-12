import { DEFI_IDS, DefiId } from './defis';
import { DefiResult, isAbandoned } from './results';

export const POINTS_PER_STEP = 10;

export function pointsForSteps(stepsDone: number): number {
  return Math.max(0, Math.floor(stepsDone)) * POINTS_PER_STEP;
}

export function totalPoints(results: readonly DefiResult[]): number {
  return results.reduce((sum, r) => sum + r.points, 0);
}

export function playedCount(results: readonly DefiResult[]): number {
  return results.filter((r) => !isAbandoned(r)).length;
}

export function abandonedIds(results: readonly DefiResult[]): DefiId[] {
  return results
    .filter(isAbandoned)
    .map((r) => r.defiId)
    .sort((a, b) => a - b);
}

/** Exemple : « 4 défis joués sur 5 · 1 défi abandonné ». */
export function describeProgress(played: number, abandoned: number, total: number = DEFI_IDS.length): string {
  const joue = `${played} défi${played > 1 ? 's' : ''} joué${played > 1 ? 's' : ''} sur ${total}`;
  const abandon =
    abandoned === 0 ? 'aucun défi abandonné' : `${abandoned} défi${abandoned > 1 ? 's' : ''} abandonné${abandoned > 1 ? 's' : ''}`;
  return `${joue} · ${abandon}`;
}

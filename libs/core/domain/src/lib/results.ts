import { DefiId, getDefiMeta, isDefiId } from './defis';

export type Outcome = 'termine' | 'expire' | 'abandonne';

const OUTCOMES: readonly string[] = ['termine', 'expire', 'abandonne'];

export interface DefiResult {
  defiId: DefiId;
  outcome: Outcome;
  stepsDone: number;
  points: number;
}

/** Points gagnés à l'instant, utilisés pour l'animation « +10 ». */
export interface GainEvent {
  id: number;
  amount: number;
}

function finiteOrZero(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export function makeResult(defiId: DefiId, outcome: Outcome, stepsDone: number, points: number): DefiResult {
  const { stepsTotal } = getDefiMeta(defiId);
  const steps = Math.min(Math.max(0, Math.floor(finiteOrZero(stepsDone))), stepsTotal);
  return { defiId, outcome, stepsDone: steps, points: Math.max(0, Math.round(finiteOrZero(points))) };
}

export function isDefiResult(value: unknown): value is DefiResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    isDefiId(v['defiId']) &&
    typeof v['outcome'] === 'string' &&
    OUTCOMES.includes(v['outcome']) &&
    typeof v['stepsDone'] === 'number' &&
    typeof v['points'] === 'number'
  );
}

export function isAbandoned(result: DefiResult): boolean {
  return result.outcome === 'abandonne';
}

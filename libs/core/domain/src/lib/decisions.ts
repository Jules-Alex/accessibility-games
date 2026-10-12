import { POINTS_PER_STEP } from './scoring';

export type DecisionResult = 'reussi' | 'rate' | 'partiel';

export interface DecisionInfo {
  result: DecisionResult;
  /** Texte du choix (carte « décision » de l'écran de fin). */
  choice: string;
  /** Phrase de l'étape dans le compte rendu. */
  sentence: string;
}

export interface Decision extends DecisionInfo {
  step: number;
}

export interface Conclusion {
  icon: string;
  title: string;
  text: string;
}

/** Points d'une décision : 10 si réussie, 5 si partielle, 0 si ratée (une réponse manquante vaut 0). */
export function decisionPoints(result: DecisionResult): number {
  return result === 'reussi' ? POINTS_PER_STEP : result === 'partiel' ? POINTS_PER_STEP / 2 : 0;
}

/** Décisions réussies : une par décision réussie, une demi par décision partielle. */
export function decisionsScore(decisions: readonly Decision[]): number {
  return decisions.reduce((sum, d) => sum + (d.result === 'reussi' ? 1 : d.result === 'partiel' ? 0.5 : 0), 0);
}

export type Tier = 'vert' | 'jaune' | 'orange' | 'rouge';

export const TIER_ICON: Readonly<Record<Tier, string>> = { vert: '🟢', jaune: '🟡', orange: '🟠', rouge: '🔴' };

/** Palier du résultat : 5 sur 5 vert, 3 à 4 jaune, 1 à 2 orange, 0 rouge (proportions si le défi a moins d'étapes). */
export function tierFor(score: number, total: number): Tier {
  if (total > 0 && score >= total) {
    return 'vert';
  }
  if (total > 0 && score * 5 >= total * 3) {
    return 'jaune';
  }
  if (score > 0) {
    return 'orange';
  }
  return 'rouge';
}

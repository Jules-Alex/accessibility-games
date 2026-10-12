import { DefiId, getDefiMeta } from './defis';
import { DefiResult } from './results';
import { POINTS_PER_STEP } from './scoring';

export type BadgeKind = 'maitre' | 'perseverant' | 'joueur' | 'abandonne';

export interface Badge {
  kind: BadgeKind;
  icon: string;
  label: string;
  defiId: DefiId;
}

export interface BadgeGroup {
  icon: string;
  label: string;
  count: number;
}

export function badgeForResult(result: DefiResult): Badge {
  const meta = getDefiMeta(result.defiId);
  if (result.outcome === 'abandonne') {
    return { kind: 'abandonne', icon: '🏳', label: 'Abandonné', defiId: result.defiId };
  }
  // Défi 4 : le badge se calcule sur les points (10 par décision réussie), pas sur les étapes faites.
  const achieved = meta.badgeBasis === 'points' ? Math.floor(result.points / POINTS_PER_STEP) : result.stepsDone;
  if (achieved >= meta.stepsTotal) {
    return { kind: 'maitre', icon: '🏆', label: meta.masterLabel, defiId: result.defiId };
  }
  if (achieved >= meta.perseverantThreshold) {
    return { kind: 'perseverant', icon: '🏅', label: 'Persévérant', defiId: result.defiId };
  }
  return { kind: 'joueur', icon: '🎯', label: 'Joueur', defiId: result.defiId };
}

const ORDER: readonly BadgeKind[] = ['maitre', 'perseverant', 'joueur'];

/** Regroupe les badges gagnés (l'abandon n'en donne pas), maîtres d'abord. */
export function badgeGroups(badges: readonly Badge[]): BadgeGroup[] {
  const groups: BadgeGroup[] = [];
  for (const kind of ORDER) {
    const same = badges.filter((b) => b.kind === kind);
    const byLabel = new Map<string, BadgeGroup>();
    for (const b of same) {
      const g = byLabel.get(b.label);
      if (g) {
        g.count += 1;
      } else {
        byLabel.set(b.label, { icon: b.icon, label: b.label, count: 1 });
      }
    }
    groups.push(...byLabel.values());
  }
  return groups;
}

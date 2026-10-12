export interface Dropout {
  /** Début de la coupure, en secondes depuis le début de l'extrait. */
  start: number;
  /** Durée de la coupure, en secondes. */
  length: number;
}

export interface Degradation {
  cutoffHz: number;
  noiseGain: number;
  dropouts: readonly Dropout[];
}

/** Voix étouffée : le filtre passe-bas gomme les consonnes, la voix reste identifiable. */
export const CUTOFF_HZ = 900;
/** Souffle de fond, discret. */
export const NOISE_GAIN = 0.06;

const MIN_DROPOUT = 0.15;
const MAX_DROPOUT = 0.45;
/** Pas de coupure dans les premières et dernières 0,4 s : on entend le début et la fin du message. */
const EDGE = 0.4;
/** Marge entre la fin d'une coupure et le début de la tranche suivante. */
const MARGIN = 0.05;
const MAX_DROPOUTS = 4;

/** Coupures aléatoires de quelques centaines de millisecondes, une par tranche de 2 secondes, jamais l'une sur l'autre. */
export function planDropouts(duration: number, rng: () => number): Dropout[] {
  const count = Math.min(MAX_DROPOUTS, Math.floor(duration / 2));
  if (count <= 0) {
    return [];
  }
  const width = (duration - 2 * EDGE) / count;
  const cuts: Dropout[] = [];
  for (let i = 0; i < count; i++) {
    const length = Math.min(MIN_DROPOUT + rng() * (MAX_DROPOUT - MIN_DROPOUT), width - MARGIN);
    const start = EDGE + i * width + rng() * (width - length - MARGIN);
    cuts.push({ start, length });
  }
  return cuts;
}

export function degradationFor(duration: number, rng: () => number): Degradation {
  return { cutoffHz: CUTOFF_HZ, noiseGain: NOISE_GAIN, dropouts: planDropouts(duration, rng) };
}

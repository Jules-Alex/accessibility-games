export type DefiId = 1 | 2 | 3 | 4 | 5;

export const DEFI_IDS: readonly DefiId[] = [1, 2, 3, 4, 5];

/** Durée d'un défi : 2 minutes. */
export const DEFI_DURATION_MS = 120_000;

export interface DefiMeta {
  id: DefiId;
  icon: string;
  title: string;
  shortName: string;
  handicap: string;
  /** Nombre d'étapes : paramétrable, à réduire si le test montre que le défi est trop dur. */
  stepsTotal: number;
  /** Nombre minimal d'étapes réussies pour le badge « Persévérant ». */
  perseverantThreshold: number;
  /** Nom du badge « Maître » (celui des défis 4 et 5 n'est pas encore validé). */
  masterLabel: string;
  /** Base du badge : les étapes faites, ou les points obtenus (défi 4 : le score dépend de la qualité des décisions). */
  badgeBasis: 'steps' | 'points';
  durationMs: number;
}

export const DEFIS: readonly DefiMeta[] = [
  { id: 1, icon: '🔍', title: 'Zoom et perte de contexte', shortName: 'Zoom', handicap: 'basse vision', stepsTotal: 5, perseverantThreshold: 3, masterLabel: 'Maître du zoom', badgeBasis: 'steps', durationMs: DEFI_DURATION_MS },
  { id: 2, icon: '⌨️', title: 'Navigation clavier', shortName: 'Clavier', handicap: 'handicap moteur', stepsTotal: 5, perseverantThreshold: 3, masterLabel: 'Maître du clavier', badgeBasis: 'steps', durationMs: DEFI_DURATION_MS },
  { id: 3, icon: '🎧', title: 'Lecteur d\'écran', shortName: 'Lecteur d\'écran', handicap: 'cécité', stepsTotal: 4, perseverantThreshold: 2, masterLabel: 'Maître de l\'écoute', badgeBasis: 'steps', durationMs: DEFI_DURATION_MS },
  { id: 4, icon: '🎨', title: 'Couleurs', shortName: 'Couleurs', handicap: 'daltonisme', stepsTotal: 5, /* si stepsTotal baisse, baisser aussi perseverantThreshold : sinon Persévérant devient inatteignable (même seuil que Maître) */ perseverantThreshold: 3, masterLabel: 'Maître des couleurs', badgeBasis: 'points', durationMs: DEFI_DURATION_MS },
  { id: 5, icon: '🔊', title: 'Malentendance', shortName: 'Malentendance', handicap: 'surdité et malentendance', stepsTotal: 5, /* si stepsTotal baisse, baisser aussi perseverantThreshold : sinon Persévérant devient inatteignable (même seuil que Maître) */ perseverantThreshold: 3, masterLabel: 'Maître de l\'oreille', badgeBasis: 'points', durationMs: DEFI_DURATION_MS },
];

const BY_ID = new Map<DefiId, DefiMeta>(DEFIS.map((d) => [d.id, d]));

export function getDefiMeta(id: DefiId): DefiMeta {
  const meta = BY_ID.get(id);
  if (!meta) {
    throw new Error(`Défi inconnu : ${id}`);
  }
  return meta;
}

export function isDefiId(value: unknown): value is DefiId {
  return typeof value === 'number' && (DEFI_IDS as readonly number[]).includes(value);
}

/** Analyse un paramètre de route ; renvoie null s'il ne désigne pas un défi. */
export function parseDefiId(raw: unknown): DefiId | null {
  const n = typeof raw === 'string' ? Number(raw) : raw;
  return isDefiId(n) ? n : null;
}

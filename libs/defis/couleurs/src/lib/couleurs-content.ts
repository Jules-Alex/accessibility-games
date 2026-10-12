export type Status = 'vert' | 'orange' | 'rouge';
export type ItemKind = 'projet' | 'barre' | 'champ' | 'bouton';

/** Matrice de déficience (deutéranopie : rouge et vert confondus), 4 × 5 valeurs de `feColorMatrix`. */
export const DEUTERANOPIE_MATRIX = '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0';

// Teintes du défi : à valider à l'œil dans le navigateur avec le filtre, puis à ajuster ici seulement.
export const STATUS_COLOR: Readonly<Record<Status, string>> = { vert: '#2e9b4f', orange: '#e08a2e', rouge: '#d1493f' };
export const STATUS_LABEL: Readonly<Record<Status, string>> = { vert: 'dans les temps', orange: 'à surveiller', rouge: 'en retard' };

export interface Message {
  from: string;
  text: string;
}

export interface LegendEntry {
  color: string;
  label: string;
}

export interface ChoiceItem {
  id: string;
  kind: ItemKind;
  /** Nom lisible (projet, barre, champ, bouton) : affiché pour un projet ou un champ, jamais pour une barre ou un bouton. */
  name: string;
  color: string;
  /** Ce que la couleur porte seule à l'écran, dit en toutes lettres aux technologies d'assistance. */
  ariaLabel: string;
  status?: Status;
  /** Barres : hauteur en pourcentage. */
  height?: number;
  /** Champs : valeur affichée. */
  value?: string;
}

export interface RankItem {
  id: string;
  name: string;
  color: string;
  ariaLabel: string;
}

export interface ChoiceStepDef {
  kind: 'choice';
  message: Message;
  legend: readonly LegendEntry[];
  items: readonly ChoiceItem[];
  correctId: string;
}

export interface RankStepDef {
  kind: 'rank';
  message: Message;
  legend: readonly LegendEntry[];
  /** Listés du plus au moins critique ; l'ordre est mélangé à l'affichage. */
  items: readonly RankItem[];
  idealOrder: readonly string[];
}

export type StepDef = ChoiceStepDef | RankStepDef;

const projet = (id: string, name: string, status: Status): ChoiceItem => ({
  id,
  kind: 'projet',
  name,
  color: STATUS_COLOR[status],
  status,
  ariaLabel: `${name}, ${STATUS_LABEL[status]}`,
});

const barre = (id: string, name: string, color: string, height: number): ChoiceItem => ({
  id,
  kind: 'barre',
  name,
  color,
  height,
  ariaLabel: `Barre « ${name} »`,
});

const champ = (id: string, name: string, value: string, valid: boolean): ChoiceItem => ({
  id,
  kind: 'champ',
  name,
  value,
  color: valid ? STATUS_COLOR.vert : STATUS_COLOR.rouge,
  ariaLabel: `${name} : ${value}, ${valid ? 'valide' : 'en erreur'}`,
});

const bouton = (id: string, name: string, color: string): ChoiceItem => ({
  id,
  kind: 'bouton',
  name,
  color,
  ariaLabel: `Bouton ${name}`,
});

const BARRES: readonly ChoiceItem[] = [
  barre('prevu', 'prévu', '#2e9b4f', 70),
  barre('provisionne', 'provisionné', '#8a9a2b', 40),
  barre('depassement', 'dépassement', '#d1493f', 55),
  barre('engage', 'engagé', '#e08a2e', 85),
  barre('reporte', 'reporté', '#a0522d', 55),
];

const NIVEAUX = [
  { id: 'gamma', name: 'Gamma', level: 'maximale', color: '#d1493f' },
  { id: 'omega', name: 'Omega', level: 'forte', color: '#e08a2e' },
  { id: 'lambda', name: 'Lambda', level: 'moyenne', color: '#d4b72c' },
  { id: 'theta', name: 'Thêta', level: 'faible', color: '#8ab43c' },
  { id: 'zeta', name: 'Zêta', level: 'nulle', color: '#2e9b4f' },
] as const;

export const STEPS: readonly StepDef[] = [
  {
    kind: 'choice',
    message: { from: 'PMO', text: 'Un projet est en retard, on le présente au comité dans 2 minutes.' },
    legend: [
      { color: STATUS_COLOR.vert, label: STATUS_LABEL.vert },
      { color: STATUS_COLOR.orange, label: STATUS_LABEL.orange },
      { color: STATUS_COLOR.rouge, label: STATUS_LABEL.rouge },
    ],
    items: [
      projet('alpha', 'Alpha', 'vert'),
      projet('beta', 'Beta', 'orange'),
      projet('delta', 'Delta', 'rouge'),
      projet('epsilon', 'Epsilon', 'vert'),
      projet('kappa', 'Kappa', 'orange'),
      projet('sigma', 'Sigma', 'vert'),
      projet('tau', 'Tau', 'orange'),
      projet('upsilon', 'Upsilon', 'vert'),
    ],
    correctId: 'delta',
  },
  {
    kind: 'choice',
    message: { from: 'Direction financière', text: 'D\'où vient le dérapage budgétaire ?' },
    legend: BARRES.map((b) => ({ color: b.color, label: b.name })),
    items: BARRES,
    correctId: 'depassement',
  },
  {
    kind: 'choice',
    message: { from: 'Responsable planning', text: 'Votre replanification est rejetée : un champ est invalide.' },
    legend: [
      { color: STATUS_COLOR.vert, label: 'bordure verte : valide' },
      { color: STATUS_COLOR.rouge, label: 'bordure rouge : erreur' },
    ],
    items: [
      champ('debut', 'Date de début', '12/10/2026', true),
      champ('fin', 'Date de fin', '15/03/2027', true),
      champ('budget', 'Budget (k€)', '120', false),
      champ('responsable', 'Responsable', 'M. Martin', true),
      champ('charge', 'Charge (jours)', '340', true),
    ],
    correctId: 'budget',
  },
  {
    kind: 'rank',
    message: {
      from: 'Direction',
      text: 'Vous n\'avez de la capacité que pour un projet à la fois. Quel est l\'ordre de traitement ?',
    },
    legend: NIVEAUX.map((n) => ({ color: n.color, label: `criticité ${n.level}` })),
    items: NIVEAUX.map((n) => ({ id: n.id, name: n.name, color: n.color, ariaLabel: `${n.name}, criticité ${n.level}` })),
    idealOrder: NIVEAUX.map((n) => n.id),
  },
  {
    kind: 'choice',
    message: { from: 'Comité de pilotage', text: 'Envoyez le plan d\'arbitrage pour validation.' },
    legend: [],
    items: [
      bouton('vert', 'vert', '#2e9b4f'),
      bouton('rouge', 'rouge', '#d1493f'),
      bouton('olive', 'vert olive', '#8a9a2b'),
      bouton('orange', 'orange', '#e08a2e'),
    ],
    correctId: 'vert',
  },
];

/** Ligne de contexte (11 px) de chaque carte « décision » de l'écran de fin. */
export const STEP_CONTEXTS: readonly string[] = [
  '① PMO · Projet en retard',
  '② Direction financière · Origine du dérapage',
  '③ Responsable planning · Replanification rejetée',
  '④ Direction · Ordre de traitement',
  '⑤ Comité de pilotage · Validation du plan',
];

/** Index de l'étape de classement. */
export const RANK_STEP = STEPS.findIndex((s) => s.kind === 'rank');

export const IDEAL_ORDER_TEXT = NIVEAUX.map((n) => n.name).join(' › ');

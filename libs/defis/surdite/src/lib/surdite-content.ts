export const MAX_LISTENS = 3;
export const AUDIO_DIR = 'audio/defi5';

export interface Clip {
  id: string;
  /** Adresse relative à la base de l'application. */
  url: string;
  /** Ce que dit (ou fait entendre) l'extrait : affiché par l'alternative « transcription ». */
  transcript: string;
}

export interface Option {
  id: string;
  /** Nom court utilisé dans les phrases du compte rendu. */
  name: string;
  /** Texte du bouton (vide pour un bouton sans texte). */
  label: string;
  ariaLabel?: string;
  /** Phrase du compte rendu quand cette mauvaise option est choisie (absente pour la bonne). */
  failure?: string;
}

export interface StepDef {
  clip: Clip;
  question: string;
  options: readonly Option[];
  correctId: string;
  /** Faux quand la position des options a un sens (gauche / droite). */
  shuffle: boolean;
}

const clip = (id: string, file: string, transcript: string): Clip => ({ id, url: `${AUDIO_DIR}/${file}`, transcript });

export const CLIPS: readonly Clip[] = [
  clip('nom', '01-nom.wav', 'Bonjour, ici Madame Dumont. Je vous laisse ce message au sujet de mon contrat.'),
  clip('dossier', '02-dossier.wav', 'Mon numéro de dossier est le quatre-huit-un-deux.'),
  clip('jour', '03-jour.wav', 'Pouvez-vous me rappeler mardi à quatorze heures ? C\'est le meilleur moment pour moi.'),
  clip('alerte', '04-alerte-sirene.wav', '[Alerte sonore : sirène d\'urgence]'),
  clip('confirmation', '05-confirmation.wav', 'Pour confirmer le rappel, appuyez sur le bouton de droite. Pour annuler, appuyez sur celui de gauche.'),
];

/** Échantillon de la consigne (« Tester le son »), déjà dégradé comme les extraits du jeu. */
export const TEST_CLIP: Clip = clip(
  'test',
  'test-echantillon.wav',
  'Ceci est un test du son. Si vous m\'entendez, même mal, vous pouvez commencer.',
);

const rappel = (nom: string): string => `Vous rappelez ${nom}, qui s'étonne de recevoir un appel pour un message qu'elle n'a jamais laissé.`;
const ouvre = (numero: string): string => `Vous ouvrez le dossier ${numero}, dont le propriétaire est ravi d'apprendre que son dossier avance enfin.`;
const retard = (jour: string): string => `Vous rappelez ${jour}, alors que le client attendait mardi : il a eu le temps de consulter trois concurrents.`;
const alerte = (type: string): string => `L'alerte urgente passe pour ${type} et attend patiemment dans un coin.`;

export const STEPS: readonly StepDef[] = [
  {
    clip: CLIPS[0],
    question: 'Quel est le nom du client ?',
    options: [
      { id: 'nom-dumont', name: 'Madame Dumont', label: 'Madame Dumont' },
      { id: 'nom-dupont', name: 'Madame Dupont', label: 'Madame Dupont', failure: rappel('Madame Dupont') },
      { id: 'nom-dumoulin', name: 'Madame Dumoulin', label: 'Madame Dumoulin', failure: rappel('Madame Dumoulin') },
      { id: 'nom-dumas', name: 'Madame Dumas', label: 'Madame Dumas', failure: rappel('Madame Dumas') },
    ],
    correctId: 'nom-dumont',
    shuffle: true,
  },
  {
    clip: CLIPS[1],
    question: 'Quel est son numéro de dossier ?',
    options: [
      { id: 'dossier-4812', name: '4812', label: '4812' },
      { id: 'dossier-4832', name: '4832', label: '4832', failure: ouvre('4832') },
      { id: 'dossier-4912', name: '4912', label: '4912', failure: ouvre('4912') },
      { id: 'dossier-4813', name: '4813', label: '4813', failure: ouvre('4813') },
    ],
    correctId: 'dossier-4812',
    shuffle: true,
  },
  {
    clip: CLIPS[2],
    question: 'Quand faut-il le rappeler ?',
    options: [
      { id: 'jour-mardi-14', name: 'mardi à 14 h', label: 'mardi à 14 h' },
      { id: 'jour-jeudi-14', name: 'jeudi à 14 h', label: 'jeudi à 14 h', failure: retard('jeudi') },
      {
        id: 'jour-mardi-16',
        name: 'mardi à 16 h',
        label: 'mardi à 16 h',
        failure: 'Vous rappelez mardi à 16 h, deux heures après l\'heure prévue : le client a eu le temps de consulter trois concurrents.',
      },
      { id: 'jour-vendredi-14', name: 'vendredi à 14 h', label: 'vendredi à 14 h', failure: retard('vendredi') },
    ],
    correctId: 'jour-mardi-14',
    shuffle: true,
  },
  {
    clip: CLIPS[3],
    question: 'Quel type d\'alerte avez-vous entendu ?',
    options: [
      { id: 'alerte-information', name: 'information', label: 'Information · ding', failure: alerte('une simple notification') },
      { id: 'alerte-avertissement', name: 'avertissement', label: 'Avertissement · double bip', failure: alerte('un simple avertissement') },
      { id: 'alerte-urgence', name: 'urgence', label: 'Urgence · sirène' },
    ],
    correctId: 'alerte-urgence',
    shuffle: true,
  },
  {
    clip: CLIPS[4],
    question: 'Quel bouton faut-il presser pour confirmer ?',
    options: [
      {
        id: 'bouton-gauche',
        name: 'gauche',
        label: '',
        ariaLabel: 'Bouton de gauche',
        failure: 'Vous appuyez à gauche : l\'assistant annule tout avec le sourire. Lui, au moins, était clair.',
      },
      { id: 'bouton-droite', name: 'droite', label: '', ariaLabel: 'Bouton de droite' },
    ],
    correctId: 'bouton-droite',
    shuffle: false,
  },
];

/** Ligne de contexte (11 px) de chaque carte « décision » de l'écran de fin. */
export const STEP_CONTEXTS: readonly string[] = [
  '① Nom du client',
  '② Numéro de dossier',
  '③ Jour du rappel',
  '④ Type d\'alerte',
  '⑤ Confirmation',
];

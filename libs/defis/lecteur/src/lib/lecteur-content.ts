export interface Item {
  id: string;
  /** Ce que la voix lit pour cet élément (volontairement pauvre). */
  spoken: string;
  correct: boolean;
  /** Conséquence dite à voix haute et affichée quand on choisit ce mauvais élément. */
  consequence?: string;
}

export type StepKind = 'choice' | 'text';

export interface StepDef {
  id: 'contrat' | 'partage' | 'email' | 'envoi';
  kind: StepKind;
  /** Phrase lue à l'arrivée sur l'étape. */
  intro: string;
  items: readonly Item[];
}

export const STEPS: readonly StepDef[] = [
  {
    id: 'contrat',
    kind: 'choice',
    intro: 'Liste de documents. Trois éléments.',
    items: [
      { id: 'dupont', spoken: 'lien, cliquez ici', correct: true },
      { id: 'martin', spoken: 'lien, cliquez ici', correct: false, consequence: "Mauvais contrat ouvert : ce n'est pas celui de Monsieur Dupont." },
      { id: 'durand', spoken: 'lien, cliquez ici', correct: false, consequence: "Mauvais contrat ouvert : ce n'est pas celui de Monsieur Dupont." },
    ],
  },
  {
    id: 'partage',
    kind: 'choice',
    intro: "Barre d'outils. Quatre éléments.",
    items: [
      { id: 'partager', spoken: 'bouton', correct: true },
      { id: 'modifier', spoken: 'bouton', correct: false, consequence: 'Document modifié par erreur.' },
      { id: 'supprimer', spoken: 'bouton', correct: false, consequence: 'Document supprimé.' },
      { id: 'imprimer', spoken: 'image', correct: false, consequence: 'Impression lancée.' },
    ],
  },
  {
    id: 'email',
    kind: 'text',
    intro: 'Fenêtre de partage. Un élément.',
    items: [{ id: 'champ', spoken: 'zone de texte', correct: true }],
  },
  {
    id: 'envoi',
    kind: 'choice',
    intro: 'Confirmation. Deux éléments.',
    items: [
      { id: 'envoyer', spoken: 'bouton', correct: true },
      { id: 'annuler', spoken: 'bouton', correct: false, consequence: 'Envoi annulé : le client attend toujours son contrat.' },
    ],
  },
];

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/**
 * Déplace le curseur de navigation (−1 = avant le premier élément). `leave` vaut vrai aux deux bouts :
 * le navigateur reprend alors la main, pour que le participant puisse sortir de la zone.
 */
export function moveCursor(cursor: number, count: number, delta: 1 | -1): { cursor: number; leave: boolean } {
  const next = cursor + delta;
  if (next < 0 || next >= count) {
    return { cursor, leave: true };
  }
  return { cursor: next, leave: false };
}

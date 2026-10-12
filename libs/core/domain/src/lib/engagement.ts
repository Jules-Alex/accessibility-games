export interface EngagementAction {
  id: string;
  titre: string;
  phrase: string;
}

export const ENGAGEMENT_ACTIONS: readonly EngagementAction[] = [
  { id: 'user-stories', titre: 'Ajouter des critères d\'accessibilité dans mes User Stories', phrase: 'ajouter des critères d\'accessibilité dans mes User Stories' },
  { id: 'maquettes', titre: 'Challenger les maquettes (contrastes, taille, couleur seule…)', phrase: 'challenger les maquettes (contrastes, taille, couleur seule…)' },
  { id: 'demo-clavier', titre: 'Demander une démonstration au clavier avant de valider', phrase: 'demander une démonstration au clavier avant de valider' },
  { id: 'recettes', titre: 'Intégrer l\'accessibilité dans les recettes', phrase: 'intégrer l\'accessibilité dans les recettes' },
  { id: 'priorisation', titre: 'Prioriser les écarts d\'accessibilité critiques', phrase: 'prioriser les écarts d\'accessibilité critiques' },
  { id: 'audit', titre: 'Demander un diagnostic ou un audit d\'accessibilité', phrase: 'demander un diagnostic ou un audit d\'accessibilité' },
];

export const MAX_ENGAGEMENTS = 3;

export function toggleEngagement(selected: readonly string[], id: string): string[] {
  if (selected.includes(id)) {
    return selected.filter((x) => x !== id);
  }
  if (!ENGAGEMENT_ACTIONS.some((a) => a.id === id) || selected.length >= MAX_ENGAGEMENTS) {
    return [...selected];
  }
  return [...selected, id];
}

export function engagementSentence(pseudo: string, selected: readonly string[]): string {
  const phrases = ENGAGEMENT_ACTIONS.filter((a) => selected.includes(a.id)).map((a) => a.phrase);
  if (phrases.length === 0) {
    return '';
  }
  return `Moi, ${pseudo}, je m'engage à : ${phrases.join(' ; ')}.`;
}

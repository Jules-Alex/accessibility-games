import { ENGAGEMENT_ACTIONS, MAX_ENGAGEMENTS, engagementSentence, toggleEngagement } from './engagement';

describe('engagement', () => {
  it('propose six actions', () => {
    expect(ENGAGEMENT_ACTIONS).toHaveLength(6);
    expect(new Set(ENGAGEMENT_ACTIONS.map((a) => a.id)).size).toBe(6);
  });

  it('ajoute et retire une action', () => {
    expect(toggleEngagement([], 'audit')).toEqual(['audit']);
    expect(toggleEngagement(['audit'], 'audit')).toEqual([]);
  });

  it('plafonne à trois actions mais permet toujours de décocher', () => {
    expect(MAX_ENGAGEMENTS).toBe(3);
    const three = ['user-stories', 'maquettes', 'audit'];
    expect(toggleEngagement(three, 'recettes')).toEqual(three);
    expect(toggleEngagement(three, 'audit')).toEqual(['user-stories', 'maquettes']);
  });

  it('ignore une action inconnue', () => {
    expect(toggleEngagement(['audit'], 'inconnue')).toEqual(['audit']);
  });

  it('écrit la phrase d\'engagement dans l\'ordre de la liste', () => {
    expect(engagementSentence('Jules', ['demo-clavier', 'user-stories'])).toBe(
      "Moi, Jules, je m'engage à : ajouter des critères d'accessibilité dans mes User Stories ; demander une démonstration au clavier avant de valider.",
    );
  });

  it('renvoie une phrase vide sans action', () => {
    expect(engagementSentence('Jules', [])).toBe('');
  });
});

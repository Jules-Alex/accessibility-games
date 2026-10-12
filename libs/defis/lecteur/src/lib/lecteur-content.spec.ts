import { STEPS, isValidEmail, moveCursor } from './lecteur-content';

describe('STEPS', () => {
  it('définit les 4 étapes dans l\'ordre', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['contrat', 'partage', 'email', 'envoi']);
    expect(STEPS.map((s) => s.kind)).toEqual(['choice', 'choice', 'text', 'choice']);
  });

  it('étape 1 : trois liens lus de la même façon, un seul correct', () => {
    const items = STEPS[0].items;
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.spoken === 'lien, cliquez ici')).toBe(true);
    expect(items.filter((i) => i.correct)).toHaveLength(1);
    expect(items.find((i) => i.correct)?.id).toBe('dupont');
  });

  it('étape 2 : quatre icônes, trois « bouton » et une « image », « Partager » correct', () => {
    const items = STEPS[1].items;
    expect(items).toHaveLength(4);
    expect(items.filter((i) => i.spoken === 'bouton')).toHaveLength(3);
    expect(items.filter((i) => i.spoken === 'image')).toHaveLength(1);
    expect(items.find((i) => i.correct)?.id).toBe('partager');
  });

  it('étape 3 : un champ lu « zone de texte »', () => {
    expect(STEPS[2].items).toHaveLength(1);
    expect(STEPS[2].items[0].spoken).toBe('zone de texte');
  });

  it('étape 4 : deux boutons lus « bouton », « Envoyer » correct', () => {
    const items = STEPS[3].items;
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.spoken === 'bouton')).toBe(true);
    expect(items.find((i) => i.correct)?.id).toBe('envoyer');
  });

  it('chaque mauvaise option a une conséquence, aucune bonne option n\'en a', () => {
    for (const step of STEPS.filter((s) => s.kind === 'choice')) {
      for (const item of step.items) {
        expect(Boolean(item.consequence)).toBe(!item.correct);
      }
    }
  });

  it('annonce chaque étape par une introduction', () => {
    for (const step of STEPS) {
      expect(step.intro.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('isValidEmail', () => {
  it('accepte une adresse plausible', () => {
    expect(isValidEmail('client@exemple.fr')).toBe(true);
    expect(isValidEmail(' prenom.nom+tag@societe.example.com ')).toBe(true);
  });

  it('refuse les adresses incomplètes', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('client')).toBe(false);
    expect(isValidEmail('client@')).toBe(false);
    expect(isValidEmail('@exemple.fr')).toBe(false);
    expect(isValidEmail('client@exemple')).toBe(false);
    expect(isValidEmail('cli ent@exemple.fr')).toBe(false);
  });
});

describe('moveCursor', () => {
  it('avance depuis « avant le premier élément » (−1)', () => {
    expect(moveCursor(-1, 3, 1)).toEqual({ cursor: 0, leave: false });
  });

  it('avance et recule dans la liste', () => {
    expect(moveCursor(0, 3, 1)).toEqual({ cursor: 1, leave: false });
    expect(moveCursor(2, 3, -1)).toEqual({ cursor: 1, leave: false });
  });

  it('rend la main aux deux bouts', () => {
    expect(moveCursor(2, 3, 1)).toEqual({ cursor: 2, leave: true });
    expect(moveCursor(0, 3, -1)).toEqual({ cursor: 0, leave: true });
    expect(moveCursor(-1, 3, -1)).toEqual({ cursor: -1, leave: true });
  });

  it('rend la main quand la liste est vide', () => {
    expect(moveCursor(-1, 0, 1).leave).toBe(true);
  });
});

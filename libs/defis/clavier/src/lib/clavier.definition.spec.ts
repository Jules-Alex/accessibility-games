import { getDefiMeta } from '@ag/domain';
import { CLAVIER_DEFINITION } from './clavier.definition';

describe('CLAVIER_DEFINITION', () => {
  const meta = getDefiMeta(2);

  it('est la définition du défi 2', () => {
    expect(CLAVIER_DEFINITION.id).toBe(2);
  });

  it('a autant de pastilles et de consignes que d\'étapes', () => {
    expect(CLAVIER_DEFINITION.missionPills).toHaveLength(meta.stepsTotal);
    expect(CLAVIER_DEFINITION.stepPrompts).toHaveLength(meta.stepsTotal);
    for (const text of [...CLAVIER_DEFINITION.missionPills, ...CLAVIER_DEFINITION.stepPrompts]) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('met en évidence les mots-clés des consignes d\'étape', () => {
    expect(CLAVIER_DEFINITION.stepPrompts[0]).toContain('**Réservations**');
    expect(CLAVIER_DEFINITION.stepPrompts[1]).toContain('**Salle Turing**');
  });

  it('présente la situation et le résumé validés', () => {
    expect(CLAVIER_DEFINITION.situation).toBe(
      'Votre souris est inutilisable. Vous devez réserver une salle de réunion en utilisant uniquement le clavier.',
    );
    expect(CLAVIER_DEFINITION.resume).toEqual({
      vecu: 'Des fonctions inutilisables sans souris',
      impact: 'Perte de temps et sollicitations du support',
      action: 'Demander une démonstration au clavier avant validation',
    });
  });

  it('charge le composant de jeu à la demande', async () => {
    const player = await CLAVIER_DEFINITION.player();
    expect(typeof player).toBe('function');
    expect(player.name).toBe('ClavierPlayerComponent');
  });
});

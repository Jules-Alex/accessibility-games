import { getDefiMeta } from '@ag/domain';
import { COULEURS_DEFINITION } from './couleurs.definition';

describe('COULEURS_DEFINITION', () => {
  const meta = getDefiMeta(4);

  it('est la définition du défi 4', () => {
    expect(COULEURS_DEFINITION.id).toBe(4);
  });

  it('a autant de pastilles et de consignes que d\'étapes', () => {
    expect(COULEURS_DEFINITION.missionPills).toHaveLength(meta.stepsTotal);
    expect(COULEURS_DEFINITION.stepPrompts).toHaveLength(meta.stepsTotal);
    for (const text of [...COULEURS_DEFINITION.missionPills, ...COULEURS_DEFINITION.stepPrompts]) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('met en évidence les mots-clés des consignes d\'étape', () => {
    expect(COULEURS_DEFINITION.stepPrompts[0]).toBe('Ouvrez le projet **en retard**');
    expect(COULEURS_DEFINITION.stepPrompts[4]).toBe('Cliquez sur le bouton **vert** pour approuver');
  });

  it('présente la situation et le résumé validés', () => {
    expect(COULEURS_DEFINITION.situation).toContain('Le comité de pilotage démarre dans 2 minutes');
    expect(COULEURS_DEFINITION.situation).toContain('Votre vision des couleurs est altérée : le rouge et le vert se confondent.');
    expect(COULEURS_DEFINITION.resume).toEqual({
      vecu: 'Des priorités illisibles quand tout repose sur la couleur',
      impact: 'Mauvaises décisions de pilotage, retards et coûts évitables',
      action: 'Doubler chaque couleur d\'un texte ou d\'une icône, par exemple « Critique ⚠ »',
    });
  });

  it('charge le jeu et le bloc de fin à la demande, sans bloc de consigne', async () => {
    expect((await COULEURS_DEFINITION.player()).name).toBe('CouleursPlayerComponent');
    expect(COULEURS_DEFINITION.consigneExtra).toBeUndefined();
    expect(COULEURS_DEFINITION.endExtra).toBeDefined();
    expect((await (COULEURS_DEFINITION.endExtra as () => Promise<{ name: string }>)()).name).toBe('CouleursFinComponent');
  });
});

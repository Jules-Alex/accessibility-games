import { getDefiMeta } from '@ag/domain';
import { ZOOM_DEFINITION } from './zoom.definition';

describe('ZOOM_DEFINITION', () => {
  const meta = getDefiMeta(1);

  it('est la définition du défi 1', () => {
    expect(ZOOM_DEFINITION.id).toBe(1);
  });

  it('a autant de pastilles et de consignes que d\'étapes', () => {
    expect(ZOOM_DEFINITION.missionPills).toHaveLength(meta.stepsTotal);
    expect(ZOOM_DEFINITION.stepPrompts).toHaveLength(meta.stepsTotal);
    for (const text of [...ZOOM_DEFINITION.missionPills, ...ZOOM_DEFINITION.stepPrompts]) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('met en évidence les mots-clés des consignes d\'étape', () => {
    expect(ZOOM_DEFINITION.stepPrompts[1]).toContain('**Référence**');
    expect(ZOOM_DEFINITION.stepPrompts[4]).toContain('**Valider la commande**');
  });

  it('présente la situation et le résumé validés', () => {
    expect(ZOOM_DEFINITION.situation).toContain('zoom à 400 %');
    expect(ZOOM_DEFINITION.resume).toEqual({
      vecu: 'Interface qui ne s\'adapte pas au zoom',
      impact: 'Abandon du parcours',
      action: 'Tester les écrans à 400 % en recette',
    });
  });

  it('charge le composant de jeu à la demande', async () => {
    const player = await ZOOM_DEFINITION.player();
    expect(typeof player).toBe('function');
    expect(player.name).toBe('ZoomPlayerComponent');
  });
});

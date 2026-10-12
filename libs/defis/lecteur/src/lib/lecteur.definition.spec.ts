import { getDefiMeta } from '@ag/domain';
import { LECTEUR_DEFINITION } from './lecteur.definition';

describe('LECTEUR_DEFINITION', () => {
  const meta = getDefiMeta(3);

  it('est la définition du défi 3', () => {
    expect(LECTEUR_DEFINITION.id).toBe(3);
  });

  it('a autant de pastilles et de consignes que d\'étapes', () => {
    expect(LECTEUR_DEFINITION.missionPills).toHaveLength(meta.stepsTotal);
    expect(LECTEUR_DEFINITION.stepPrompts).toHaveLength(meta.stepsTotal);
    for (const text of [...LECTEUR_DEFINITION.missionPills, ...LECTEUR_DEFINITION.stepPrompts]) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('met en évidence les mots-clés des consignes d\'étape', () => {
    expect(LECTEUR_DEFINITION.stepPrompts[0]).toContain('**Dupont-2026**');
    expect(LECTEUR_DEFINITION.stepPrompts[1]).toContain('**Partager**');
  });

  it('présente la situation et le résumé validés', () => {
    expect(LECTEUR_DEFINITION.situation).toBe(
      "Vous ne voyez pas l'écran. Un lecteur d'écran vous lit son contenu. Vous devez envoyer un contrat à un client, en écoutant seulement.",
    );
    expect(LECTEUR_DEFINITION.resume).toEqual({
      vecu: 'Des boutons sans nom, impossible de savoir à quoi ils servent',
      impact: 'Erreurs utilisateur, mauvais clics, données perdues ou mal envoyées',
      action: 'Donner un libellé à chaque bouton et un texte alternatif utile à chaque image',
    });
  });

  it('charge le jeu, le bloc de consigne et le bloc de fin à la demande', async () => {
    expect((await LECTEUR_DEFINITION.player()).name).toBe('LecteurPlayerComponent');
    expect(LECTEUR_DEFINITION.consigneExtra).toBeDefined();
    expect((await (LECTEUR_DEFINITION.consigneExtra as () => Promise<{ name: string }>)()).name).toBe('LecteurConsigneComponent');
    expect(LECTEUR_DEFINITION.endExtra).toBeDefined();
    expect((await (LECTEUR_DEFINITION.endExtra as () => Promise<{ name: string }>)()).name).toBe('LecteurParisComponent');
  });
});

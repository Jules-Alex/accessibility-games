import { getDefiMeta } from '@ag/domain';
import { SURDITE_DEFINITION } from './surdite.definition';

describe('SURDITE_DEFINITION', () => {
  const meta = getDefiMeta(5);

  it('est la définition du défi 5', () => {
    expect(SURDITE_DEFINITION.id).toBe(5);
  });

  it('a autant de pastilles et de consignes que d\'étapes', () => {
    expect(SURDITE_DEFINITION.missionPills).toHaveLength(meta.stepsTotal);
    expect(SURDITE_DEFINITION.stepPrompts).toHaveLength(meta.stepsTotal);
    for (const text of [...SURDITE_DEFINITION.missionPills, ...SURDITE_DEFINITION.stepPrompts]) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  it('présente les pastilles et les consignes validées', () => {
    expect(SURDITE_DEFINITION.missionPills).toEqual(['Nom du client', 'N° de dossier', 'Jour du rappel', 'Type d\'alerte', 'Confirmation']);
    expect(SURDITE_DEFINITION.stepPrompts[0]).toBe('Écoutez le message et repérez le **nom du client**');
    expect(SURDITE_DEFINITION.stepPrompts[4]).toBe('Appuyez sur le bon bouton pour **confirmer**');
  });

  it('présente la situation et le résumé validés', () => {
    expect(SURDITE_DEFINITION.situation).toBe(
      'Un client important a laissé un message vocal urgent. Vous l\'entendez mal : voix étouffée, souffle, coupures. Vous devez traiter sa demande avant la fin de la journée.',
    );
    expect(SURDITE_DEFINITION.resume).toEqual({
      vecu: 'Une information donnée uniquement à l\'oral, impossible à vérifier',
      impact: 'Erreurs de saisie, clients mécontents et reprises de contact',
      action: 'Doubler tout contenu audio d\'une transcription et toute alerte sonore d\'un signal visuel',
    });
  });

  it('charge le jeu, le bloc de consigne et le bloc de fin à la demande', async () => {
    expect((await SURDITE_DEFINITION.player()).name).toBe('SurditePlayerComponent');
    expect(SURDITE_DEFINITION.consigneExtra).toBeDefined();
    expect((await (SURDITE_DEFINITION.consigneExtra as () => Promise<{ name: string }>)()).name).toBe('SurditeConsigneComponent');
    expect(SURDITE_DEFINITION.endExtra).toBeDefined();
    expect((await (SURDITE_DEFINITION.endExtra as () => Promise<{ name: string }>)()).name).toBe('SurditeFinComponent');
  });
});

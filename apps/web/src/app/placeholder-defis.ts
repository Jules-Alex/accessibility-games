import { DEFIS } from '@ag/domain';
import { DefiDefinition } from '@ag/state';

/**
 * Définitions de démonstration des cinq défis. Chaque librairie de défi fournira la sienne ;
 * on remplace alors l'entrée correspondante dans `app.config.ts`.
 */
export const PLACEHOLDER_DEFINITIONS: readonly DefiDefinition[] = DEFIS.map((meta) => ({
  id: meta.id,
  situation: `Le contenu du défi « ${meta.title} » arrive. Ce défi de démonstration permet de tester tout le parcours.`,
  missionPills: Array.from({ length: meta.stepsTotal }, (_, i) => `Étape ${i + 1}`),
  stepPrompts: Array.from({ length: meta.stepsTotal }, (_, i) => `Cliquez sur **Valider l'étape** (${i + 1}/${meta.stepsTotal})`),
  resume: {
    vecu: 'Le résumé de ce défi est fourni par sa librairie.',
    impact: 'L\'impact métier est précisé par le défi réel.',
    action: 'L\'action simple est précisée par le défi réel.',
  },
  player: () => import('./placeholder-player').then((m) => m.PlaceholderPlayerComponent),
}));

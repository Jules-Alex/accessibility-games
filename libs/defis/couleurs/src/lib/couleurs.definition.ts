import { DefiDefinition } from '@ag/state';

export const COULEURS_DEFINITION: DefiDefinition = {
  id: 4,
  situation:
    'Vous êtes responsable d\'un portefeuille de projets. Le comité de pilotage démarre dans 2 minutes et un projet est en alerte : vous devez l\'ouvrir, comprendre ce qui dérape, corriger le plan, fixer les priorités puis l\'approuver. Votre vision des couleurs est altérée : le rouge et le vert se confondent.',
  missionPills: [
    'Ouvrir le projet en retard',
    'Repérer l\'origine du dérapage',
    'Corriger la replanification',
    'Classer les projets',
    'Approuver le plan',
  ],
  stepPrompts: [
    'Ouvrez le projet **en retard**',
    'Cliquez la barre **« dépassement »**',
    'Corrigez le champ **en erreur**',
    'Classez les projets du **plus critique** au moins critique',
    'Cliquez sur le bouton **vert** pour approuver',
  ],
  resume: {
    vecu: 'Des priorités illisibles quand tout repose sur la couleur',
    impact: 'Mauvaises décisions de pilotage, retards et coûts évitables',
    action: 'Doubler chaque couleur d\'un texte ou d\'une icône, par exemple « Critique ⚠ »',
  },
  player: () => import('./couleurs-player.component').then((m) => m.CouleursPlayerComponent),
  endExtra: () => import('./couleurs-fin.component').then((m) => m.CouleursFinComponent),
};

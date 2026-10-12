import { DefiDefinition } from '@ag/state';

export const CLAVIER_DEFINITION: DefiDefinition = {
  id: 2,
  situation: 'Votre souris est inutilisable. Vous devez réserver une salle de réunion en utilisant uniquement le clavier.',
  missionPills: ['Ouvrir le menu', 'Choisir la salle', 'Saisir la date', "Saisir l'heure", 'Confirmer'],
  stepPrompts: [
    'Ouvrez le menu **Réservations**',
    'Choisissez la **Salle Turing**',
    'Saisissez la date dans le champ **Date**',
    "Saisissez l'**heure de début**",
    '**Confirmez** la réservation',
  ],
  resume: {
    vecu: 'Des fonctions inutilisables sans souris',
    impact: 'Perte de temps et sollicitations du support',
    action: 'Demander une démonstration au clavier avant validation',
  },
  player: () => import('./clavier-player.component').then((m) => m.ClavierPlayerComponent),
};

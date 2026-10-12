import { DefiDefinition } from '@ag/state';

export const SURDITE_DEFINITION: DefiDefinition = {
  id: 5,
  situation:
    'Un client important a laissé un message vocal urgent. Vous l\'entendez mal : voix étouffée, souffle, coupures. Vous devez traiter sa demande avant la fin de la journée.',
  missionPills: ['Nom du client', 'N° de dossier', 'Jour du rappel', 'Type d\'alerte', 'Confirmation'],
  stepPrompts: [
    'Écoutez le message et repérez le **nom du client**',
    'Notez le **numéro de dossier**',
    'Choisissez le **jour du rappel**',
    'Identifiez le **type d\'alerte**',
    'Appuyez sur le bon bouton pour **confirmer**',
  ],
  resume: {
    vecu: 'Une information donnée uniquement à l\'oral, impossible à vérifier',
    impact: 'Erreurs de saisie, clients mécontents et reprises de contact',
    action: 'Doubler tout contenu audio d\'une transcription et toute alerte sonore d\'un signal visuel',
  },
  player: () => import('./surdite-player.component').then((m) => m.SurditePlayerComponent),
  consigneExtra: () => import('./surdite-consigne.component').then((m) => m.SurditeConsigneComponent),
  endExtra: () => import('./surdite-fin.component').then((m) => m.SurditeFinComponent),
};

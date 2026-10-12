import { DefiDefinition } from '@ag/state';

export const LECTEUR_DEFINITION: DefiDefinition = {
  id: 3,
  situation:
    "Vous ne voyez pas l'écran. Un lecteur d'écran vous lit son contenu. Vous devez envoyer un contrat à un client, en écoutant seulement.",
  missionPills: ['Ouvrir le contrat', 'Choisir « Partager »', "Saisir l'e-mail", 'Envoyer'],
  stepPrompts: [
    'Ouvrez le contrat **Dupont-2026**',
    "Choisissez l'action **Partager**",
    "Saisissez l'**adresse e-mail** du client",
    '**Envoyez** le contrat',
  ],
  resume: {
    vecu: 'Des boutons sans nom, impossible de savoir à quoi ils servent',
    impact: 'Erreurs utilisateur, mauvais clics, données perdues ou mal envoyées',
    action: 'Donner un libellé à chaque bouton et un texte alternatif utile à chaque image',
  },
  player: () => import('./lecteur-player.component').then((m) => m.LecteurPlayerComponent),
  consigneExtra: () => import('./lecteur-consigne.component').then((m) => m.LecteurConsigneComponent),
  endExtra: () => import('./lecteur-paris.component').then((m) => m.LecteurParisComponent),
};

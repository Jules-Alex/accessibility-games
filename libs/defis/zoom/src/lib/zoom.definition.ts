import { DefiDefinition } from '@ag/state';

export const ZOOM_DEFINITION: DefiDefinition = {
  id: 1,
  situation: 'Vous lisez votre écran avec un zoom à 400 %. Vous devez déposer une réclamation sur une commande.',
  missionPills: ['Relever le n° de commande', 'Le saisir', 'Choisir le motif', 'Saisir le code promo', 'Valider'],
  stepPrompts: [
    'Relevez le numéro de commande dans le **récapitulatif**',
    'Saisissez-le dans le champ **Référence**',
    'Sélectionnez le motif **Erreur de livraison**',
    'Saisissez le **code promo** affiché dans le bandeau',
    'Cliquez sur **Valider la commande**',
  ],
  resume: {
    vecu: "Interface qui ne s'adapte pas au zoom",
    impact: 'Abandon du parcours',
    action: 'Tester les écrans à 400 % en recette',
  },
  player: () => import('./zoom-player.component').then((m) => m.ZoomPlayerComponent),
};

/** Numéro de commande à relever (affiché tronqué dans le récapitulatif : « CMD-48… »). */
export const ORDER_NUMBER = 'CMD-48127';

/** Code promo affiché dans le bandeau de droite, hors champ à 400 %. */
export const PROMO_CODE = 'PROMO25';

/** Motif à sélectionner à l'étape 3. */
export const EXPECTED_MOTIF = 'Erreur de livraison';

export const MOTIFS: readonly string[] = [EXPECTED_MOTIF, 'Produit endommagé', 'Article manquant', 'Autre'];

/** Ne garde que lettres et chiffres, en majuscules (« cmd 48127 » et « CMD-48127 » sont équivalents). */
function squash(value: string): string {
  return value.normalize('NFKC').replace(/[^0-9a-z]/gi, '').toUpperCase();
}

export function matchesOrderNumber(input: string): boolean {
  return squash(input) === squash(ORDER_NUMBER);
}

export function matchesPromoCode(input: string): boolean {
  return squash(input) === squash(PROMO_CODE);
}

export function matchesMotif(input: string): boolean {
  return input === EXPECTED_MOTIF;
}

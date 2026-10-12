import {
  EXPECTED_MOTIF,
  MOTIFS,
  ORDER_NUMBER,
  PROMO_CODE,
  matchesMotif,
  matchesOrderNumber,
  matchesPromoCode,
} from './zoom-content';

describe('zoom-content', () => {
  it('définit le numéro de commande, le code promo et le motif attendu', () => {
    expect(ORDER_NUMBER).toBe('CMD-48127');
    expect(PROMO_CODE).toBe('PROMO25');
    expect(EXPECTED_MOTIF).toBe('Erreur de livraison');
    expect(MOTIFS).toContain(EXPECTED_MOTIF);
    expect(new Set(MOTIFS).size).toBe(MOTIFS.length);
  });

  it('reconnaît le numéro de commande tel quel', () => {
    expect(matchesOrderNumber('CMD-48127')).toBe(true);
  });

  it('tolère la casse, les espaces et le tiret manquant', () => {
    expect(matchesOrderNumber(' cmd-48127 ')).toBe(true);
    expect(matchesOrderNumber('CMD48127')).toBe(true);
    expect(matchesOrderNumber('cmd 48127')).toBe(true);
    expect(matchesOrderNumber('ＣＭＤ－４８１２７')).toBe(true);
  });

  it('refuse un numéro tronqué, faux ou vide', () => {
    expect(matchesOrderNumber('CMD-48')).toBe(false);
    expect(matchesOrderNumber('CMD-48128')).toBe(false);
    expect(matchesOrderNumber('48127')).toBe(false);
    expect(matchesOrderNumber('')).toBe(false);
    expect(matchesOrderNumber('   ')).toBe(false);
  });

  it('reconnaît le code promo avec les mêmes tolérances', () => {
    expect(matchesPromoCode('PROMO25')).toBe(true);
    expect(matchesPromoCode('promo25 ')).toBe(true);
    expect(matchesPromoCode('PROMO-25')).toBe(true);
    expect(matchesPromoCode('PROMO2')).toBe(false);
    expect(matchesPromoCode('PROMO52')).toBe(false);
    expect(matchesPromoCode('')).toBe(false);
  });

  it('reconnaît seulement le bon motif', () => {
    expect(matchesMotif('Erreur de livraison')).toBe(true);
    expect(matchesMotif('Produit endommagé')).toBe(false);
    expect(matchesMotif('')).toBe(false);
  });
});

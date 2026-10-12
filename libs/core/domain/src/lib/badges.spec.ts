import { badgeForResult, badgeGroups } from './badges';
import { DefiId } from './defis';
import { makeResult, Outcome } from './results';

const r = (defiId: DefiId, outcome: Outcome, steps: number) => makeResult(defiId, outcome, steps, steps * 10);

describe('badges', () => {
  it('donne le badge maître quand toutes les étapes sont faites', () => {
    const b = badgeForResult(r(1, 'termine', 5));
    expect(b).toMatchObject({ kind: 'maitre', icon: '🏆', label: 'Maître du zoom', defiId: 1 });
  });

  it('donne le badge persévérant au seuil du défi', () => {
    expect(badgeForResult(r(1, 'expire', 3)).kind).toBe('perseverant');
    expect(badgeForResult(r(3, 'expire', 2)).kind).toBe('perseverant');
  });

  it('donne le badge joueur sous le seuil, sans abandon', () => {
    expect(badgeForResult(r(1, 'expire', 2)).kind).toBe('joueur');
    expect(badgeForResult(r(3, 'expire', 0)).kind).toBe('joueur');
  });

  it('ne donne aucun mérite à un abandon, même avec des étapes faites', () => {
    const b = badgeForResult(r(1, 'abandonne', 4));
    expect(b).toMatchObject({ kind: 'abandonne', icon: '🏳', label: 'Abandonné' });
  });

  it('regroupe les badges gagnés dans l\'ordre maître, persévérant, joueur', () => {
    const groups = badgeGroups([
      badgeForResult(r(1, 'expire', 3)),
      badgeForResult(r(2, 'expire', 1)),
      badgeForResult(r(3, 'abandonne', 2)),
      badgeForResult(r(4, 'expire', 4)),
      badgeForResult(r(5, 'termine', 5)),
    ]);
    expect(groups).toEqual([
      { icon: '🏆', label: 'Maître de l\'oreille', count: 1 },
      { icon: '🏅', label: 'Persévérant', count: 2 },
      { icon: '🎯', label: 'Joueur', count: 1 },
    ]);
  });

  it('renvoie une liste vide quand tout est abandonné', () => {
    expect(badgeGroups([badgeForResult(r(1, 'abandonne', 0))])).toEqual([]);
  });
});

describe('badge fondé sur les points (défi 4)', () => {
  const kind = (outcome: Outcome, stepsDone: number, points: number) => badgeForResult(makeResult(4, outcome, stepsDone, points)).kind;

  it('50 points : Maître des couleurs', () => {
    const badge = badgeForResult(makeResult(4, 'termine', 5, 50));
    expect(badge.kind).toBe('maitre');
    expect(badge.label).toBe('Maître des couleurs');
  });

  it('30 à 45 points : Persévérant', () => {
    expect(kind('termine', 5, 30)).toBe('perseverant');
    expect(kind('termine', 5, 45)).toBe('perseverant');
  });

  it('moins de 30 points : Joueur, même avec les 5 étapes faites', () => {
    expect(kind('termine', 5, 25)).toBe('joueur');
    expect(kind('termine', 5, 0)).toBe('joueur');
  });

  it('temps écoulé : les bonnes réponses comptent, les réponses manquantes valent 0', () => {
    expect(kind('expire', 3, 30)).toBe('perseverant');
    expect(kind('expire', 2, 20)).toBe('joueur');
    expect(kind('expire', 0, 0)).toBe('joueur');
  });

  it('abandon : toujours Abandonné, même avec des points', () => {
    expect(kind('abandonne', 3, 30)).toBe('abandonne');
  });

  it('les autres défis restent calculés sur les étapes faites', () => {
    expect(badgeForResult(makeResult(1, 'termine', 5, 0)).kind).toBe('maitre');
    expect(badgeForResult(makeResult(1, 'expire', 3, 30)).kind).toBe('perseverant');
  });
});

describe('badge fondé sur les points (défi 5)', () => {
  const kind = (outcome: Outcome, stepsDone: number, points: number) => badgeForResult(makeResult(5, outcome, stepsDone, points)).kind;

  it('50 points : Maître de l\'oreille', () => {
    const badge = badgeForResult(makeResult(5, 'termine', 5, 50));
    expect(badge.kind).toBe('maitre');
    expect(badge.label).toBe('Maître de l\'oreille');
  });

  it('30 à 40 points : Persévérant ; en dessous : Joueur, même avec les 5 étapes faites', () => {
    expect(kind('termine', 5, 30)).toBe('perseverant');
    expect(kind('termine', 5, 40)).toBe('perseverant');
    expect(kind('termine', 5, 20)).toBe('joueur');
    expect(kind('termine', 5, 0)).toBe('joueur');
  });

  it('temps écoulé : les bonnes réponses comptent ; abandon : Abandonné même avec des points', () => {
    expect(kind('expire', 3, 30)).toBe('perseverant');
    expect(kind('abandonne', 3, 30)).toBe('abandonne');
  });
});

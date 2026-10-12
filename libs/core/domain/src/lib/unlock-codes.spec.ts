import { UNLOCK_CODES, isValidCode, normalizeCode } from './unlock-codes';

describe('unlock-codes', () => {
  it('a un code à 4 chiffres distinct pour chaque défi', () => {
    const codes = Object.values(UNLOCK_CODES);
    expect(codes).toHaveLength(5);
    expect(new Set(codes).size).toBe(5);
    for (const c of codes) {
      expect(c).toMatch(/^\d{4}$/);
    }
  });

  it('accepte le bon code', () => {
    expect(isValidCode(1, UNLOCK_CODES[1])).toBe(true);
    expect(isValidCode(5, UNLOCK_CODES[5])).toBe(true);
  });

  it('refuse le code d\'un autre défi, un code vide ou faux', () => {
    expect(isValidCode(1, UNLOCK_CODES[2])).toBe(false);
    expect(isValidCode(1, '')).toBe(false);
    expect(isValidCode(1, '0000')).toBe(false);
    expect(isValidCode(1, 'abcd')).toBe(false);
  });

  it('tolère espaces, retours, espaces insécables et séparateurs', () => {
    const c = UNLOCK_CODES[1];
    const spaced = c.split('').join(' ');
    expect(isValidCode(1, ` ${spaced}\n`)).toBe(true);
    expect(isValidCode(1, `${c.slice(0, 2)}\u00a0${c.slice(2)}`)).toBe(true);
    expect(isValidCode(1, `${c.slice(0, 2)}-${c.slice(2)}`)).toBe(true);
  });

  it('tolère les chiffres pleine largeur', () => {
    const full = UNLOCK_CODES[2].replace(/\d/g, (d) => String.fromCharCode(0xff10 + Number(d)));
    expect(isValidCode(2, full)).toBe(true);
  });

  it('ne laisse que les chiffres', () => {
    expect(normalizeCode(' 4-8 2 1 x')).toBe('4821');
  });

  it('accepte un code collé avec un libellé qui contient un chiffre', () => {
    expect(isValidCode(1, `Code défi 1 : ${UNLOCK_CODES[1]}`)).toBe(true);
    expect(isValidCode(2, `Défi 2 – ${UNLOCK_CODES[2]}`)).toBe(true);
    expect(isValidCode(1, `Code défi 1 : ${UNLOCK_CODES[1].split('').join(' ')}`)).toBe(true);
  });

  it('refuse un libellé qui contient le numéro du défi mais pas le bon code', () => {
    expect(isValidCode(1, `Code défi 1 : ${UNLOCK_CODES[2]}`)).toBe(false);
    expect(isValidCode(1, 'Défi 1 : 0000')).toBe(false);
    expect(isValidCode(1, '1 2 3 4')).toBe(false);
  });
});

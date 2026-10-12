import { PSEUDO_MAX_LENGTH, sanitizePseudo } from './pseudo';

describe('sanitizePseudo', () => {
  it('retire les espaces autour et compacte les espaces internes', () => {
    expect(sanitizePseudo('  Jules   L  ')).toBe('Jules L');
  });

  it('renvoie une chaîne vide si seuls des blancs ou des caractères de contrôle sont saisis', () => {
    expect(sanitizePseudo('   ')).toBe('');
    expect(sanitizePseudo('\u0000\u0007\n')).toBe('');
  });

  it('limite à 20 caractères', () => {
    expect(PSEUDO_MAX_LENGTH).toBe(20);
    expect(sanitizePseudo('a'.repeat(50))).toHaveLength(20);
  });

  it('compte un emoji comme un seul caractère', () => {
    const out = sanitizePseudo('😀'.repeat(25));
    expect(Array.from(out)).toHaveLength(20);
  });

  it('conserve le texte tel quel (l\'échappement est fait par Angular)', () => {
    expect(sanitizePseudo('<b>x</b>')).toBe('<b>x</b>');
  });

  it('ne laisse pas d\'espace final après la coupe', () => {
    expect(sanitizePseudo('abcdefghijklmnopqrs tuvw')).toBe('abcdefghijklmnopqrs');
  });
});

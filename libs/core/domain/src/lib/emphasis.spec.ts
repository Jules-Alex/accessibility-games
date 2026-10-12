import { splitEmphasis } from './emphasis';

describe('splitEmphasis', () => {
  it('renvoie un seul morceau sans marqueur', () => {
    expect(splitEmphasis('Bonjour')).toEqual([{ text: 'Bonjour', em: false }]);
  });

  it('met en évidence le texte entre doubles astérisques', () => {
    expect(splitEmphasis('Saisissez le champ **Référence** maintenant')).toEqual([
      { text: 'Saisissez le champ ', em: false },
      { text: 'Référence', em: true },
      { text: ' maintenant', em: false },
    ]);
  });

  it('gère plusieurs passages et un passage en fin de phrase', () => {
    expect(splitEmphasis('**A** et **B**')).toEqual([
      { text: 'A', em: true },
      { text: ' et ', em: false },
      { text: 'B', em: true },
    ]);
  });

  it('laisse un marqueur non fermé tel quel', () => {
    expect(splitEmphasis('a ** b')).toEqual([{ text: 'a ** b', em: false }]);
  });

  it('renvoie une liste vide pour une chaîne vide', () => {
    expect(splitEmphasis('')).toEqual([]);
  });
});

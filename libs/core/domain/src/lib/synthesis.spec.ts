import { buildSynthesis } from './synthesis';

describe('buildSynthesis', () => {
  it('contient le socle dans tous les cas', () => {
    for (const abandoned of [[], [3], [1, 2, 3, 4, 5]] as const) {
      expect(buildSynthesis(abandoned).main).toContain('**Pour des millions de personnes, c\'est le quotidien**');
    }
  });

  it('félicite sans abandon', () => {
    expect(buildSynthesis([]).extra).toContain('Vous avez joué jusqu\'au bout');
  });

  it('nomme un seul défi abandonné', () => {
    expect(buildSynthesis([3]).extra).toBe('Vous avez abandonné le défi 3 ? Elles n\'ont pas toujours cette option.');
  });

  it('accorde la liste de plusieurs défis abandonnés', () => {
    expect(buildSynthesis([1, 2]).extra).toContain('les défis 1 et 2');
    expect(buildSynthesis([1, 2, 4]).extra).toContain('les défis 1, 2 et 4');
  });

  it('traite le cas où tout est abandonné', () => {
    expect(buildSynthesis([1, 2, 3, 4, 5]).extra).toContain('Vous avez tout abandonné');
  });
});

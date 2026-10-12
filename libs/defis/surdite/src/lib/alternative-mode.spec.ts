import { AlternativeMode } from './alternative-mode';

describe('AlternativeMode', () => {
  it('est désactivée au départ', () => {
    expect(new AlternativeMode().enabled()).toBe(false);
  });

  it('bascule avec toggle et s\'active avec enable (sans jamais se désactiver toute seule)', () => {
    const a = new AlternativeMode();
    a.toggle();
    expect(a.enabled()).toBe(true);
    a.enable();
    expect(a.enabled()).toBe(true);
    a.toggle();
    expect(a.enabled()).toBe(false);
  });
});

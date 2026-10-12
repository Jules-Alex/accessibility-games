import { DAYS, ROOMS, TAB_ORDER, TabId, isValidDate, isValidTime, nextTabId } from './clavier-content';

describe('clavier-content : salles et jours', () => {
  it('propose la salle Turing et la salle Hopper', () => {
    expect(ROOMS.map((r) => r.id)).toEqual(['turing', 'hopper']);
    expect(ROOMS.find((r) => r.id === 'turing')).toMatchObject({ label: 'Salle Turing', seats: 8 });
    expect(ROOMS.find((r) => r.id === 'hopper')).toMatchObject({ label: 'Salle Hopper', seats: 4 });
  });

  it('propose des jours valides au format jj/mm/aaaa', () => {
    expect(DAYS.length).toBeGreaterThanOrEqual(5);
    for (const d of DAYS) {
      expect(isValidDate(d)).toBe(true);
    }
  });
});

describe('isValidDate', () => {
  it('accepte une date jj/mm/aaaa, avec ou sans zéro et espaces autour', () => {
    expect(isValidDate('12/10/2026')).toBe(true);
    expect(isValidDate(' 12/10/2026 ')).toBe(true);
    expect(isValidDate('1/2/2026')).toBe(true);
    expect(isValidDate('29/02/2028')).toBe(true);
  });

  it('refuse les dates qui n\'existent pas', () => {
    expect(isValidDate('31/02/2026')).toBe(false);
    expect(isValidDate('29/02/2027')).toBe(false);
    expect(isValidDate('00/10/2026')).toBe(false);
    expect(isValidDate('12/13/2026')).toBe(false);
    expect(isValidDate('32/01/2026')).toBe(false);
  });

  it('refuse les mauvais formats', () => {
    expect(isValidDate('12-10-2026')).toBe(false);
    expect(isValidDate('12/10/26')).toBe(false);
    expect(isValidDate('2026/10/12')).toBe(false);
    expect(isValidDate('12 octobre 2026')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('   ')).toBe(false);
  });
});

describe('isValidTime', () => {
  it('accepte hh:mm, h:mm et 9h30', () => {
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('9:30')).toBe(true);
    expect(isValidTime('9h30')).toBe(true);
    expect(isValidTime(' 23:59 ')).toBe(true);
    expect(isValidTime('00:00')).toBe(true);
  });

  it('refuse les heures impossibles ou incomplètes', () => {
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('12:60')).toBe(false);
    expect(isValidTime('12:3')).toBe(false);
    expect(isValidTime('9')).toBe(false);
    expect(isValidTime('midi')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });
});

describe('ordre de la touche Tab (piège F)', () => {
  const expected: TabId[] = ['aide', 'date', 'calendrier', 'menu', 'annuaire', 'heure', 'hopper', 'turing', 'confirmer'];

  it('est incohérent par rapport à l\'ordre visuel et finit sur « Confirmer » (piège E)', () => {
    expect([...TAB_ORDER]).toEqual(expected);
    expect(TAB_ORDER[TAB_ORDER.length - 1]).toBe('confirmer');
  });

  it('avance dans la séquence avec Tab', () => {
    expect(nextTabId('aide', false)).toBe('date');
    expect(nextTabId('calendrier', false)).toBe('menu');
    expect(nextTabId('hopper', false)).toBe('turing');
  });

  it('recule dans la séquence avec Maj+Tab', () => {
    expect(nextTabId('date', true)).toBe('aide');
    expect(nextTabId('turing', true)).toBe('hopper');
  });

  it('rend la main au navigateur aux deux bouts', () => {
    expect(nextTabId('confirmer', false)).toBeNull();
    expect(nextTabId('aide', true)).toBeNull();
  });
});

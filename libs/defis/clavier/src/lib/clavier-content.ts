export type Room = 'turing' | 'hopper';

export const ROOMS: readonly { id: Room; label: string; seats: number }[] = [
  { id: 'turing', label: 'Salle Turing', seats: 8 },
  { id: 'hopper', label: 'Salle Hopper', seats: 4 },
];

/** Jours proposés dans le calendrier (semaine du 12 octobre 2026). */
export const DAYS: readonly string[] = ['12/10/2026', '13/10/2026', '14/10/2026', '15/10/2026', '16/10/2026'];

/** `jj/mm/aaaa`, jour et mois avec ou sans zéro, date réellement existante. */
export function isValidDate(input: string): boolean {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) {
    return false;
  }
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/** `hh:mm`, `h:mm` ou `9h30`, entre 00:00 et 23:59. */
export function isValidTime(input: string): boolean {
  const m = /^(\d{1,2})[:h](\d{2})$/.exec(input.trim());
  if (!m) {
    return false;
  }
  return Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

export type TabId = 'aide' | 'date' | 'calendrier' | 'menu' | 'annuaire' | 'heure' | 'hopper' | 'turing' | 'confirmer';

/** Ordre réel de la touche Tab dans la zone : volontairement incohérent (piège F), « Confirmer » en dernier (piège E). */
export const TAB_ORDER: readonly TabId[] = ['aide', 'date', 'calendrier', 'menu', 'annuaire', 'heure', 'hopper', 'turing', 'confirmer'];

/**
 * Élément suivant (ou précédent avec Maj+Tab) dans la séquence ; `null` aux deux bouts :
 * le navigateur reprend alors la main, pour que le participant puisse sortir de la zone (et atteindre « Abandonner »).
 */
export function nextTabId(current: TabId, backwards: boolean): TabId | null {
  const index = TAB_ORDER.indexOf(current);
  const next = index + (backwards ? -1 : 1);
  return next < 0 || next >= TAB_ORDER.length ? null : TAB_ORDER[next];
}

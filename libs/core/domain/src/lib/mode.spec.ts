import { readModeFromSearch } from './mode';

describe('readModeFromSearch', () => {
  it('est animé par défaut', () => {
    expect(readModeFromSearch('')).toBe('anime');
    expect(readModeFromSearch('?foo=bar')).toBe('anime');
  });

  it('passe en autonome avec ?mode=autonome', () => {
    expect(readModeFromSearch('?mode=autonome')).toBe('autonome');
    expect(readModeFromSearch('?a=1&mode=autonome')).toBe('autonome');
  });

  it('ignore une valeur inconnue', () => {
    expect(readModeFromSearch('?mode=autre')).toBe('anime');
  });
});

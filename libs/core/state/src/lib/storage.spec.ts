import { createBrowserStorage, createMemoryStorage } from './storage';

describe('storage', () => {
  it('mémorise, lit et supprime en mémoire', () => {
    const s = createMemoryStorage();
    expect(s.get('k')).toBeNull();
    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });

  it('retombe sur la mémoire quand localStorage lève une erreur', () => {
    const boom = () => {
      throw new Error('indisponible');
    };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
    const s = createBrowserStorage();
    expect(() => s.set('k', 'v')).not.toThrow();
    expect(s.get('k')).toBe('v');
    expect(() => s.remove('k')).not.toThrow();
    jest.restoreAllMocks();
  });
});

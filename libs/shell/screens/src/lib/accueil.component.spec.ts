import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { AccueilComponent } from './accueil.component';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STORAGE, useValue: createMemoryStorage() }],
  });
  const router = TestBed.inject(Router);
  const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AccueilComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const type = (value: string) => {
    const input = el.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };
  return { fixture, el, navigate, type, submit, store: TestBed.inject(GameStore) };
}

describe('AccueilComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('présente les règles et les cinq défis', () => {
    const { el } = setup();
    expect(el.querySelector('h1')?.textContent).toContain('ACCESSIBILITY GAMES');
    expect(el.textContent).toContain('Comment ça marche');
    expect(el.textContent).toContain('essayez jusqu\'au bout');
    expect(el.textContent).not.toContain('à tout moment');
    expect(el.querySelectorAll('.defis li')).toHaveLength(5);
    expect(el.textContent).toContain('Aucune donnée n\'est envoyée à un serveur');
  });

  it('refuse un pseudonyme vide et l\'annonce', () => {
    const { el, navigate, type, submit, store } = setup();
    type('   ');
    submit();
    expect(store.hasPseudo()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('pseudonyme');
  });

  it('enregistre le pseudonyme et ouvre le défi 1', () => {
    const { navigate, type, submit, store } = setup();
    type('  Jules ');
    submit();
    expect(store.pseudo()).toBe('Jules');
    expect(navigate).toHaveBeenCalledWith(['/defi', 1]);
  });

  it('reprend là où le joueur s\'était arrêté', () => {
    const { navigate, type, submit, store } = setup();
    store.setPseudo('Jules');
    store.recordResult({ defiId: 1, outcome: 'expire', stepsDone: 0, points: 0 });
    store.unlock(1);
    type('Jules');
    submit();
    expect(navigate).toHaveBeenCalledWith(['/defi', 2]);
  });

  it('ne propose pas de recommencer quand il n\'y a pas de progression', () => {
    const { el } = setup();
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Recommencer'))).toBe(false);
  });

  it('efface la progression après une confirmation explicite', () => {
    const { fixture, el, store } = setup();
    store.setPseudo('Jules');
    store.recordResult({ defiId: 1, outcome: 'expire', stepsDone: 2, points: 20 });
    fixture.detectChanges();
    const btn = (text: string) =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
    btn('Recommencer').click();
    fixture.detectChanges();
    expect(store.totalPoints()).toBe(20);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('effacés');
    btn('Oui, tout effacer').click();
    fixture.detectChanges();
    expect(store.hasPseudo()).toBe(false);
    expect(store.results()).toEqual([]);
    expect((el.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Recommencer'))).toBe(false);
  });

  it('conserve la progression quand on annule', () => {
    const { fixture, el, store } = setup();
    store.setPseudo('Jules');
    fixture.detectChanges();
    const btn = (text: string) =>
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
    btn('Recommencer').click();
    fixture.detectChanges();
    btn('Annuler').click();
    fixture.detectChanges();
    expect(store.pseudo()).toBe('Jules');
    expect(btn('Recommencer')).toBeDefined();
  });
});

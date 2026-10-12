import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { makeResult } from '@ag/domain';
import { GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { ResultatComponent } from './resultat.component';

function setup(mode: 'anime' | 'autonome' = 'anime', abandoned: number[] = [3]) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STORAGE, useValue: createMemoryStorage() }],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  store.mode.set(mode);
  for (const id of [1, 2, 3, 4, 5] as const) {
    const gone = abandoned.includes(id);
    store.recordResult(makeResult(id, gone ? 'abandonne' : 'expire', gone ? 0 : 3, gone ? 0 : 30));
    store.unlock(id);
  }
  const fixture = TestBed.createComponent(ResultatComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ResultatComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('félicite, donne le total et le bilan', () => {
    const el = setup();
    expect(el.querySelector('h1')?.textContent).toContain('Bravo, Jules');
    expect(el.textContent).toContain('★ 120 pts');
    expect(el.textContent).toContain('4 défis joués sur 5 · 1 défi abandonné');
  });

  it('affiche les badges avant le détail par défi', () => {
    const el = setup();
    const text = el.textContent as string;
    expect(text.indexOf('Vos badges')).toBeGreaterThan(-1);
    expect(text.indexOf('Vos badges')).toBeLessThan(text.indexOf('Détail par défi'));
    expect(text).toContain('Persévérant');
  });

  it('liste les défis abandonnés avec un texte bienveillant', () => {
    const el = setup();
    expect(el.textContent).toContain('Défi 3 — Lecteur d\'écran');
    expect(el.textContent).toContain('Abandonner fait partie du jeu');
    expect(el.textContent).toContain('Abandonné');
  });

  it('n\'affiche pas la zone des défis abandonnés quand il n\'y en a pas', () => {
    const el = setup('anime', []);
    expect(el.querySelector('.abandon')).toBeNull();
  });

  it('contient le message obligatoire sur le score', () => {
    const el = setup();
    expect(el.textContent).toContain(
      "Le score mesure votre progression dans cet atelier. Il ne mesure ni votre niveau professionnel ni votre connaissance réelle de l'accessibilité.",
    );
  });

  it('masque la synthèse en mode animé et l\'affiche en mode autonome', () => {
    expect(setup('anime').textContent).not.toContain('Ce que vous venez de vivre');
    const el = setup('autonome');
    expect(el.textContent).toContain('Ce que vous venez de vivre');
    expect(el.textContent).toContain('Pour des millions de personnes, c\'est le quotidien');
    expect(el.textContent).toContain('Vous avez abandonné le défi 3');
    expect(el.querySelector('.syn strong')?.textContent).toContain('Pour des millions de personnes');
  });

  it('propose le lien vers l\'engagement', () => {
    const link = setup().querySelector('a[href="/engagement"]');
    expect(link).not.toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { Decision, DecisionResult } from '@ag/domain';
import { MISSING_SENTENCES } from './surdite-decisions';
import { SurditeFinComponent } from './surdite-fin.component';
import { SurditeTracker } from './surdite-tracker';

function render(results: readonly (DecisionResult | undefined)[], played = true): HTMLElement {
  TestBed.resetTestingModule();
  const tracker = TestBed.inject(SurditeTracker);
  if (played) {
    tracker.reset();
  }
  results.forEach((result, step) => {
    if (result) {
      const info: Omit<Decision, 'step'> = { result, choice: `choix ${step + 1}`, sentence: `Phrase ${step + 1}.` };
      tracker.record(step, info);
    }
  });
  const fixture = TestBed.createComponent(SurditeFinComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const cards = (el: HTMLElement) => Array.from(el.querySelectorAll('li.carte'));

describe('SurditeFinComponent', () => {
  it('n\'affiche rien quand le défi n\'a pas été joué dans cette session (rechargement de la page)', () => {
    const el = render(['reussi', 'rate'], false);
    expect(el.textContent?.trim()).toBe('');
  });

  it('affiche les 5 cartes avec contexte, choix et verdict en toutes lettres', () => {
    const el = render(['reussi', 'rate', 'reussi', 'rate', 'reussi']);
    expect(el.textContent).toContain('📋 Vos décisions');
    const list = cards(el);
    expect(list).toHaveLength(5);
    expect(list[0].textContent).toContain('① Nom du client');
    expect(list[0].textContent).toContain('choix 1');
    expect(list.map((c) => c.querySelector('.verdict')?.textContent?.trim())).toEqual(['Réussi', 'Raté', 'Réussi', 'Raté', 'Réussi']);
    expect(list.map((c) => c.getAttribute('data-result'))).toEqual(['reussi', 'rate', 'reussi', 'rate', 'reussi']);
    expect(list[0].querySelector('.rond')?.textContent?.trim()).toBe('✓');
    expect(list[1].querySelector('.rond')?.textContent?.trim()).toBe('2');
  });

  it('raconte la relation client : une phrase par étape dans l\'ordre, le résultat et le rappel bienveillant', () => {
    const el = render(['reussi', 'rate', 'reussi', 'rate', 'reussi']);
    expect(el.textContent).toContain('📰 Compte rendu de la relation client');
    expect(el.querySelector('.histoire')?.textContent).toContain('Phrase 1. Phrase 2. Phrase 3. Phrase 4. Phrase 5.');
    expect(el.textContent).toContain('Ce résultat mesure l\'effet d\'un son dégradé, pas votre compétence 😉');
  });

  it('5 sur 5 : 🟢 client conquis ; 3 à 4 : 🟡 ; 1 à 2 : 🟠 ; 0 : 🔴', () => {
    const result = (r: readonly DecisionResult[]) => render(r).querySelector('.resultat')?.textContent ?? '';
    expect(result(['reussi', 'reussi', 'reussi', 'reussi', 'reussi'])).toContain('🟢 Client conquis');
    expect(result(['reussi', 'reussi', 'reussi', 'rate', 'rate'])).toContain('🟡 Client rappelé, avec quelques malentendus');
    expect(result(['reussi', 'rate', 'rate', 'rate', 'rate'])).toContain('🟠 Client perplexe');
    expect(result(['rate', 'rate', 'rate', 'rate', 'rate'])).toContain('🔴 Client perdu');
  });

  it('fin partielle : décisions prises + « Non abordée », phrases « temps écoulé » pour les étapes manquantes', () => {
    const el = render(['reussi', 'rate']);
    const list = cards(el);
    expect(list).toHaveLength(5);
    expect(list.map((c) => c.querySelector('.verdict')?.textContent?.trim())).toEqual([
      'Réussi',
      'Raté',
      'Non abordée',
      'Non abordée',
      'Non abordée',
    ]);
    expect(list[2].querySelector('.rond')?.textContent?.trim()).toBe('3');
    expect(list[2].textContent).toContain('Pas de décision prise');
    const story = el.querySelector('.histoire')?.textContent ?? '';
    expect(story).toContain(`Phrase 1. Phrase 2. ${MISSING_SENTENCES.slice(2).join(' ')}`);
    expect(story).not.toContain('Phrase 3.');
    expect(el.querySelector('.resultat')?.textContent).toContain('🟠 Appel interrompu');
    expect(el.querySelector('.resultat')?.textContent).toContain('2 réponses sur 5');
  });

  it('sans aucune décision (abandon dès le départ) : 5 cartes « Non abordée », les 5 phrases « temps écoulé », client en attente', () => {
    const el = render([]);
    expect(cards(el)).toHaveLength(5);
    expect(cards(el).every((c) => c.querySelector('.verdict')?.textContent?.trim() === 'Non abordée')).toBe(true);
    expect(el.querySelector('.histoire')?.textContent).toContain(MISSING_SENTENCES.join(' '));
    expect(el.querySelector('.resultat')?.textContent).toContain('🔴 Client en attente');
  });

  it('plus de la moitié des réponses données : appel coupé juste avant la fin', () => {
    const text = render(['reussi', 'reussi', 'reussi', 'rate']).querySelector('.resultat')?.textContent ?? '';
    expect(text).toContain('🟡 Appel coupé juste avant la fin');
    expect(text).toContain('4 réponses sur 5');
  });

  it('toutes les réponses données : jamais de mention d\'appel interrompu', () => {
    const text = render(['rate', 'rate', 'rate', 'rate', 'rate']).querySelector('.resultat')?.textContent ?? '';
    expect(text).toContain('🔴 Client perdu');
    expect(text).not.toContain('Appel');
  });
});

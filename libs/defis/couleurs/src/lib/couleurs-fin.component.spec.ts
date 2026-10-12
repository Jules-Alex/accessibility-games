import { TestBed } from '@angular/core/testing';
import { Decision, DecisionResult } from '@ag/domain';
import { MISSING_SENTENCES } from './couleurs-decisions';
import { CouleursFinComponent } from './couleurs-fin.component';
import { CouleursTracker } from './couleurs-tracker';

function render(results: readonly (DecisionResult | undefined)[]): HTMLElement {
  TestBed.resetTestingModule();
  const tracker = TestBed.inject(CouleursTracker);
  tracker.reset();
  results.forEach((result, step) => {
    if (result) {
      const info: Omit<Decision, 'step'> = { result, choice: `choix ${step + 1}`, sentence: `Phrase ${step + 1}.` };
      tracker.record(step, info);
    }
  });
  const fixture = TestBed.createComponent(CouleursFinComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const cards = (el: HTMLElement) => Array.from(el.querySelectorAll('li.carte'));

describe('CouleursFinComponent', () => {
  it('rien à afficher si aucune partie n\'a été jouée dans cette session (rechargement de la page)', () => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(CouleursFinComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('section')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });

  it('sans aucune décision (abandon dès le départ) : 5 cartes « Non abordée » et la séance ajournée', () => {
    const el = render([]);
    expect(cards(el)).toHaveLength(5);
    expect(cards(el).every((c) => c.querySelector('.verdict')?.textContent?.trim() === 'Non abordée')).toBe(true);
    expect(el.querySelector('.resultat')?.textContent).toContain('🔴 Séance ajournée');
    const story = el.querySelector('.histoire')?.textContent ?? '';
    expect(story).toContain(MISSING_SENTENCES.join(' '));
  });

  it('affiche les 5 cartes de décisions avec contexte, choix et verdict en toutes lettres', () => {
    const el = render(['reussi', 'rate', 'reussi', 'partiel', 'rate']);
    expect(el.textContent).toContain('📋 Vos décisions du comité');
    const list = cards(el);
    expect(list).toHaveLength(5);
    expect(list[0].textContent).toContain('① PMO · Projet en retard');
    expect(list[0].textContent).toContain('choix 1');
    expect(list.map((c) => c.querySelector('.verdict')?.textContent?.trim())).toEqual(['Réussi', 'Raté', 'Réussi', 'Partiel', 'Raté']);
    expect(list.map((c) => c.getAttribute('data-result'))).toEqual(['reussi', 'rate', 'reussi', 'partiel', 'rate']);
    expect(list[0].querySelector('.rond')?.textContent?.trim()).toBe('✓');
    expect(list[1].querySelector('.rond')?.textContent?.trim()).toBe('2');
  });

  it('ajoute l\'ordre idéal à la carte du classement', () => {
    const el = render(['reussi', 'reussi', 'reussi', 'partiel', 'reussi']);
    expect(cards(el)[3].textContent).toContain('Ordre idéal : Gamma › Omega › Lambda › Thêta › Zêta');
    expect(cards(el)[0].textContent).not.toContain('Ordre idéal');
  });

  it('raconte l\'histoire : une phrase par décision, dans l\'ordre, puis le résultat et le rappel bienveillant', () => {
    const el = render(['reussi', 'rate', 'reussi', 'partiel', 'rate']);
    expect(el.textContent).toContain('📰 Compte rendu du comité de pilotage');
    const story = el.querySelector('.histoire')?.textContent ?? '';
    expect(story).toContain('Phrase 1. Phrase 2. Phrase 3. Phrase 4. Phrase 5.');
    expect(el.textContent).toContain('Ce résultat mesure l\'effet des couleurs, pas votre compétence 😉');
  });

  it('5 sur 5 : 🟢 plan adopté à l\'unanimité', () => {
    const el = render(['reussi', 'reussi', 'reussi', 'reussi', 'reussi']);
    const result = el.querySelector('.resultat')?.textContent ?? '';
    expect(result).toContain('🟢');
    expect(result).toContain('Plan adopté à l\'unanimité');
  });

  it('3 à 4 : 🟡, 1 à 2 (et demi-points) : 🟠, 0 : 🔴', () => {
    expect(render(['reussi', 'reussi', 'reussi', 'rate', 'rate']).querySelector('.resultat')?.textContent).toContain('🟡 Adopté sous réserve');
    expect(render(['reussi', 'rate', 'reussi', 'partiel', 'rate']).querySelector('.resultat')?.textContent).toContain('🟠 Renvoyé en commission');
    expect(render(['rate', 'rate', 'rate', 'rate', 'rate']).querySelector('.resultat')?.textContent).toContain('🔴 Séance suspendue');
  });

  it('fin partielle (abandon) : décisions prises + « Non abordée », phrases « temps écoulé » pour les étapes non faites', () => {
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
    expect(el.querySelector('.resultat')?.textContent).toContain('🟠');
  });

  it('séance interrompue : la conclusion s\'adapte au nombre de réponses', () => {
    const few = render(['reussi', 'rate']).querySelector('.resultat')?.textContent ?? '';
    expect(few).toContain('🟠 Séance levée en cours de route');
    expect(few).toContain('2 dossiers sur 5');
    const many = render(['reussi', 'reussi', 'reussi', 'rate']).querySelector('.resultat')?.textContent ?? '';
    expect(many).toContain('🟡 Séance levée juste avant la fin');
    expect(many).toContain('4 dossiers traités sur 5');
  });

  it('toutes les réponses données : jamais de mention de séance levée', () => {
    const text = render(['rate', 'rate', 'rate', 'rate', 'rate']).querySelector('.resultat')?.textContent ?? '';
    expect(text).toContain('🔴 Séance suspendue');
    expect(text).not.toContain('Séance levée');
  });

  it('chaque verdict est écrit en toutes lettres (la couleur n\'est jamais seule)', () => {
    const el = render(['reussi', 'rate', 'partiel', 'reussi', 'rate']);
    for (const c of cards(el)) {
      expect(c.querySelector('.verdict')?.textContent?.trim().length).toBeGreaterThan(0);
    }
  });
});

import { TestBed } from '@angular/core/testing';
import { Outcome, getDefiMeta, makeResult } from '@ag/domain';
import { FinDefiComponent } from './fin-defi.component';

function render(outcome: Outcome, stepsDone: number, defiId: 1 | 2 | 3 | 4 | 5 = 1): HTMLElement {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(FinDefiComponent);
  fixture.componentRef.setInput('meta', getDefiMeta(defiId));
  fixture.componentRef.setInput('result', makeResult(defiId, outcome, stepsDone, stepsDone * 10));
  fixture.componentRef.setInput('resume', { vecu: 'v', impact: 'i', action: 'a' });
  fixture.componentRef.setInput('mode', 'anime');
  fixture.componentRef.setInput('totalPoints', stepsDone * 10);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('FinDefiComponent : résultat du défi', () => {
  it('place le résultat dans un cadre en première ligne visible', () => {
    const el = render('termine', 5);
    const section = el.querySelector('section.fin') as HTMLElement;
    const firstVisible = Array.from(section.children).find((c) => !c.classList.contains('ag-sr-only'));
    expect(firstVisible).toBe(el.querySelector('.resultat'));
  });

  it('affiche le pictogramme (décoratif) et le texte quand le défi est terminé', () => {
    const frame = render('termine', 5).querySelector('.resultat') as HTMLElement;
    expect(frame.classList.contains('resultat--ok')).toBe(true);
    expect(frame.querySelector('.resultat__t')?.textContent?.trim()).toBe('Défi terminé');
    const icon = frame.querySelector('.resultat__ic') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('✅');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('5 étapes sur 5');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('Maître du zoom');
  });

  it('affiche « Temps écoulé » avec son pictogramme et le nombre d\'étapes', () => {
    const frame = render('expire', 3).querySelector('.resultat') as HTMLElement;
    expect(frame.classList.contains('resultat--warn')).toBe(true);
    expect(frame.querySelector('.resultat__t')?.textContent?.trim()).toBe('Temps écoulé');
    expect(frame.querySelector('.resultat__ic')?.textContent?.trim()).toBe('⏱');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('3 étapes sur 5');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('Persévérant');
  });

  it('affiche « Défi abandonné » sans badge', () => {
    const frame = render('abandonne', 1).querySelector('.resultat') as HTMLElement;
    expect(frame.classList.contains('resultat--neutral')).toBe(true);
    expect(frame.querySelector('.resultat__t')?.textContent?.trim()).toBe('Défi abandonné');
    expect(frame.querySelector('.resultat__ic')?.textContent?.trim()).toBe('🏳');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('1 étape sur 5');
    expect(frame.querySelector('.resultat__s')?.textContent).toContain('aucun badge');
  });

  it('ne met plus le résultat dans un badge, mais garde niveau et score en dessous', () => {
    const el = render('expire', 3);
    const badges = Array.from(el.querySelectorAll('ag-badge')).map((b) => b.textContent ?? '');
    expect(badges.some((t) => /Défi terminé|Temps écoulé|Défi abandonné/.test(t))).toBe(false);
    expect(badges.some((t) => t.includes('NIVEAU 1/5'))).toBe(true);
    expect(badges.some((t) => t.includes('★ 30 pts'))).toBe(true);
    const frame = el.querySelector('.resultat') as HTMLElement;
    const tete = el.querySelector('.fin__tete') as HTMLElement;
    expect(frame.compareDocumentPosition(tete) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('défi à étapes réussies : les pastilles disent « réussie » / « non réussie »', () => {
    const labels = Array.from(render('expire', 3).querySelectorAll('ag-step-pills li')).map((li) => li.getAttribute('aria-label'));
    expect(labels[0]).toBe('Étape 1 sur 5 : réussie');
    expect(labels[3]).toBe('Étape 4 sur 5 : non réussie');
  });

  it('défi à points (couleurs) : les pastilles restent neutres (« traitée » / « non traitée »)', () => {
    const labels = Array.from(render('abandonne', 2, 4).querySelectorAll('ag-step-pills li')).map((li) => li.getAttribute('aria-label'));
    expect(labels[0]).toBe('Étape 1 sur 5 : traitée');
    expect(labels[3]).toBe('Étape 4 sur 5 : non traitée');
    expect(labels.join(' ')).not.toContain('réussie');
  });
});

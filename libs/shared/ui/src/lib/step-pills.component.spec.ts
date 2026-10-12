import { TestBed } from '@angular/core/testing';
import { StepPillsComponent } from './step-pills.component';

function render(total: number, done: number, result = false, texts: { doneText?: string; missedText?: string } = {}) {
  const fixture = TestBed.createComponent(StepPillsComponent);
  fixture.componentRef.setInput('total', total);
  fixture.componentRef.setInput('done', done);
  fixture.componentRef.setInput('result', result);
  for (const [k, v] of Object.entries(texts)) {
    fixture.componentRef.setInput(k, v);
  }
  fixture.detectChanges();
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
}

describe('StepPillsComponent', () => {
  it('affiche ✓ pour les étapes faites, le numéro courant puis les suivantes', () => {
    const pills = render(5, 2);
    expect(pills.map((p) => p.textContent?.trim())).toEqual(['✓', '✓', '3', '4', '5']);
    expect(pills[2].getAttribute('aria-current')).toBe('step');
    expect(pills[3].getAttribute('aria-current')).toBeNull();
  });

  it('décrit chaque étape par un texte', () => {
    const pills = render(4, 1);
    expect(pills[0].getAttribute('aria-label')).toBe('Étape 1 sur 4 : réussie');
    expect(pills[1].getAttribute('aria-label')).toBe('Étape 2 sur 4 : en cours');
    expect(pills[2].getAttribute('aria-label')).toBe('Étape 3 sur 4 : à venir');
  });

  it('en mode résultat, marque les étapes non faites d\'une croix', () => {
    const pills = render(5, 3, true);
    expect(pills.map((p) => p.textContent?.trim())).toEqual(['✓', '✓', '✓', '✗', '✗']);
    expect(pills[3].getAttribute('aria-label')).toBe('Étape 4 sur 5 : non réussie');
  });

  it('accepte un vocabulaire neutre pour les étapes faites et non faites, sans changer le reste', () => {
    const pills = render(4, 2, true, { doneText: 'traitée', missedText: 'non traitée' });
    expect(pills.map((p) => p.getAttribute('aria-label'))).toEqual([
      'Étape 1 sur 4 : traitée',
      'Étape 2 sur 4 : traitée',
      'Étape 3 sur 4 : non traitée',
      'Étape 4 sur 4 : non traitée',
    ]);
    expect(pills.map((p) => p.textContent?.trim())).toEqual(['✓', '✓', '✗', '✗']);
    expect(render(4, 1, false, { doneText: 'traitée' })[1].getAttribute('aria-label')).toBe('Étape 2 sur 4 : en cours');
  });

  it('gère un défi entièrement terminé', () => {
    expect(render(3, 3).map((p) => p.textContent?.trim())).toEqual(['✓', '✓', '✓']);
  });
});

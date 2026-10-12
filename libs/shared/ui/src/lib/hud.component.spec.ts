import { TestBed } from '@angular/core/testing';
import { HudComponent } from './hud.component';

function setup(overrides: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(HudComponent);
  const inputs: Record<string, unknown> = {
    icon: '🔍',
    niveau: 1,
    title: 'Zoom et perte de contexte',
    points: 20,
    gain: null,
    remainingMs: 86_000,
    totalMs: 120_000,
    stepsTotal: 5,
    stepsDone: 1,
    mission: 'Saisissez le champ **Référence**',
    ...overrides,
  };
  for (const [k, v] of Object.entries(inputs)) {
    fixture.componentRef.setInput(k, v);
  }
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('HudComponent', () => {
  it('affiche niveau, titre, score et temps', () => {
    const { el } = setup();
    expect(el.textContent).toContain('NIVEAU 1/5');
    expect(el.querySelector('h1')?.textContent).toContain('Zoom et perte de contexte');
    expect(el.textContent).toContain('★ 20 pts');
    expect(el.textContent).toContain('01:26 restantes');
  });

  it('décrit les étapes faites par « réussie » par défaut, ou par le mot fourni', () => {
    expect(setup().el.querySelector('ag-step-pills li')?.getAttribute('aria-label')).toBe('Étape 1 sur 5 : réussie');
    expect(setup({ doneText: 'traitée' }).el.querySelector('ag-step-pills li')?.getAttribute('aria-label')).toBe('Étape 1 sur 5 : traitée');
  });

  it('affiche l\'étape courante et met le mot-clé en évidence', () => {
    const { el } = setup();
    expect(el.textContent).toContain('Étape 2/5');
    expect(el.querySelector('.key')?.textContent).toBe('Référence');
  });

  it('affiche le gain de points quand il y en a un', () => {
    const { el } = setup({ gain: { id: 1, amount: 10 } });
    expect(el.querySelector('.gain')?.textContent).toContain('+10');
  });

  it('émet « abandon » au clic sur le bouton', () => {
    const { fixture, el } = setup();
    let count = 0;
    fixture.componentInstance.abandon.subscribe(() => (count += 1));
    (el.querySelector('button.abandon') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });
});

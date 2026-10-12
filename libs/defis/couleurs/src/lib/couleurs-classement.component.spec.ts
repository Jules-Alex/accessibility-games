import { TestBed } from '@angular/core/testing';
import { RankStepDef, STEPS } from './couleurs-content';
import { CouleursClassementComponent } from './couleurs-classement.component';

function render() {
  TestBed.resetTestingModule();
  const def = STEPS[3] as RankStepDef;
  const fixture = TestBed.createComponent(CouleursClassementComponent);
  fixture.componentRef.setInput('stepIndex', 3);
  fixture.componentRef.setInput('items', def.items);
  fixture.componentRef.setInput('legend', def.legend);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const emitted: { step: number; order: readonly string[] }[] = [];
  fixture.componentInstance.ranked.subscribe((e) => emitted.push(e));
  const btn = (id: string) => el.querySelector(`button[data-id="${id}"]`) as HTMLButtonElement;
  const click = (id: string) => {
    btn(id).click();
    fixture.detectChanges();
  };
  return { el, emitted, btn, click };
}

describe('CouleursClassementComponent', () => {
  it('affiche les 5 projets avec leur nom, un nom accessible et la légende de criticité', () => {
    const { el, btn } = render();
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(5);
    expect(btn('gamma').textContent).toContain('Gamma');
    expect(btn('gamma').getAttribute('aria-label')).toBe('Gamma, criticité maximale');
    expect(el.querySelectorAll('ul.legende li')).toHaveLength(5);
  });

  it('numérote les projets dans l\'ordre des clics', () => {
    const { btn, click } = render();
    click('omega');
    click('gamma');
    expect(btn('omega').querySelector('.rang')?.textContent?.trim()).toBe('1');
    expect(btn('gamma').querySelector('.rang')?.textContent?.trim()).toBe('2');
    expect(btn('lambda').querySelector('.rang')?.textContent?.trim()).toBe('');
    expect(btn('omega').getAttribute('aria-label')).toBe('Omega, classé numéro 1');
    expect(btn('omega').getAttribute('aria-disabled')).toBe('true');
    expect(btn('lambda').getAttribute('aria-disabled')).toBeNull();
  });

  it('un projet déjà classé n\'est pas compté deux fois', () => {
    const { btn, click, emitted } = render();
    click('omega');
    click('omega');
    expect(btn('omega').querySelector('.rang')?.textContent?.trim()).toBe('1');
    for (const id of ['gamma', 'lambda', 'theta']) {
      click(id);
    }
    expect(emitted).toEqual([]);
  });

  it('n\'émet qu\'une fois, quand les 5 projets sont classés, avec l\'ordre des clics', () => {
    const { click, emitted } = render();
    for (const id of ['zeta', 'theta', 'lambda', 'omega']) {
      click(id);
    }
    expect(emitted).toEqual([]);
    click('gamma');
    expect(emitted).toEqual([{ step: 3, order: ['zeta', 'theta', 'lambda', 'omega', 'gamma'] }]);
    click('gamma');
    click('zeta');
    expect(emitted).toHaveLength(1);
  });
});

import { TestBed } from '@angular/core/testing';
import { STEPS, ChoiceStepDef } from './couleurs-content';
import { CouleursChoixComponent } from './couleurs-choix.component';

function render(stepIndex: number) {
  TestBed.resetTestingModule();
  const def = STEPS[stepIndex] as ChoiceStepDef;
  const fixture = TestBed.createComponent(CouleursChoixComponent);
  fixture.componentRef.setInput('stepIndex', stepIndex);
  fixture.componentRef.setInput('items', def.items);
  fixture.componentRef.setInput('legend', def.legend);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const emitted: { step: number; id: string }[] = [];
  fixture.componentInstance.picked.subscribe((e) => emitted.push(e));
  const btn = (id: string) => el.querySelector(`button[data-id="${id}"]`) as HTMLButtonElement;
  return { el, emitted, btn, fixture };
}

describe('CouleursChoixComponent', () => {
  it('étape 1 : un bouton par projet avec son nom visible, son nom accessible et la légende', () => {
    const { el, btn } = render(0);
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(8);
    expect(btn('delta').textContent).toContain('Delta');
    expect(btn('delta').getAttribute('aria-label')).toBe('Delta, en retard');
    const legend = Array.from(el.querySelectorAll('ul.legende li')).map((li) => li.textContent?.trim());
    expect(legend).toEqual(['dans les temps', 'à surveiller', 'en retard']);
    expect(el.querySelector('.items')?.getAttribute('data-kind')).toBe('projet');
  });

  it('étape 2 : les barres ne montrent aucun texte, seulement leur couleur et un nom accessible', () => {
    const { el, btn } = render(1);
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(5);
    for (const b of Array.from(el.querySelectorAll('button[data-id]'))) {
      expect(b.textContent?.trim()).toBe('');
      expect(b.getAttribute('aria-label')).toBeTruthy();
    }
    expect(btn('depassement').getAttribute('aria-label')).toBe('Barre « dépassement »');
    expect(el.querySelector('.items')?.getAttribute('data-kind')).toBe('barre');
  });

  it('étape 3 : les champs montrent leur libellé et leur valeur, et disent s\'ils sont en erreur', () => {
    const { el, btn } = render(2);
    expect(btn('budget').textContent).toContain('Budget (k€)');
    expect(btn('budget').textContent).toContain('120');
    expect(btn('budget').getAttribute('aria-label')).toBe('Budget (k€) : 120, en erreur');
    expect(btn('debut').getAttribute('aria-label')).toBe('Date de début : 12/10/2026, valide');
    expect(el.querySelector('.items')?.getAttribute('data-kind')).toBe('champ');
  });

  it('étape 5 : les boutons de couleur n\'ont pas de texte, pas de légende', () => {
    const { el, btn } = render(4);
    expect(el.querySelectorAll('button[data-id]')).toHaveLength(4);
    expect(btn('olive').textContent?.trim()).toBe('');
    expect(btn('olive').getAttribute('aria-label')).toBe('Bouton vert olive');
    expect(el.querySelector('ul.legende')).toBeNull();
  });

  it('émet l\'étape et l\'identifiant de l\'élément cliqué', () => {
    const { btn, emitted } = render(0);
    btn('kappa').click();
    expect(emitted).toEqual([{ step: 0, id: 'kappa' }]);
  });

  it('les éléments sont de vrais boutons (clavier : Entrée ou Espace natifs)', () => {
    const { el } = render(0);
    for (const b of Array.from(el.querySelectorAll('[data-id]'))) {
      expect(b.tagName).toBe('BUTTON');
      expect(b.getAttribute('type')).toBe('button');
    }
  });
});

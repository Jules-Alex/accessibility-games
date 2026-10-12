import { TestBed } from '@angular/core/testing';
import { CodeEntryComponent } from './code-entry.component';

function setup(invalid = false) {
  const fixture = TestBed.createComponent(CodeEntryComponent);
  fixture.componentRef.setInput('invalid', invalid);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('CodeEntryComponent', () => {
  it('émet le code saisi à l\'envoi du formulaire', () => {
    const { fixture, el } = setup();
    const sent: string[] = [];
    fixture.componentInstance.submitted.subscribe((c) => sent.push(c));
    const input = el.querySelector('input') as HTMLInputElement;
    input.value = '4 8 2 1';
    input.dispatchEvent(new Event('input'));
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    expect(sent).toEqual(['4 8 2 1']);
  });

  it('annonce un code incorrect', () => {
    const { el } = setup(true);
    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Code incorrect');
    expect((el.querySelector('input') as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
  });

  it('n\'affiche pas d\'alerte tant que le code n\'est pas refusé', () => {
    const { el } = setup(false);
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('annonce à nouveau le message à chaque tentative refusée', () => {
    const { fixture, el } = setup(true);
    const first = el.querySelector('[role="alert"]');
    expect(first).not.toBeNull();
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    const second = el.querySelector('[role="alert"]');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { EngagementComponent } from './engagement.component';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: STORAGE, useValue: createMemoryStorage() }],
  });
  TestBed.inject(GameStore).setPseudo('Jules');
  const fixture = TestBed.createComponent(EngagementComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const boxes = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const toggle = (i: number) => {
    boxes()[i].click();
    fixture.detectChanges();
  };
  return { fixture, el, boxes, toggle };
}

describe('EngagementComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('propose six actions à cocher', () => {
    const { boxes } = setup();
    expect(boxes()).toHaveLength(6);
  });

  it('écrit la phrase d\'engagement au fil des choix', () => {
    const { el, toggle } = setup();
    expect(el.querySelector('.phrase')).toBeNull();
    toggle(0);
    toggle(2);
    expect(el.querySelector('.phrase')?.textContent).toContain(
      "Moi, Jules, je m'engage à : ajouter des critères d'accessibilité dans mes User Stories ; demander une démonstration au clavier avant de valider.",
    );
  });

  it('limite à trois actions en désactivant les autres cases', () => {
    const { boxes, toggle } = setup();
    toggle(0);
    toggle(1);
    toggle(2);
    expect(boxes()[3].disabled).toBe(true);
    expect(boxes()[0].disabled).toBe(false);
    toggle(0);
    expect(boxes()[3].disabled).toBe(false);
  });

  it('copie l\'engagement dans le presse-papiers et le confirme', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { fixture, el, toggle } = setup();
    toggle(5);
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Copier')) as HTMLButtonElement).click();
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Moi, Jules, je m\'engage à'));
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Copié');
  });

  it('indique quand la copie est impossible', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockRejectedValue(new Error('refusé')) },
      configurable: true,
    });
    const { fixture, el, toggle } = setup();
    toggle(0);
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Copier')) as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Copie impossible');
  });

  it('désactive « Copier » et « Terminer » sans action choisie', () => {
    const { el } = setup();
    const buttons = Array.from(el.querySelectorAll('button'));
    expect(buttons.find((b) => b.textContent?.includes('Copier'))?.disabled).toBe(true);
    expect(buttons.find((b) => b.textContent?.includes('Terminer'))?.disabled).toBe(true);
  });

  it('affiche un message de clôture à la fin', () => {
    const { fixture, el, toggle } = setup();
    toggle(0);
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Terminer')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Merci, Jules');
  });

  it('déplace le focus sur le titre de remerciement après « Terminer »', async () => {
    const { fixture, el, toggle } = setup();
    document.body.appendChild(el);
    toggle(0);
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Terminer')) as HTMLButtonElement).focus();
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Terminer')) as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.tagName).toBe('H1');
    expect(document.activeElement?.textContent).toContain('Merci, Jules');
    el.remove();
  });
});

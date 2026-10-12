import { TestBed } from '@angular/core/testing';
import { LecteurParisComponent } from './lecteur-paris.component';
import { ParisTracker } from './paris-tracker';

function render(bets: { options: number; won: boolean }[]): HTMLElement {
  TestBed.resetTestingModule();
  const tracker = TestBed.inject(ParisTracker);
  tracker.reset();
  for (const b of bets) {
    tracker.record(b.options, b.won);
  }
  const fixture = TestBed.createComponent(LecteurParisComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('LecteurParisComponent', () => {
  it('affiche les paris gagnés, le total et ce que le hasard donnerait', () => {
    const el = render([
      { options: 3, won: true },
      { options: 4, won: false },
      { options: 2, won: false },
      { options: 2, won: true },
    ]);
    expect(el.textContent).toContain('🎲');
    expect(el.textContent).toContain('2 gagnés sur 4');
    expect(el.textContent).toContain('le hasard donne environ 2 sur 4');
  });

  it('accorde « gagné » au singulier', () => {
    expect(render([{ options: 3, won: true }]).textContent).toContain('1 gagné sur 1');
  });

  it('n\'affiche rien quand aucun pari n\'a été fait (défi abandonné d\'emblée)', () => {
    expect(render([]).textContent?.trim()).toBe('');
  });
});

import { TestBed } from '@angular/core/testing';
import { GaugeComponent } from './gauge.component';

function render(remainingMs: number, totalMs = 120_000) {
  const fixture = TestBed.createComponent(GaugeComponent);
  fixture.componentRef.setInput('remainingMs', remainingMs);
  fixture.componentRef.setInput('totalMs', totalMs);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('GaugeComponent', () => {
  it('écrit le temps restant en toutes lettres', () => {
    expect(render(86_000).textContent).toContain('01:26 restantes');
  });

  it('expose une barre de progression accessible', () => {
    const bar = render(86_000).querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).toBe('86');
    expect(bar.getAttribute('aria-valuemax')).toBe('120');
    expect(bar.getAttribute('aria-valuetext')).toBe('01:26 restantes');
  });

  it('passe en mode urgent dans les 20 dernières secondes', () => {
    expect(render(15_000).querySelector('.gauge--urgent')).not.toBeNull();
    expect(render(45_000).querySelector('.gauge--urgent')).toBeNull();
  });

  it('remplit la jauge au pourcentage restant', () => {
    const fill = render(60_000).querySelector('.gauge__fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });
});

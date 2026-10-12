import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  it('applique la variante demandée', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentRef.setInput('variant', 'score');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).className).toContain('ag-badge--score');
  });

  it('est neutre par défaut', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).className).toContain('ag-badge--neutre');
  });
});

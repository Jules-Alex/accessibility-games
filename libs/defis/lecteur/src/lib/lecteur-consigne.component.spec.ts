import { TestBed } from '@angular/core/testing';
import { LecteurConsigneComponent } from './lecteur-consigne.component';
import { VOICE_PORT, VoicePort } from './voice.service';

function render(withFrench: boolean) {
  const spoken: string[] = [];
  const cancelled = { count: 0 };
  const port: VoicePort = {
    voices: () => (withFrench ? [{ lang: 'fr-FR', name: 'Amelie' }] : []),
    speak: (text) => {
      spoken.push(text);
      return new Promise<void>(() => undefined);
    },
    cancel: () => {
      cancelled.count += 1;
    },
    onVoicesChanged: () => undefined,
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: VOICE_PORT, useValue: port }] });
  const fixture = TestBed.createComponent(LecteurConsigneComponent);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, spoken, fixture, cancelled };
}

describe('LecteurConsigneComponent', () => {
  it('demande de mettre le casque et rappelle les touches', () => {
    const { el } = render(true);
    expect(el.textContent).toContain('Mettez votre casque');
    expect(el.textContent).toContain('Tab');
    expect(el.textContent).toContain('Entrée');
    expect(el.textContent).toContain('R pour répéter');
  });

  it('teste la voix en lisant une phrase au clic sur le bouton', () => {
    const { el, spoken } = render(true);
    const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Tester la voix')) as HTMLButtonElement;
    button.click();
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toContain('Test de la voix');
  });

  it('prévient quand aucune voix française n\'est disponible et annonce les sous-titres', () => {
    const { el, fixture } = render(false);
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Aucune voix française');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('sous-titres');
  });

  it('n\'affiche pas d\'avertissement quand une voix française existe', () => {
    expect(render(true).el.querySelector('[role="status"]')?.textContent?.trim() ?? '').toBe('');
  });

  it('affiche les sous-titres du test quand il n\'y a pas de voix', () => {
    const { el, fixture } = render(false);
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Tester la voix')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Test de la voix');
  });

  it('coupe la voix de test quand la consigne est quittée', () => {
    const { fixture, cancelled } = render(true);
    const before = cancelled.count;
    fixture.destroy();
    expect(cancelled.count).toBeGreaterThan(before);
  });
});

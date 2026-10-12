import { TestBed } from '@angular/core/testing';
import { AUDIO_PORT, AudioPort } from './audio-port';
import { AlternativeMode } from './alternative-mode';
import { SurditeConsigneComponent } from './surdite-consigne.component';

function render(options: { port?: AudioPort | null } = {}) {
  const plays: string[] = [];
  let stops = 0;
  const port: AudioPort | null =
    options.port === undefined
      ? {
          load: () => Promise.resolve(4),
          play: (url) => {
            plays.push(url);
            return new Promise<void>(() => undefined);
          },
          stop: () => {
            stops += 1;
          },
        }
      : options.port;
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: AUDIO_PORT, useValue: port }] });
  const alternative = TestBed.inject(AlternativeMode);
  const fixture = TestBed.createComponent(SurditeConsigneComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const button = (text: string) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
  return { fixture, el, plays, stops: () => stops, alternative, button };
}

describe('SurditeConsigneComponent', () => {
  it('demande de mettre le casque et rappelle les écoutes', () => {
    const { el } = render();
    expect(el.textContent).toContain('Mettez votre casque');
    expect(el.textContent).toContain('3 écoutes par étape (touche R)');
  });

  it('teste le son : joue l\'échantillon déjà dégradé', () => {
    const { button, plays } = render();
    button('Tester le son').click();
    expect(plays).toEqual(['audio/defi5/test-echantillon.wav']);
  });

  it('prévient quand le son ne peut pas être joué et propose la transcription', async () => {
    const { button, fixture, el } = render({ port: null });
    button('Tester le son').click();
    await Promise.resolve();
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Le son n\'a pas pu être joué');
  });

  it('garde la zone d\'état dans l\'arbre d\'accessibilité même vide (sinon l\'annonce de l\'échec est manquée)', () => {
    const { el } = render();
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status).not.toBeNull();
    expect(status.textContent?.trim()).toBe('');
    expect(status.hidden).toBe(false);
  });

  it('active et désactive la transcription pour toute la partie', () => {
    const { button, alternative, fixture, el } = render();
    expect(button('Besoin d\'une alternative (transcription) ?').getAttribute('aria-pressed')).toBe('false');
    button('Besoin d\'une alternative (transcription) ?').click();
    fixture.detectChanges();
    expect(alternative.enabled()).toBe(true);
    expect(el.textContent).toContain('Transcription activée');
    button('Transcription activée').click();
    fixture.detectChanges();
    expect(alternative.enabled()).toBe(false);
  });

  it('coupe le son de test quand la consigne est quittée', () => {
    const { fixture, stops } = render();
    const before = stops();
    fixture.destroy();
    expect(stops()).toBeGreaterThan(before);
  });
});

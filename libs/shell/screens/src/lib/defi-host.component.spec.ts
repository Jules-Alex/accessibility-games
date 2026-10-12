import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DEFIS, UNLOCK_CODES } from '@ag/domain';
import { DEFI_DEFINITIONS, DefiDefinition, DefiSession, GameStore, STORAGE, createMemoryStorage } from '@ag/state';
import { DefiHostComponent } from './defi-host.component';

@Component({
  selector: 'ag-test-player',
  template: '<button type="button" id="valider" (click)="session.completeStep()">Valider l\'étape</button>',
})
class TestPlayerComponent {
  protected readonly session = inject(DefiSession);
}

@Component({
  selector: 'ag-test-hidden-player',
  template: '<button type="button" id="valider" (click)="valider()">Valider l\'étape</button>',
})
class TestHiddenPlayerComponent {
  private readonly session = inject(DefiSession);

  protected valider(): void {
    this.session.addHiddenPoints(10);
    this.session.completeStep(0);
  }
}

@Component({
  selector: 'ag-test-consigne-extra',
  template: '<p id="extra-consigne">Bloc extra de consigne</p>',
})
class TestConsigneExtraComponent {}

const definitions: DefiDefinition[] = DEFIS.map((meta) => ({
  id: meta.id,
  situation: `Situation du défi ${meta.id}`,
  missionPills: Array.from({ length: meta.stepsTotal }, (_, i) => `Étape ${i + 1}`),
  stepPrompts: Array.from({ length: meta.stepsTotal }, (_, i) => `Validez l'étape **${i + 1}**`),
  resume: { vecu: 'Vécu test', impact: 'Impact test', action: 'Action test' },
  player: () => Promise.resolve(TestPlayerComponent),
}));

const hiddenDefinitions: DefiDefinition[] = definitions.map((d) => ({ ...d, player: () => Promise.resolve(TestHiddenPlayerComponent) }));

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let i = 0; i < 5; i++) {
    fixture.detectChanges();
    await Promise.resolve();
  }
  await fixture.whenStable();
  fixture.detectChanges();
}

function button(el: HTMLElement, text: string): HTMLButtonElement {
  const found = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));
  if (!found) {
    throw new Error(`Bouton introuvable : ${text}`);
  }
  return found as HTMLButtonElement;
}

function setup(id = '1', defs: readonly DefiDefinition[] = definitions) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: STORAGE, useValue: createMemoryStorage() },
      { provide: DEFI_DEFINITIONS, useValue: defs },
    ],
  });
  const store = TestBed.inject(GameStore);
  store.setPseudo('Jules');
  const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(DefiHostComponent);
  fixture.componentRef.setInput('id', id);
  return { fixture, el: fixture.nativeElement as HTMLElement, store, navigate };
}

describe('DefiHostComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => jest.useRealTimers());

  it('affiche d\'abord la consigne sans lancer le chronomètre', async () => {
    const { fixture, el } = setup();
    await settle(fixture);
    expect(el.querySelector('h1')?.textContent).toContain('Zoom et perte de contexte');
    expect(el.textContent).toContain('Situation du défi 1');
    expect(el.textContent).toContain('2 minutes');
    expect(el.textContent).not.toContain('Abandon possible');
    expect(el.querySelector('ag-hud')).toBeNull();
  });

  it('lance le défi, valide les étapes et affiche l\'écran de fin (défi terminé)', async () => {
    const { fixture, el, store } = setup();
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    expect(el.querySelector('ag-hud')).not.toBeNull();
    expect(el.textContent).toContain('Étape 1/5');
    for (let i = 0; i < 5; i++) {
      (el.querySelector('#valider') as HTMLButtonElement).click();
      await settle(fixture);
    }
    expect(store.resultFor(1)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
    expect(el.textContent).toContain('Défi terminé');
    expect(el.textContent).toContain('Maître du zoom');
    expect(el.textContent).toContain('Vécu test');
    expect(el.querySelector('input')).not.toBeNull();
  });

  it('enregistre un abandon avec les étapes déjà faites', async () => {
    const { fixture, el, store } = setup('3');
    store.recordResult({ defiId: 1, outcome: 'expire', stepsDone: 0, points: 0 });
    store.unlock(1);
    store.recordResult({ defiId: 2, outcome: 'expire', stepsDone: 0, points: 0 });
    store.unlock(2);
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    (el.querySelector('#valider') as HTMLButtonElement).click();
    await settle(fixture);
    button(el, 'Abandonner').click();
    await settle(fixture);
    expect(store.resultFor(3)).toMatchObject({ outcome: 'abandonne', stepsDone: 1 });
    expect(el.textContent).toContain('Défi abandonné');
  });

  it('expire au bout de 2 minutes', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    const { fixture, el, store } = setup();
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    jest.advanceTimersByTime(121_000);
    await settle(fixture);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'expire', stepsDone: 0 });
    expect(el.textContent).toContain('Temps écoulé');
  });

  it('refuse un mauvais code puis passe au défi suivant avec le bon (mode animé)', async () => {
    const { fixture, el, store, navigate } = setup();
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    button(el, 'Abandonner').click();
    await settle(fixture);
    const input = el.querySelector('input') as HTMLInputElement;
    input.value = '0000';
    input.dispatchEvent(new Event('input'));
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(fixture);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Code incorrect');
    expect(navigate).not.toHaveBeenCalled();
    input.value = ` ${UNLOCK_CODES[1].split('').join(' ')} `;
    input.dispatchEvent(new Event('input'));
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(fixture);
    expect(store.isUnlocked(1)).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/defi', 2]);
  });

  it('propose un bouton « Continuer » en mode autonome, sans code', async () => {
    const { fixture, el, store, navigate } = setup();
    store.mode.set('autonome');
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    button(el, 'Abandonner').click();
    await settle(fixture);
    expect(el.querySelector('input')).toBeNull();
    button(el, 'Continuer').click();
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith(['/defi', 2]);
  });

  it('envoie vers le résultat après le défi 5', async () => {
    const { fixture, el, store, navigate } = setup('5');
    store.mode.set('autonome');
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    button(el, 'Abandonner').click();
    await settle(fixture);
    button(el, 'Continuer').click();
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith(['/resultat']);
  });

  it('retombe sur l\'écran de fin pour un défi déjà joué (retour arrière) sans rejouer', async () => {
    const { fixture, el, store } = setup();
    store.recordResult({ defiId: 1, outcome: 'expire', stepsDone: 2, points: 20 });
    await settle(fixture);
    expect(el.textContent).toContain('Temps écoulé');
    expect(el.querySelector('ag-consigne')).toBeNull();
    expect(store.results()).toHaveLength(1);
    expect(store.totalPoints()).toBe(20);
  });

  it('compte comme abandonné un défi quitté en cours de route (changement de défi)', async () => {
    const { fixture, el, store } = setup('3');
    store.recordResult({ defiId: 1, outcome: 'expire', stepsDone: 0, points: 0 });
    store.unlock(1);
    store.recordResult({ defiId: 2, outcome: 'expire', stepsDone: 0, points: 0 });
    store.unlock(2);
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    (el.querySelector('#valider') as HTMLButtonElement).click();
    await settle(fixture);
    fixture.componentRef.setInput('id', '2');
    await settle(fixture);
    expect(store.resultFor(3)).toMatchObject({ outcome: 'abandonne', stepsDone: 1 });
    expect(el.textContent).toContain('Temps écoulé');
  });

  it('compte comme abandonné un défi dont l\'écran est détruit en cours de jeu', async () => {
    const { fixture, el, store } = setup('1');
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    (el.querySelector('#valider') as HTMLButtonElement).click();
    await settle(fixture);
    fixture.destroy();
    expect(store.resultFor(1)).toMatchObject({ outcome: 'abandonne', stepsDone: 1 });
  });

  it('ne rejoue pas un défi interrompu par un rechargement de la page', async () => {
    const { fixture, el, store } = setup('1');
    store.markStarted(1);
    await settle(fixture);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'abandonne', stepsDone: 0 });
    expect(el.textContent).toContain('Défi abandonné');
    expect(el.querySelector('ag-consigne')).toBeNull();
  });

  it('affiche le bloc supplémentaire de consigne du défi, seulement sur la consigne', async () => {
    const defs: DefiDefinition[] = definitions.map((d) =>
      d.id === 1 ? { ...d, consigneExtra: () => Promise.resolve(TestConsigneExtraComponent) } : d,
    );
    const { fixture, el } = setup('1', defs);
    await settle(fixture);
    expect(el.querySelector('#extra-consigne')).not.toBeNull();
    button(el, 'Démarrer').click();
    await settle(fixture);
    expect(el.querySelector('#extra-consigne')).toBeNull();
  });

  it('n\'affiche aucun bloc supplémentaire quand le défi n\'en fournit pas', async () => {
    const { fixture, el } = setup();
    await settle(fixture);
    expect(el.querySelector('#extra-consigne')).toBeNull();
    expect(el.querySelector('.consigne__extra')).toBeNull();
  });

  it('compte les points cachés dans le résultat sans les montrer dans le HUD (défi terminé)', async () => {
    const { fixture, el, store } = setup('1', hiddenDefinitions);
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    (el.querySelector('#valider') as HTMLButtonElement).click();
    await settle(fixture);
    expect(el.querySelector('ag-hud')?.textContent).toContain('★ 0 pts');
    for (let i = 0; i < 4; i++) {
      (el.querySelector('#valider') as HTMLButtonElement).click();
      await settle(fixture);
    }
    expect(store.resultFor(1)).toMatchObject({ outcome: 'termine', stepsDone: 5, points: 50 });
  });

  it('compte les points cachés quand le temps est écoulé avant la fin', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    const { fixture, el, store } = setup('1', hiddenDefinitions);
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    for (let i = 0; i < 3; i++) {
      (el.querySelector('#valider') as HTMLButtonElement).click();
      await settle(fixture);
    }
    jest.advanceTimersByTime(121_000);
    await settle(fixture);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'expire', stepsDone: 3, points: 30 });
  });

  it('compte les points cachés quand le défi est abandonné', async () => {
    const { fixture, el, store } = setup('1', hiddenDefinitions);
    await settle(fixture);
    button(el, 'Démarrer').click();
    await settle(fixture);
    for (let i = 0; i < 2; i++) {
      (el.querySelector('#valider') as HTMLButtonElement).click();
      await settle(fixture);
    }
    button(el, 'Abandonner').click();
    await settle(fixture);
    expect(store.resultFor(1)).toMatchObject({ outcome: 'abandonne', stepsDone: 2, points: 20 });
  });

  it('progression en cours : « réussie » pour le défi 1, « traitée » pour le défi à points (4)', async () => {
    const one = setup('1');
    await settle(one.fixture);
    button(one.el, 'Démarrer').click();
    await settle(one.fixture);
    button(one.el, 'Valider').click();
    await settle(one.fixture);
    expect(one.el.querySelector('ag-hud ag-step-pills li')?.getAttribute('aria-label')).toBe('Étape 1 sur 5 : réussie');

    const four = setup('4', hiddenDefinitions);
    four.store.unlock(4);
    await settle(four.fixture);
    button(four.el, 'Démarrer').click();
    await settle(four.fixture);
    button(four.el, 'Valider').click();
    await settle(four.fixture);
    expect(four.el.querySelector('ag-hud ag-step-pills li')?.getAttribute('aria-label')).toBe('Étape 1 sur 5 : traitée');
  });
});

import { TestBed } from '@angular/core/testing';
import { DefiSession } from '@ag/state';
import { EXPECTED_MOTIF, ORDER_NUMBER, PROMO_CODE } from './zoom-content';
import { ZoomPlayerComponent } from './zoom-player.component';

function setup(stepsTotal = 5) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [DefiSession] });
  const session = TestBed.inject(DefiSession);
  session.configure(stepsTotal);
  const fixture = TestBed.createComponent(ZoomPlayerComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const settle = () => {
    for (let i = 0; i < 8; i++) {
      fixture.detectChanges();
    }
  };
  const q = <T extends HTMLElement>(selector: string) => el.querySelector(selector) as T;
  return {
    el,
    session,
    q,
    expand: () => {
      q<HTMLButtonElement>('button.num').click();
      settle();
    },
    type: (selector: string, value: string) => {
      const input = q<HTMLInputElement>(selector);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      settle();
    },
    choose: (value: string) => {
      const select = q<HTMLSelectElement>('#zoom-motif');
      select.value = value;
      select.dispatchEvent(new Event('change'));
      settle();
    },
    validate: () => {
      q<HTMLButtonElement>('button.valider').click();
      settle();
    },
  };
}

describe('ZoomPlayerComponent', () => {
  it('démarre sans aucune étape validée', () => {
    const { session } = setup();
    expect(session.stepsDone()).toBe(0);
  });

  it('affiche la page de réclamation avec le numéro, le code promo et les champs', () => {
    const { el, q } = setup();
    expect(el.textContent).toContain(ORDER_NUMBER);
    expect(q('.promo').textContent).toContain(PROMO_CODE);
    expect(q('#zoom-ref')).not.toBeNull();
    expect(q('#zoom-motif')).not.toBeNull();
    expect(q('#zoom-promo')).not.toBeNull();
    expect(q('button.valider').textContent).toContain('Valider la commande');
  });

  it('valide l\'étape 1 quand on déplie le numéro de commande', () => {
    const { session, expand, q } = setup();
    expand();
    expect(session.stepsDone()).toBe(1);
    expect(q('button.num').getAttribute('aria-expanded')).toBe('true');
  });

  it('valide l\'étape 1 quand la bonne référence est saisie, même sans avoir cliqué sur le numéro', () => {
    const { session, type } = setup();
    type('#zoom-ref', ORDER_NUMBER);
    expect(session.stepsDone()).toBe(2);
  });

  it('suit le nombre d\'étapes configuré : à 4 étapes, l\'étape du code promo disparaît', () => {
    const { session, expand, type, choose, validate } = setup(4);
    expand();
    type('#zoom-ref', ORDER_NUMBER);
    choose(EXPECTED_MOTIF);
    expect(session.stepsDone()).toBe(3);
    validate();
    expect(session.stepsDone()).toBe(4);
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(40);
  });

  it('à 4 étapes, ignore un clic sur « Valider » à 2 étapes et le garde en mémoire seulement à 3', () => {
    const { session, expand, type, choose, validate } = setup(4);
    expand();
    type('#zoom-ref', ORDER_NUMBER);
    expect(session.stepsDone()).toBe(2);
    validate();
    expect(session.stepsDone()).toBe(2);
    choose(EXPECTED_MOTIF);
    expect(session.stepsDone()).toBe(3);
    validate();
    expect(session.stepsDone()).toBe(4);
  });

  it('joue le parcours complet dans l\'ordre et rapporte 50 points', () => {
    const { session, expand, type, choose, validate } = setup();
    expand();
    type('#zoom-ref', ORDER_NUMBER);
    expect(session.stepsDone()).toBe(2);
    choose(EXPECTED_MOTIF);
    expect(session.stepsDone()).toBe(3);
    type('#zoom-promo', PROMO_CODE);
    expect(session.stepsDone()).toBe(4);
    validate();
    expect(session.stepsDone()).toBe(5);
    expect(session.allDone()).toBe(true);
    expect(session.points()).toBe(50);
  });

  it('accepte des saisies avec casse, espaces et tiret différents', () => {
    const { session, expand, type, choose, validate } = setup();
    expand();
    type('#zoom-ref', ' cmd48127 ');
    choose(EXPECTED_MOTIF);
    type('#zoom-promo', 'promo25 ');
    validate();
    expect(session.allDone()).toBe(true);
  });

  it('n\'avance pas avec une mauvaise valeur ou un mauvais motif', () => {
    const { session, expand, type, choose } = setup();
    expand();
    type('#zoom-ref', 'CMD-48');
    expect(session.stepsDone()).toBe(1);
    choose('Produit endommagé');
    expect(session.stepsDone()).toBe(1);
  });

  it('rattrape la progression quand la page est remplie dans le désordre', () => {
    const { session, expand, type, choose } = setup();
    type('#zoom-promo', PROMO_CODE);
    choose(EXPECTED_MOTIF);
    type('#zoom-ref', ORDER_NUMBER);
    expect(session.stepsDone()).toBe(4);
    expand();
    expect(session.stepsDone()).toBe(4);
  });

  it('ignore un clic prématuré sur « Valider la commande » et ne le garde pas en mémoire', () => {
    const { session, expand, type, choose, validate } = setup();
    expand();
    validate();
    expect(session.stepsDone()).toBe(1);
    type('#zoom-ref', ORDER_NUMBER);
    choose(EXPECTED_MOTIF);
    type('#zoom-promo', PROMO_CODE);
    expect(session.stepsDone()).toBe(4);
    validate();
    expect(session.stepsDone()).toBe(5);
  });

  it('ne dépasse jamais 5 étapes même si on clique encore', () => {
    const { session, expand, type, choose, validate } = setup();
    expand();
    type('#zoom-ref', ORDER_NUMBER);
    choose(EXPECTED_MOTIF);
    type('#zoom-promo', PROMO_CODE);
    validate();
    validate();
    expect(session.stepsDone()).toBe(5);
    expect(session.points()).toBe(50);
  });

  it('affiche un bandeau cookies qui disparaît à l\'acceptation sans changer la progression', () => {
    const { session, q } = setup();
    expect(q('.cookies')).not.toBeNull();
    q<HTMLButtonElement>('button.cookies__ok').click();
    TestBed.tick();
    expect(q('.cookies')).toBeNull();
    expect(session.stepsDone()).toBe(0);
  });

  it('reste utilisable au clavier : région focusable et champs libellés', () => {
    const { el, q } = setup();
    const region = q('section.viewport');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toContain('400 %');
    expect(region.getAttribute('tabindex')).toBe('0');
    for (const id of ['zoom-ref', 'zoom-motif', 'zoom-promo']) {
      expect(el.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });

  it('répartit les champs et les informations dans des blocs distincts de la page', () => {
    const { q } = setup();
    const blocs = ['#zoom-ref', '#zoom-motif', '#zoom-promo'].map((sel) => q(sel).closest('.bloc'));
    expect(blocs.every((b) => b !== null)).toBe(true);
    expect(new Set(blocs).size).toBe(3);
    // le code affiché et son champ de saisie, le numéro de commande et la référence : jamais dans le même bloc
    expect(q('.promo').closest('.bloc')).not.toBe(blocs[2]);
    expect(q('button.num').closest('.bloc')).not.toBe(blocs[0]);
    expect(q('button.valider').closest('.bloc')).not.toBe(blocs[2]);
  });

  it('ajoute des blocs de texte sans champ pour rendre la page crédible', () => {
    const { el } = setup();
    expect(el.querySelectorAll('.bloc--texte').length).toBeGreaterThanOrEqual(3);
    for (const bloc of Array.from(el.querySelectorAll('.bloc--texte'))) {
      expect(bloc.querySelector('input, select, button')).toBeNull();
    }
  });
});

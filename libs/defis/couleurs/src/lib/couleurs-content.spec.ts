import {
  ChoiceStepDef,
  DEUTERANOPIE_MATRIX,
  IDEAL_ORDER_TEXT,
  RANK_STEP,
  RankStepDef,
  STATUS_COLOR,
  STEPS,
  STEP_CONTEXTS,
} from './couleurs-content';

const choice = (i: number) => STEPS[i] as ChoiceStepDef;
const rank = () => STEPS[RANK_STEP] as RankStepDef;

describe('matrice de daltonisme', () => {
  it('reprend la matrice de la spec (deutéranopie) en 20 valeurs', () => {
    const values = DEUTERANOPIE_MATRIX.trim().split(/\s+/).map(Number);
    expect(values).toHaveLength(20);
    expect(values.slice(0, 3)).toEqual([0.625, 0.375, 0]);
    expect(values.slice(5, 8)).toEqual([0.7, 0.3, 0]);
    expect(values.slice(10, 13)).toEqual([0, 0.3, 0.7]);
    expect(values.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});

describe('STEPS', () => {
  it('définit les 5 étapes dans l\'ordre : 4 choix et un classement à l\'étape 4', () => {
    expect(STEPS.map((s) => s.kind)).toEqual(['choice', 'choice', 'choice', 'rank', 'choice']);
    expect(RANK_STEP).toBe(3);
  });

  it('donne à chaque étape un message de partie prenante', () => {
    expect(STEPS.map((s) => s.message.from)).toEqual([
      'PMO',
      'Direction financière',
      'Responsable planning',
      'Direction',
      'Comité de pilotage',
    ]);
    for (const s of STEPS) {
      expect(s.message.text.trim().length).toBeGreaterThan(0);
    }
    expect(STEPS[0].message.text).toBe('Un projet est en retard, on le présente au comité dans 2 minutes.');
  });

  it('étape 1 : 8 projets, un seul en retard (Delta), légende par couleur', () => {
    const s = choice(0);
    expect(s.items).toHaveLength(8);
    expect(s.items.every((i) => i.kind === 'projet')).toBe(true);
    expect(s.items.filter((i) => i.status === 'rouge').map((i) => i.id)).toEqual(['delta']);
    expect(s.correctId).toBe('delta');
    expect(s.items.some((i) => i.status === 'vert')).toBe(true);
    expect(s.items.some((i) => i.status === 'orange')).toBe(true);
    expect(s.legend.map((l) => l.label)).toEqual(['dans les temps', 'à surveiller', 'en retard']);
    expect(s.legend.map((l) => l.color)).toEqual([STATUS_COLOR.vert, STATUS_COLOR.orange, STATUS_COLOR.rouge]);
  });

  it('étape 1 : le nom accessible dit le statut que la couleur porte seule', () => {
    const delta = choice(0).items.find((i) => i.id === 'delta');
    expect(delta?.ariaLabel).toBe('Delta, en retard');
  });

  it('étape 2 : 5 barres aux teintes distinctes, « dépassement » est la bonne, légende nominative', () => {
    const s = choice(1);
    expect(s.items.map((i) => i.name)).toEqual(['prévu', 'provisionné', 'dépassement', 'engagé', 'reporté']);
    expect(s.items.every((i) => i.kind === 'barre' && typeof i.height === 'number')).toBe(true);
    expect(new Set(s.items.map((i) => i.color)).size).toBe(5);
    expect(s.correctId).toBe('depassement');
    expect(s.legend.map((l) => l.label)).toEqual(s.items.map((i) => i.name));
    expect(s.legend.map((l) => l.color)).toEqual(s.items.map((i) => i.color));
  });

  it('étape 3 : 5 champs tous encadrés, un seul en erreur (bordure rouge), valeurs toutes plausibles', () => {
    const s = choice(2);
    expect(s.items).toHaveLength(5);
    expect(s.items.every((i) => i.kind === 'champ' && Boolean(i.value))).toBe(true);
    expect(s.items.filter((i) => i.color === STATUS_COLOR.rouge).map((i) => i.id)).toEqual([s.correctId]);
    expect(s.items.filter((i) => i.color === STATUS_COLOR.vert)).toHaveLength(4);
    expect(s.items.find((i) => i.id === s.correctId)?.ariaLabel).toContain('en erreur');
    expect(s.legend.map((l) => l.label)).toEqual(['bordure verte : valide', 'bordure rouge : erreur']);
  });

  it('étape 4 : 5 projets classés du plus au moins critique, ordre idéal Gamma → Zêta', () => {
    const s = rank();
    expect(s.items.map((i) => i.id)).toEqual(['gamma', 'omega', 'lambda', 'theta', 'zeta']);
    expect(s.idealOrder).toEqual(['gamma', 'omega', 'lambda', 'theta', 'zeta']);
    expect(new Set(s.items.map((i) => i.color)).size).toBe(5);
    expect(s.legend.map((l) => l.label)).toEqual([
      'criticité maximale',
      'criticité forte',
      'criticité moyenne',
      'criticité faible',
      'criticité nulle',
    ]);
    expect(s.items[0].ariaLabel).toBe('Gamma, criticité maximale');
    expect(IDEAL_ORDER_TEXT).toBe('Gamma › Omega › Lambda › Thêta › Zêta');
  });

  it('étape 5 : 4 boutons de couleur dont un vert olive, « vert » est le bon, sans légende', () => {
    const s = choice(4);
    expect(s.items.map((i) => i.id)).toEqual(['vert', 'rouge', 'olive', 'orange']);
    expect(s.items.every((i) => i.kind === 'bouton')).toBe(true);
    expect(s.correctId).toBe('vert');
    expect(s.items.find((i) => i.id === 'olive')?.name).toBe('vert olive');
    expect(s.items[0].ariaLabel).toBe('Bouton vert');
    expect(s.legend).toEqual([]);
  });

  it('chaque choix a une bonne réponse existante et des identifiants uniques', () => {
    for (const s of STEPS) {
      const ids = s.items.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
      if (s.kind === 'choice') {
        expect(ids).toContain(s.correctId);
      }
    }
  });

  it('donne un contexte à chaque étape', () => {
    expect(STEP_CONTEXTS).toHaveLength(5);
    expect(STEP_CONTEXTS[0]).toBe('① PMO · Projet en retard');
  });
});

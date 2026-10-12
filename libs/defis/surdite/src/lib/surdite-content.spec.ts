import { AUDIO_DIR, CLIPS, MAX_LISTENS, STEPS, STEP_CONTEXTS, TEST_CLIP } from './surdite-content';

describe('surdite-content', () => {
  it('limite à 3 écoutes par étape', () => {
    expect(MAX_LISTENS).toBe(3);
  });

  it('définit 5 extraits distincts rangés dans le dossier audio du défi, plus l\'échantillon de test', () => {
    expect(CLIPS).toHaveLength(5);
    expect(new Set(CLIPS.map((c) => c.url)).size).toBe(5);
    for (const clip of [...CLIPS, TEST_CLIP]) {
      expect(clip.url.startsWith(`${AUDIO_DIR}/`)).toBe(true);
      expect(clip.transcript.trim().length).toBeGreaterThan(0);
    }
    expect(TEST_CLIP.url).toBe('audio/defi5/test-echantillon.wav');
  });

  it('transcrit chaque message avec l\'information à retenir', () => {
    expect(CLIPS[0].transcript).toContain('Madame Dumont');
    expect(CLIPS[1].transcript).toContain('quatre-huit-un-deux');
    expect(CLIPS[2].transcript).toContain('mardi à quatorze heures');
    expect(CLIPS[3].transcript).toContain('sirène');
    expect(CLIPS[4].transcript).toContain('bouton de droite');
    expect(CLIPS[4].transcript).toContain('celui de gauche');
  });

  it('a 5 étapes qui utilisent les 5 extraits dans l\'ordre', () => {
    expect(STEPS).toHaveLength(5);
    expect(STEPS.map((s) => s.clip)).toEqual([...CLIPS]);
    expect(STEP_CONTEXTS).toEqual([
      '① Nom du client',
      '② Numéro de dossier',
      '③ Jour du rappel',
      '④ Type d\'alerte',
      '⑤ Confirmation',
    ]);
  });

  it('étape 1 : 4 noms qui se ressemblent, « Madame Dumont » est le bon', () => {
    const s = STEPS[0];
    expect(s.options.map((o) => o.label)).toEqual(['Madame Dumont', 'Madame Dupont', 'Madame Dumoulin', 'Madame Dumas']);
    expect(s.correctId).toBe('nom-dumont');
    expect(s.shuffle).toBe(true);
  });

  it('étape 2 : 4 numéros de dossier, 4812 est le bon', () => {
    const s = STEPS[1];
    expect(s.options.map((o) => o.label)).toEqual(['4812', '4832', '4912', '4813']);
    expect(s.correctId).toBe('dossier-4812');
  });

  it('étape 3 : 4 créneaux, mardi à 14 h est le bon', () => {
    const s = STEPS[2];
    expect(s.options.map((o) => o.label)).toEqual(['mardi à 14 h', 'jeudi à 14 h', 'mardi à 16 h', 'vendredi à 14 h']);
    expect(s.correctId).toBe('jour-mardi-14');
  });

  it('étape 4 : 3 types d\'alerte, l\'urgence (sirène) est la bonne', () => {
    const s = STEPS[3];
    expect(s.options.map((o) => o.label)).toEqual(['Information · ding', 'Avertissement · double bip', 'Urgence · sirène']);
    expect(s.correctId).toBe('alerte-urgence');
  });

  it('étape 5 : deux boutons sans texte, gauche puis droite (position fixe), « droite » confirme', () => {
    const s = STEPS[4];
    expect(s.shuffle).toBe(false);
    expect(s.options.map((o) => o.id)).toEqual(['bouton-gauche', 'bouton-droite']);
    expect(s.options.every((o) => o.label === '')).toBe(true);
    expect(s.options.map((o) => o.ariaLabel)).toEqual(['Bouton de gauche', 'Bouton de droite']);
    expect(s.correctId).toBe('bouton-droite');
  });

  it('identifiants d\'options uniques dans tout le défi (un clic sur l\'ancienne étape ne peut pas viser la suivante)', () => {
    const ids = STEPS.flatMap((s) => s.options.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque bonne réponse existe ; chaque mauvaise option a sa phrase de compte rendu, la bonne n\'en a pas', () => {
    for (const s of STEPS) {
      expect(s.options.map((o) => o.id)).toContain(s.correctId);
      for (const o of s.options) {
        expect(Boolean(o.failure)).toBe(o.id !== s.correctId);
      }
    }
  });

  it('pose une question par étape', () => {
    expect(STEPS.map((s) => s.question)).toEqual([
      'Quel est le nom du client ?',
      'Quel est son numéro de dossier ?',
      'Quand faut-il le rappeler ?',
      'Quel type d\'alerte avez-vous entendu ?',
      'Quel bouton faut-il presser pour confirmer ?',
    ]);
  });
});

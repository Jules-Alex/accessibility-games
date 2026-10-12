import { MISSING_SENTENCES, conclusionFor, decide, missingSentence } from './surdite-decisions';
import { STEPS } from './surdite-content';

describe('decide', () => {
  it('phrases de réussite de la spec', () => {
    const ok = [
      ['nom-dumont', 'Vous reconnaissez Madame Dumont malgré le souffle : elle se sent déjà écoutée.'],
      ['dossier-4812', 'Vous retrouvez le dossier 4812 du premier coup. La messagerie vocale n\'a jamais été aussi fière.'],
      ['jour-mardi-14', 'Vous planifiez le rappel mardi à 14 h : ponctualité exemplaire, même avec un casque qui grésille.'],
      ['alerte-urgence', 'Vous identifiez la bonne alerte : votre oreille a visiblement un meilleur radar que le reste du bureau.'],
      ['bouton-droite', 'Vous appuyez du bon côté : l\'assistant vocal vous remercie d\'une voix si claire que vous n\'y croyez plus.'],
    ];
    ok.forEach(([id, sentence], step) => {
      const d = decide(step, id);
      expect(d.result).toBe('reussi');
      expect(d.sentence).toBe(sentence);
    });
  });

  it('phrases de raté de la spec', () => {
    expect(decide(0, 'nom-dupont').sentence).toBe(
      'Vous rappelez Madame Dupont, qui s\'étonne de recevoir un appel pour un message qu\'elle n\'a jamais laissé.',
    );
    expect(decide(1, 'dossier-4832').sentence).toBe(
      'Vous ouvrez le dossier 4832, dont le propriétaire est ravi d\'apprendre que son dossier avance enfin.',
    );
    expect(decide(2, 'jour-jeudi-14').sentence).toBe(
      'Vous rappelez jeudi, alors que le client attendait mardi : il a eu le temps de consulter trois concurrents.',
    );
    expect(decide(3, 'alerte-information').sentence).toBe(
      'L\'alerte urgente passe pour une simple notification et attend patiemment dans un coin.',
    );
    expect(decide(4, 'bouton-gauche').sentence).toBe(
      'Vous appuyez à gauche : l\'assistant annule tout avec le sourire. Lui, au moins, était clair.',
    );
    for (const [step, id] of [[0, 'nom-dupont'], [1, 'dossier-4832'], [2, 'jour-jeudi-14'], [3, 'alerte-information'], [4, 'bouton-gauche']] as const) {
      expect(decide(step, id).result).toBe('rate');
    }
  });

  it('phrases de raté ajoutées par le plan pour les options que la spec ne cite pas', () => {
    expect(decide(0, 'nom-dumoulin').sentence).toBe(
      'Vous rappelez Madame Dumoulin, qui s\'étonne de recevoir un appel pour un message qu\'elle n\'a jamais laissé.',
    );
    expect(decide(0, 'nom-dumas').sentence).toContain('Madame Dumas');
    expect(decide(1, 'dossier-4912').sentence).toContain('le dossier 4912');
    expect(decide(1, 'dossier-4813').sentence).toContain('le dossier 4813');
    expect(decide(2, 'jour-vendredi-14').sentence).toBe(
      'Vous rappelez vendredi, alors que le client attendait mardi : il a eu le temps de consulter trois concurrents.',
    );
    expect(decide(2, 'jour-mardi-16').sentence).toBe(
      'Vous rappelez mardi à 16 h, deux heures après l\'heure prévue : le client a eu le temps de consulter trois concurrents.',
    );
    expect(decide(3, 'alerte-avertissement').sentence).toBe(
      'L\'alerte urgente passe pour un simple avertissement et attend patiemment dans un coin.',
    );
  });

  it('texte du choix pour la carte de l\'écran de fin', () => {
    expect(decide(0, 'nom-dupont').choice).toBe('Vous avez rappelé Madame Dupont');
    expect(decide(1, 'dossier-4832').choice).toBe('Vous avez noté le dossier 4832');
    expect(decide(2, 'jour-jeudi-14').choice).toBe('Vous avez planifié le rappel jeudi à 14 h');
    expect(decide(3, 'alerte-information').choice).toBe('Vous avez classé l\'alerte comme « information »');
    expect(decide(4, 'bouton-gauche').choice).toBe('Vous avez appuyé sur le bouton de gauche');
  });

  it('toute mauvaise option produit une décision ratée avec sa phrase', () => {
    STEPS.forEach((s, step) => {
      for (const o of s.options.filter((x) => x.id !== s.correctId)) {
        const d = decide(step, o.id);
        expect(d.result).toBe('rate');
        expect(d.sentence).toBe(o.failure);
      }
    });
  });

  it('refuse une étape ou une option inconnue', () => {
    expect(() => decide(9, 'nom-dumont')).toThrow();
    expect(() => decide(0, 'inconnu')).toThrow();
    expect(() => decide(0, 'dossier-4812')).toThrow();
  });
});

describe('phrases « temps écoulé »', () => {
  it('une phrase par étape, aussi pour l\'abandon', () => {
    expect(MISSING_SENTENCES).toEqual([
      'Le nom du client reste un mystère : la messagerie vocale garde son secret, et lui garde sa patience, pour l\'instant.',
      'Le numéro de dossier se perd quelque part entre le souffle et la coupure. Le dossier, lui, ne s\'en est pas aperçu.',
      'Le jour du rappel n\'est pas fixé : le client attend un appel sans date, ce qui est la forme la plus pure du suspense.',
      'L\'alerte sonne dans le vide : personne n\'a dit s\'il s\'agissait d\'une information, d\'un avertissement ou d\'une urgence. Elle a décidé de sonner pour tout le monde.',
      'La confirmation n\'a pas été donnée : l\'assistant vocal attend toujours, un doigt sur chaque bouton, sans oser choisir.',
    ]);
    expect(missingSentence(2)).toBe(MISSING_SENTENCES[2]);
    expect(missingSentence(9)).toBe('');
  });
});

describe('conclusionFor', () => {
  it('5 sur 5 : 🟢 client conquis', () => {
    const c = conclusionFor(5, 5);
    expect(c.icon).toBe('🟢');
    expect(c.title).toBe('Client conquis');
    expect(c.text).toBe('Il vous trouve très à l\'écoute — ce qui, vu les circonstances, tient du miracle.');
  });

  it('3 à 4 : 🟡', () => {
    for (const score of [3, 4]) {
      expect(conclusionFor(score, 5).icon).toBe('🟡');
    }
    expect(conclusionFor(3, 5).title).toBe('Client rappelé, avec quelques malentendus');
    expect(conclusionFor(3, 5).text).toBe('Il vous trouve charmant, mais vous suggère de lui écrire un mail la prochaine fois.');
  });

  it('1 à 2 : 🟠', () => {
    for (const score of [1, 2]) {
      expect(conclusionFor(score, 5).icon).toBe('🟠');
    }
    expect(conclusionFor(1, 5).title).toBe('Client perplexe');
    expect(conclusionFor(1, 5).text).toBe('Il vous demande d\'envoyer un message écrit la prochaine fois, avec de vraies lettres.');
  });

  it('0 : 🔴', () => {
    const c = conclusionFor(0, 5);
    expect(c.icon).toBe('🔴');
    expect(c.title).toBe('Client perdu');
    expect(c.text).toBe('Il vous rappelle lui-même et propose de communiquer par pigeon voyageur.');
  });

  it('s\'adapte à un nombre d\'étapes réduit (proportions)', () => {
    expect(conclusionFor(3, 3).icon).toBe('🟢');
    expect(conclusionFor(2, 3).icon).toBe('🟡');
    expect(conclusionFor(1, 3).icon).toBe('🟠');
    expect(conclusionFor(0, 3).icon).toBe('🔴');
  });

  it('défi interrompu sans aucune réponse : 🔴 client en attente', () => {
    const c = conclusionFor(0, 5, 0);
    expect(c.icon).toBe('🔴');
    expect(c.title).toBe('Client en attente');
    expect(c.text).toBe(
      'Le message vocal reste sur le répondeur : le client attend toujours qu\'on l\'écoute. Il a commencé à laisser un deuxième message pour demander si le premier avait été reçu.',
    );
  });

  it('au plus la moitié des réponses données : appel interrompu, icône selon le score sur le total', () => {
    const c = conclusionFor(1, 5, 2);
    expect(c.icon).toBe('🟠');
    expect(c.title).toBe('Appel interrompu');
    expect(c.text).toBe(
      'Le client a obtenu 2 réponses sur 5, puis la ligne s\'est coupée. Il envisage de renvoyer un message, plus lentement, avec de vraies lettres.',
    );
    expect(conclusionFor(1, 5, 1).text).toContain('Le client a obtenu 1 réponse sur 5');
    expect(conclusionFor(0, 5, 1).icon).toBe('🔴');
  });

  it('plus de la moitié des réponses données : appel coupé juste avant la fin', () => {
    const c = conclusionFor(3, 5, 3);
    expect(c.icon).toBe('🟡');
    expect(c.title).toBe('Appel coupé juste avant la fin');
    expect(c.text).toBe(
      'Le client a presque tout obtenu (3 réponses sur 5) quand la communication a été coupée. Il rappellera, ou il écrira : au choix de la messagerie.',
    );
    expect(conclusionFor(1, 5, 4).icon).toBe('🟠');
    expect(conclusionFor(0, 5, 4).icon).toBe('🔴');
  });

  it('toutes les réponses données : jamais de mention d\'interruption', () => {
    expect(conclusionFor(0, 5, 5).title).toBe('Client perdu');
  });
});

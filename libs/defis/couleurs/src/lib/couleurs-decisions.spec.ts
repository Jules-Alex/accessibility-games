import {
  conclusionFor,
  decideChoice,
  decideRank,
  MISSING_SENTENCES,
  missingSentence,
  wellPlaced,
} from './couleurs-decisions';

describe('decideChoice', () => {
  it('étape 1 : le bon projet est réussi', () => {
    const d = decideChoice(0, 'delta');
    expect(d.result).toBe('reussi');
    expect(d.choice).toBe('Vous avez ouvert Delta');
    expect(d.sentence).toBe('Vous ouvrez Delta du premier coup : le PMO vous regarde comme si vous aviez lu dans ses pensées.');
  });

  it('étape 1 : un projet vert raté nomme le projet qui allait bien', () => {
    const d = decideChoice(0, 'alpha');
    expect(d.result).toBe('rate');
    expect(d.sentence).toBe('Vous ouvrez Alpha, qui allait très bien. Vous voilà au moins parfaitement renseigné sur un projet qui n\'avait aucun problème.');
  });

  it('étape 1 : un projet orange raté est décrit comme « à surveiller »', () => {
    const d = decideChoice(0, 'beta');
    expect(d.result).toBe('rate');
    expect(d.sentence).toBe('Vous ouvrez Beta, qui n\'était qu\'à surveiller. Vous le surveillez désormais avec un soin admirable, loin du vrai problème.');
  });

  it('étape 2 : la bonne barre est réussie, une autre nomme la barre choisie', () => {
    expect(decideChoice(1, 'depassement').result).toBe('reussi');
    expect(decideChoice(1, 'depassement').sentence).toBe(
      'Vous désignez la bonne barre. La finance est impressionnée et note votre nom, au cas où.',
    );
    const ko = decideChoice(1, 'reporte');
    expect(ko.result).toBe('rate');
    expect(ko.choice).toBe('Vous avez cliqué la barre « reporté »');
    expect(ko.sentence).toBe(
      'Vous désignez « reporté » avec une assurance que personne n\'a eu le cœur de démentir. Vous avez eu le mérite de tenir la barre jusqu\'au bout.',
    );
  });

  it('étape 3 : le bon champ est réussi, un autre champ est raté', () => {
    const okId = 'budget';
    expect(decideChoice(2, okId).result).toBe('reussi');
    expect(decideChoice(2, okId).sentence).toBe(
      'Vous corrigez le bon champ sans trembler, et le planning vous adresse un hochement de tête respectueux en se promettant de vous inviter aux prochains comités.',
    );
    const ko = decideChoice(2, 'debut');
    expect(ko.result).toBe('rate');
    expect(ko.choice).toBe('Vous avez corrigé le champ « Date de début »');
    expect(ko.sentence).toBe(
      'Vous corrigez le champ « Date de début », qui n\'avait rien demandé. Il est désormais impeccable, et l\'erreur, elle, vous remercie de votre discrétion.',
    );
  });

  it('étape 5 : le bouton vert est réussi, le vert olive est raté', () => {
    expect(decideChoice(4, 'vert').result).toBe('reussi');
    expect(decideChoice(4, 'vert').sentence).toBe(
      'Vous cliquez sur le bon bouton vert : preuve que la chance existe, ou que vous avez un don pour les feux tricolores.',
    );
    const ko = decideChoice(4, 'olive');
    expect(ko.result).toBe('rate');
    expect(ko.choice).toBe('Vous avez cliqué le bouton vert olive');
    expect(ko.sentence).toBe(
      'Vous cliquez sur le bouton vert olive avec la fermeté de quelqu\'un qui n\'a aucun doute. Le plan, lui, en a désormais beaucoup.',
    );
  });

  it('refuse une étape qui n\'est pas un choix ou un élément inconnu', () => {
    expect(() => decideChoice(3, 'gamma')).toThrow();
    expect(() => decideChoice(0, 'inconnu')).toThrow();
    expect(() => decideChoice(9, 'delta')).toThrow();
  });
});

describe('wellPlaced', () => {
  const ideal = ['gamma', 'omega', 'lambda', 'theta', 'zeta'];

  it('compte les projets à la bonne place', () => {
    expect(wellPlaced(ideal, ideal)).toBe(5);
    expect(wellPlaced(['gamma', 'omega', 'lambda', 'zeta', 'theta'], ideal)).toBe(3);
    expect(wellPlaced(['zeta', 'theta', 'lambda', 'omega', 'gamma'], ideal)).toBe(1);
    expect(wellPlaced(['omega', 'lambda', 'theta', 'zeta', 'gamma'], ideal)).toBe(0);
  });
});

describe('decideRank', () => {
  it('parfait : réussi', () => {
    const d = decideRank(3, ['gamma', 'omega', 'lambda', 'theta', 'zeta']);
    expect(d.result).toBe('reussi');
    expect(d.choice).toBe('Votre ordre : Gamma › Omega › Lambda › Thêta › Zêta');
    expect(d.sentence).toBe(
      'Vos priorités sont parfaites : les projets en feu d\'abord. On vous soupçonne de lire les couleurs comme d\'autres lisent le journal.',
    );
  });

  it('2 à 4 projets bien placés : partiel, phrase d\'autodérision avec le nombre de projets bien classés', () => {
    const three = decideRank(3, ['zeta', 'omega', 'lambda', 'theta', 'gamma']);
    expect(three.result).toBe('partiel');
    expect(three.sentence).toBe(
      'Vous avez classé 3 projets au bon endroit et les autres au gré de votre inspiration. L\'inspiration, pour une fois, n\'a pas été d\'un grand secours.',
    );
    const two = decideRank(3, ['gamma', 'omega', 'theta', 'zeta', 'lambda']);
    expect(two.sentence).toContain('Vous avez classé 2 projets au bon endroit');
  });

  it('frontières : 2 bien placés = partiel, 1 et 0 = raté', () => {
    expect(decideRank(3, ['gamma', 'omega', 'theta', 'zeta', 'lambda']).result).toBe('partiel');
    expect(decideRank(3, ['zeta', 'theta', 'lambda', 'omega', 'gamma']).result).toBe('rate');
    const ko = decideRank(3, ['omega', 'lambda', 'theta', 'zeta', 'gamma']);
    expect(ko.result).toBe('rate');
    expect(ko.sentence).toBe(
      'Votre ordre : Omega › Lambda › Thêta › Zêta › Gamma. Vous avez protégé avec soin les projets qui allaient bien, pendant que les autres prenaient feu en toute autonomie.',
    );
  });

  it('refuse une étape qui n\'est pas un classement', () => {
    expect(() => decideRank(0, ['gamma'])).toThrow();
  });
});

describe('phrases « temps écoulé »', () => {
  it('une phrase par étape, dans l\'ordre', () => {
    expect(MISSING_SENTENCES).toEqual([
      'Vous n\'avez ouvert aucun projet : le retard a pu poursuivre son travail en toute tranquillité, et le temps a fait comme lui.',
      'Vous cherchez encore l\'origine du dérapage. Il vous a gentiment attendu, puis il a continué sans vous.',
      'Vous regardez cinq champs en vous demandant lequel est le coupable. Les cinq vous regardent aussi, et aucun ne dit rien.',
      'Vous classiez les projets avec soin quand le temps s\'est écoulé. Au moins, tout le monde a attendu au même rang.',
      'Vous hésitiez encore entre le vert, le vert olive et le vert « peut-être » quand le temps a approuvé à votre place : en n\'approuvant rien.',
    ]);
    MISSING_SENTENCES.forEach((sentence, step) => expect(missingSentence(step)).toBe(sentence));
  });

  it('une étape inconnue n\'a pas de phrase', () => {
    expect(missingSentence(9)).toBe('');
  });
});

describe('conclusionFor', () => {
  it('5 sur 5 : 🟢 plan adopté à l\'unanimité', () => {
    const c = conclusionFor(5, 5);
    expect(c.icon).toBe('🟢');
    expect(c.title).toBe('Plan adopté à l\'unanimité');
    expect(c.text).toBe('Le comité vous soupçonne d\'avoir triché, et envisage déjà de vous confier le budget de l\'an prochain.');
  });

  it('3 à 4 : 🟡 adopté sous réserve', () => {
    for (const score of [3, 3.5, 4]) {
      expect(conclusionFor(score, 5).icon).toBe('🟡');
    }
    expect(conclusionFor(3, 5).title).toBe('Adopté sous réserve');
    expect(conclusionFor(3, 5).text).toBe(
      'Le comité vous confie les couleurs, à condition qu\'elles s\'accompagnent d\'un mot ou d\'icônes facilement identifiables. C\'est d\'ailleurs le conseil du jour.',
    );
  });

  it('1 à 2 (et les demi-points) : 🟠 renvoyé en commission', () => {
    for (const score of [0.5, 1, 2, 2.5]) {
      expect(conclusionFor(score, 5).icon).toBe('🟠');
    }
    expect(conclusionFor(1, 5).title).toBe('Renvoyé en commission');
    expect(conclusionFor(1, 5).text).toBe(
      'Le comité vous propose d\'aller prendre l\'air, loin des tableaux de bord, et en profite pour ranger le dossier dans le tiroir rouge. Ou vert. Il ne sait plus.',
    );
  });

  it('0 : 🔴 séance suspendue', () => {
    const c = conclusionFor(0, 5);
    expect(c.icon).toBe('🔴');
    expect(c.title).toBe('Séance suspendue');
    expect(c.text).toBe(
      'Le comité fait appel à un expert en couleurs pendant que vous cherchez le bouton vert. L\'expert arrive avec deux avis, un vert et un rouge : par prudence, personne ne prend de décision.',
    );
  });

  it('s\'adapte à un nombre d\'étapes réduit (proportions)', () => {
    expect(conclusionFor(3, 3).icon).toBe('🟢');
    expect(conclusionFor(2, 3).icon).toBe('🟡');
    expect(conclusionFor(1, 3).icon).toBe('🟠');
    expect(conclusionFor(0, 3).icon).toBe('🔴');
  });

  it('séance interrompue sans aucune réponse : 🔴 séance ajournée', () => {
    const c = conclusionFor(0, 5, 0);
    expect(c.icon).toBe('🔴');
    expect(c.title).toBe('Séance ajournée');
    expect(c.text).toBe(
      'Le comité s\'installe, ouvre ses dossiers… et attend toujours votre première décision. Il en profite pour relire son ordre du jour, deux fois, puis une troisième.',
    );
  });

  it('au plus la moitié des dossiers traités : séance levée en cours de route, icône selon le score sur le total', () => {
    const one = conclusionFor(1, 5, 2);
    expect(one.icon).toBe('🟠');
    expect(one.title).toBe('Séance levée en cours de route');
    expect(one.text).toBe(
      'Le comité a traité 2 dossiers sur 5, puis s\'est aperçu que la séance s\'arrêtait là. Les autres dossiers rejoignent la pile « à voir plus tard », celle qui ne se vide jamais.',
    );
    const none = conclusionFor(0, 5, 1);
    expect(none.icon).toBe('🔴');
    expect(none.text).toContain('Le comité a traité 1 dossier sur 5');
  });

  it('plus de la moitié traitée : séance levée juste avant la fin', () => {
    const c = conclusionFor(3, 5, 3);
    expect(c.icon).toBe('🟡');
    expect(c.title).toBe('Séance levée juste avant la fin');
    expect(c.text).toBe(
      'Le comité a presque tout vu (3 dossiers traités sur 5) et s\'est arrêté à deux pas de la sortie, le stylo déjà capuchonné. Les dossiers restants attendront la prochaine séance, avec les mêmes couleurs.',
    );
    expect(conclusionFor(1, 5, 4).icon).toBe('🟠');
    expect(conclusionFor(0, 5, 4).icon).toBe('🔴');
  });

  it('toutes les réponses données : les conclusions habituelles, sans mention d\'interruption', () => {
    expect(conclusionFor(5, 5, 5).title).toBe('Plan adopté à l\'unanimité');
    expect(conclusionFor(0, 5, 5).title).toBe('Séance suspendue');
  });
});

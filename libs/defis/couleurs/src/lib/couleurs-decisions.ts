import { Conclusion, DecisionInfo, TIER_ICON, Tier, tierFor } from '@ag/domain';
import { ChoiceItem, ChoiceStepDef, RankStepDef, STEPS } from './couleurs-content';

const SUCCESS: readonly string[] = [
  'Vous ouvrez Delta du premier coup : le PMO vous regarde comme si vous aviez lu dans ses pensées.',
  'Vous désignez la bonne barre. La finance est impressionnée et note votre nom, au cas où.',
  'Vous corrigez le bon champ sans trembler, et le planning vous adresse un hochement de tête respectueux en se promettant de vous inviter aux prochains comités.',
  'Vos priorités sont parfaites : les projets en feu d\'abord. On vous soupçonne de lire les couleurs comme d\'autres lisent le journal.',
  'Vous cliquez sur le bon bouton vert : preuve que la chance existe, ou que vous avez un don pour les feux tricolores.',
];

function choiceText(step: number, item: ChoiceItem): string {
  switch (step) {
    case 0:
      return `Vous avez ouvert ${item.name}`;
    case 1:
      return `Vous avez cliqué la barre « ${item.name} »`;
    case 2:
      return `Vous avez corrigé le champ « ${item.name} »`;
    default:
      return `Vous avez cliqué le bouton ${item.name}`;
  }
}

function failureSentence(step: number, item: ChoiceItem): string {
  switch (step) {
    case 0:
      return item.status === 'orange'
        ? `Vous ouvrez ${item.name}, qui n'était qu'à surveiller. Vous le surveillez désormais avec un soin admirable, loin du vrai problème.`
        : `Vous ouvrez ${item.name}, qui allait très bien. Vous voilà au moins parfaitement renseigné sur un projet qui n'avait aucun problème.`;
    case 1:
      return `Vous désignez « ${item.name} » avec une assurance que personne n'a eu le cœur de démentir. Vous avez eu le mérite de tenir la barre jusqu'au bout.`;
    case 2:
      return `Vous corrigez le champ « ${item.name} », qui n'avait rien demandé. Il est désormais impeccable, et l'erreur, elle, vous remercie de votre discrétion.`;
    default:
      return `Vous cliquez sur le bouton ${item.name} avec la fermeté de quelqu'un qui n'a aucun doute. Le plan, lui, en a désormais beaucoup.`;
  }
}

/** Phrase du compte rendu d'une étape sans décision (temps écoulé ou abandon). */
export const MISSING_SENTENCES: readonly string[] = [
  'Vous n\'avez ouvert aucun projet : le retard a pu poursuivre son travail en toute tranquillité, et le temps a fait comme lui.',
  'Vous cherchez encore l\'origine du dérapage. Il vous a gentiment attendu, puis il a continué sans vous.',
  'Vous regardez cinq champs en vous demandant lequel est le coupable. Les cinq vous regardent aussi, et aucun ne dit rien.',
  'Vous classiez les projets avec soin quand le temps s\'est écoulé. Au moins, tout le monde a attendu au même rang.',
  'Vous hésitiez encore entre le vert, le vert olive et le vert « peut-être » quand le temps a approuvé à votre place : en n\'approuvant rien.',
];

export function missingSentence(step: number): string {
  return MISSING_SENTENCES[step] ?? '';
}

/** Décision prise en cliquant un élément d'une étape à choix. */
export function decideChoice(step: number, itemId: string): DecisionInfo {
  const def = STEPS[step];
  if (!def || def.kind !== 'choice') {
    throw new Error(`L'étape ${step + 1} n'est pas une étape à choix`);
  }
  const choiceDef: ChoiceStepDef = def;
  const item = choiceDef.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Élément inconnu : ${itemId}`);
  }
  const ok = item.id === choiceDef.correctId;
  return {
    result: ok ? 'reussi' : 'rate',
    choice: choiceText(step, item),
    sentence: ok ? SUCCESS[step] : failureSentence(step, item),
  };
}

/** Nombre de projets classés à leur place idéale. */
export function wellPlaced(order: readonly string[], ideal: readonly string[]): number {
  return order.filter((id, i) => id === ideal[i]).length;
}

/** Décision de l'étape de classement : parfait (5) réussi, 2 à 4 bien placés partiel, 0 ou 1 raté. */
export function decideRank(step: number, order: readonly string[]): DecisionInfo {
  const def = STEPS[step];
  if (!def || def.kind !== 'rank') {
    throw new Error(`L'étape ${step + 1} n'est pas un classement`);
  }
  const rankDef: RankStepDef = def;
  const placed = wellPlaced(order, rankDef.idealOrder);
  const names = order.map((id) => rankDef.items.find((i) => i.id === id)?.name ?? id);
  const choice = `Votre ordre : ${names.join(' › ')}`;
  if (placed >= rankDef.idealOrder.length) {
    return { result: 'reussi', choice, sentence: SUCCESS[step] };
  }
  if (placed >= 2) {
    return {
      result: 'partiel',
      choice,
      sentence: `Vous avez classé ${placed} projets au bon endroit et les autres au gré de votre inspiration. L'inspiration, pour une fois, n'a pas été d'un grand secours.`,
    };
  }
  return {
    result: 'rate',
    choice,
    sentence: `${choice}. Vous avez protégé avec soin les projets qui allaient bien, pendant que les autres prenaient feu en toute autonomie.`,
  };
}

const dossiers = (n: number): string => `${n} dossier${n > 1 ? 's' : ''}`;

const CONCLUSIONS: Readonly<Record<Tier, { title: string; text: string }>> = {
  vert: {
    title: 'Plan adopté à l\'unanimité',
    text: 'Le comité vous soupçonne d\'avoir triché, et envisage déjà de vous confier le budget de l\'an prochain.',
  },
  jaune: {
    title: 'Adopté sous réserve',
    text: 'Le comité vous confie les couleurs, à condition qu\'elles s\'accompagnent d\'un mot ou d\'icônes facilement identifiables. C\'est d\'ailleurs le conseil du jour.',
  },
  orange: {
    title: 'Renvoyé en commission',
    text: 'Le comité vous propose d\'aller prendre l\'air, loin des tableaux de bord, et en profite pour ranger le dossier dans le tiroir rouge. Ou vert. Il ne sait plus.',
  },
  rouge: {
    title: 'Séance suspendue',
    text: 'Le comité fait appel à un expert en couleurs pendant que vous cherchez le bouton vert. L\'expert arrive avec deux avis, un vert et un rouge : par prudence, personne ne prend de décision.',
  },
};

/** Séance interrompue : les réponses manquantes valent 0 ; le texte dépend du nombre de dossiers traités. */
function interruptedConclusion(score: number, total: number, answered: number): Conclusion {
  if (answered <= 0) {
    return {
      icon: TIER_ICON.rouge,
      title: 'Séance ajournée',
      text: 'Le comité s\'installe, ouvre ses dossiers… et attend toujours votre première décision. Il en profite pour relire son ordre du jour, deux fois, puis une troisième.',
    };
  }
  const icon = TIER_ICON[tierFor(score, total)];
  if (answered * 2 <= total) {
    return {
      icon,
      title: 'Séance levée en cours de route',
      text: `Le comité a traité ${dossiers(answered)} sur ${total}, puis s'est aperçu que la séance s'arrêtait là. Les autres dossiers rejoignent la pile « à voir plus tard », celle qui ne se vide jamais.`,
    };
  }
  return {
    icon,
    title: 'Séance levée juste avant la fin',
    text: `Le comité a presque tout vu (${dossiers(answered)} traité${answered > 1 ? 's' : ''} sur ${total}) et s'est arrêté à deux pas de la sortie, le stylo déjà capuchonné. Les dossiers restants attendront la prochaine séance, avec les mêmes couleurs.`,
  };
}

/** Conclusion du comité : 5 sur 5 🟢, 3 à 4 🟡, 1 à 2 🟠, 0 🔴 (proportions si le défi a moins d'étapes). */
export function conclusionFor(score: number, total: number, answered: number = total): Conclusion {
  if (answered < total) {
    return interruptedConclusion(score, total, answered);
  }
  const tier = tierFor(score, total);
  return { icon: TIER_ICON[tier], ...CONCLUSIONS[tier] };
}

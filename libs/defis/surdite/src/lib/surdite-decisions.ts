import { Conclusion, DecisionInfo, TIER_ICON, Tier, tierFor } from '@ag/domain';
import { STEPS } from './surdite-content';

const SUCCESS: readonly string[] = [
  'Vous reconnaissez Madame Dumont malgré le souffle : elle se sent déjà écoutée.',
  'Vous retrouvez le dossier 4812 du premier coup. La messagerie vocale n\'a jamais été aussi fière.',
  'Vous planifiez le rappel mardi à 14 h : ponctualité exemplaire, même avec un casque qui grésille.',
  'Vous identifiez la bonne alerte : votre oreille a visiblement un meilleur radar que le reste du bureau.',
  'Vous appuyez du bon côté : l\'assistant vocal vous remercie d\'une voix si claire que vous n\'y croyez plus.',
];

const CHOICE_TEXT: readonly ((name: string) => string)[] = [
  (n) => `Vous avez rappelé ${n}`,
  (n) => `Vous avez noté le dossier ${n}`,
  (n) => `Vous avez planifié le rappel ${n}`,
  (n) => `Vous avez classé l'alerte comme « ${n} »`,
  (n) => `Vous avez appuyé sur le bouton de ${n}`,
];

/** Phrase du compte rendu d'une étape sans décision (temps écoulé ou abandon). */
export const MISSING_SENTENCES: readonly string[] = [
  'Le nom du client reste un mystère : la messagerie vocale garde son secret, et lui garde sa patience, pour l\'instant.',
  'Le numéro de dossier se perd quelque part entre le souffle et la coupure. Le dossier, lui, ne s\'en est pas aperçu.',
  'Le jour du rappel n\'est pas fixé : le client attend un appel sans date, ce qui est la forme la plus pure du suspense.',
  'L\'alerte sonne dans le vide : personne n\'a dit s\'il s\'agissait d\'une information, d\'un avertissement ou d\'une urgence. Elle a décidé de sonner pour tout le monde.',
  'La confirmation n\'a pas été donnée : l\'assistant vocal attend toujours, un doigt sur chaque bouton, sans oser choisir.',
];

export function missingSentence(step: number): string {
  return MISSING_SENTENCES[step] ?? '';
}

/** Décision prise en choisissant une option à l'étape `step`. */
export function decide(step: number, optionId: string): DecisionInfo {
  const def = STEPS[step];
  const option = def?.options.find((o) => o.id === optionId);
  if (!def || !option) {
    throw new Error(`Option inconnue à l'étape ${step + 1} : ${optionId}`);
  }
  const ok = option.id === def.correctId;
  return {
    result: ok ? 'reussi' : 'rate',
    choice: CHOICE_TEXT[step](option.name),
    sentence: ok ? SUCCESS[step] : (option.failure ?? ''),
  };
}

const CONCLUSIONS: Readonly<Record<Tier, { title: string; text: string }>> = {
  vert: { title: 'Client conquis', text: 'Il vous trouve très à l\'écoute — ce qui, vu les circonstances, tient du miracle.' },
  jaune: {
    title: 'Client rappelé, avec quelques malentendus',
    text: 'Il vous trouve charmant, mais vous suggère de lui écrire un mail la prochaine fois.',
  },
  orange: { title: 'Client perplexe', text: 'Il vous demande d\'envoyer un message écrit la prochaine fois, avec de vraies lettres.' },
  rouge: { title: 'Client perdu', text: 'Il vous rappelle lui-même et propose de communiquer par pigeon voyageur.' },
};

/** Défi interrompu : les réponses manquantes valent 0 ; le texte dépend du nombre de réponses données. */
function interruptedConclusion(score: number, total: number, answered: number): Conclusion {
  if (answered <= 0) {
    return {
      icon: TIER_ICON.rouge,
      title: 'Client en attente',
      text: 'Le message vocal reste sur le répondeur : le client attend toujours qu\'on l\'écoute. Il a commencé à laisser un deuxième message pour demander si le premier avait été reçu.',
    };
  }
  const icon = TIER_ICON[tierFor(score, total)];
  if (answered * 2 <= total) {
    return {
      icon,
      title: 'Appel interrompu',
      text: `Le client a obtenu ${answered} réponse${answered > 1 ? 's' : ''} sur ${total}, puis la ligne s'est coupée. Il envisage de renvoyer un message, plus lentement, avec de vraies lettres.`,
    };
  }
  return {
    icon,
    title: 'Appel coupé juste avant la fin',
    text: `Le client a presque tout obtenu (${answered} réponses sur ${total}) quand la communication a été coupée. Il rappellera, ou il écrira : au choix de la messagerie.`,
  };
}

/** Conclusion : 5 sur 5 🟢, 3 à 4 🟡, 1 à 2 🟠, 0 🔴 ; adaptée au nombre de réponses si le défi s'arrête avant la fin. */
export function conclusionFor(score: number, total: number, answered: number = total): Conclusion {
  if (answered < total) {
    return interruptedConclusion(score, total, answered);
  }
  const tier = tierFor(score, total);
  return { icon: TIER_ICON[tier], ...CONCLUSIONS[tier] };
}

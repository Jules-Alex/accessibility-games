import { DEFI_IDS, DefiId } from './defis';

export interface Synthesis {
  /** Socle, avec un passage `**...**` à mettre en évidence. */
  main: string;
  extra: string;
}

const MAIN =
  "En quelques minutes, vous avez buté sur un zoom qui déborde, une souris qui ne sert à rien, des boutons muets, des couleurs qui se confondent et une voix qui s'efface. Pour vous, c'était un jeu. **Pour des millions de personnes, c'est le quotidien** : chaque jour, devant chaque application qui n'a pas pensé à elles.";

function formatDefiList(ids: readonly DefiId[]): string {
  if (ids.length === 1) {
    return `le défi ${ids[0]}`;
  }
  return `les défis ${ids.slice(0, -1).join(', ')} et ${ids[ids.length - 1]}`;
}

export function buildSynthesis(abandoned: readonly DefiId[]): Synthesis {
  if (abandoned.length === 0) {
    return {
      main: MAIN,
      extra: "Vous avez joué jusqu'au bout. Elles, elles n'ont pas de bouton pour s'arrêter quand elles le veulent… ni de fin au bout de deux minutes.",
    };
  }
  if (abandoned.length >= DEFI_IDS.length) {
    return {
      main: MAIN,
      extra: "Vous avez tout abandonné : c'est exactement ce que font aussi les utilisateurs, quand l'application ne leur laisse aucune chance. Et ce sont des clients en moins.",
    };
  }
  return {
    main: MAIN,
    extra: `Vous avez abandonné ${formatDefiList(abandoned)} ? Elles n'ont pas toujours cette option.`,
  };
}

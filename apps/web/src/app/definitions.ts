import { DefiDefinition } from '@ag/state';
import { CLAVIER_DEFINITION } from '@ag/defi-clavier';
import { COULEURS_DEFINITION } from '@ag/defi-couleurs';
import { LECTEUR_DEFINITION } from '@ag/defi-lecteur';
import { SURDITE_DEFINITION } from '@ag/defi-surdite';
import { ZOOM_DEFINITION } from '@ag/defi-zoom';
import { PLACEHOLDER_DEFINITIONS } from './placeholder-defis';

const REAL_DEFINITIONS: readonly DefiDefinition[] = [ZOOM_DEFINITION, CLAVIER_DEFINITION, LECTEUR_DEFINITION, COULEURS_DEFINITION, SURDITE_DEFINITION];

/** Défis réels branchés dans l'application (les cinq) ; les définitions de démonstration ne servent plus que de repli. */
export const DEFINITIONS: readonly DefiDefinition[] = [
  ...REAL_DEFINITIONS,
  ...PLACEHOLDER_DEFINITIONS.filter((d) => !REAL_DEFINITIONS.some((r) => r.id === d.id)),
].sort((a, b) => a.id - b.id);

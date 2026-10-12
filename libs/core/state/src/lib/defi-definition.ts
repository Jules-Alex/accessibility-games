import { InjectionToken, Type } from '@angular/core';
import { DefiId } from '@ag/domain';

/** Résumé en 3 lignes affiché sur l'écran de fin de défi. */
export interface DefiResume {
  vecu: string;
  impact: string;
  action: string;
}

/** Ce que chaque librairie de défi fournit au noyau. */
export interface DefiDefinition {
  id: DefiId;
  /** Texte « La situation » de l'écran de consigne. */
  situation: string;
  /** Une pastille par étape sur l'écran de consigne (longueur = nombre d'étapes). */
  missionPills: readonly string[];
  /** Consigne de chaque étape pour le HUD ; `**mot**` met le mot en évidence. */
  stepPrompts: readonly string[];
  resume: DefiResume;
  /** Composant de jeu (chargé à la demande) ; il injecte `DefiSession` pour valider les étapes. */
  player: () => Promise<Type<unknown>>;
  /** Contenu supplémentaire de l'écran de fin (décisions, compte rendu…), optionnel. */
  endExtra?: () => Promise<Type<unknown>>;
  /** Bloc supplémentaire de l'écran de consigne (par exemple un test de la voix), optionnel. */
  consigneExtra?: () => Promise<Type<unknown>>;
}

export const DEFI_DEFINITIONS = new InjectionToken<readonly DefiDefinition[]>('AG_DEFI_DEFINITIONS');

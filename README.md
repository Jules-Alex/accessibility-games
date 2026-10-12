# Accessibility Games

Atelier de sensibilisation à l'accessibilité numérique : cinq défis qui font vivre une barrière d'accessibilité.
Front Angular 22 dans un workspace Nx, sans back-end, déployé sur GitHub Pages.

## Prérequis

Node ≥ 24.15 (`nvm use`).

## Commandes

- `npx nx serve web` : serveur de développement (`http://localhost:4200`)
- `npx nx run-many -t lint test` : lint et tests de tous les projets (noyau, écrans et les 5 défis)
- `npx nx build web --configuration=production --base-href=/accessibility-games/` : build pour GitHub Pages

## Utilisation

- Les présentateurs donnent un code après chaque débrief ; les codes sont sur `#/animateur`.
- `?mode=autonome` (avant le `#`) : mode sans animateur (bouton « Continuer », synthèse finale affichée).

## Structure

- `libs/core/domain` : logique pure (défis, score, badges, codes, minuteur, textes)
- `libs/core/state` : état Angular (`GameStore`, `DefiTimer`, `DefiSession`, `DefiDefinition`)
- `libs/shared/ui` : gabarit visuel
- `libs/shell/screens` : écrans (accueil, consigne, fin de défi, résultat, engagement)
- `libs/defis/*` : un défi par librairie, voir `docs/ajouter-un-defi.md`
- `tools/defi5-audio` : outils et consignes pour les extraits audio du défi 5 (`apps/web/public/audio/defi5`)

## Licence

Copyright (c) 2026 Jules Lecoeur. Tous droits réservés : le dépôt est public pour être consulté, sans licence de
réutilisation (voir `LICENSE`).

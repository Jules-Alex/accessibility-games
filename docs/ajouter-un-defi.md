# Ajouter un défi

Chaque défi est une librairie Nx `type:defi` qui fournit une `DefiDefinition` ; le noyau gère le reste
(consigne, minuteur, HUD, fin de défi, code, score, badges).

1. Générer la librairie (remplacer `zoom` par le nom du défi) :
   ```bash
   npx nx g @nx/angular:library --name=defi-zoom --directory=libs/defis/zoom --importPath=@ag/defi-zoom \
     --prefix=ag --standalone --unitTestRunner=jest --linter=eslint --tags="type:defi" --no-interactive
   ```
2. Créer le composant de jeu. Il injecte `DefiSession` et appelle `completeStep()` à chaque étape réussie
   (`completeStep(5)` pour une demi-réussite). Il ne gère ni le minuteur, ni l'abandon, ni la fin du défi.
   Pour un défi à décisions dont le score ne doit pas être visible pendant le jeu (défis 4 et 5), appeler
   `addHiddenPoints(points)` puis `completeStep(0)` : les points cachés sont comptés dans le résultat à la fin du défi.
3. Exporter une `DefiDefinition` (`id`, `situation`, `missionPills`, `stepPrompts`, `resume`, `player`, et en option
   `consigneExtra` pour un bloc de l'écran de consigne et `endExtra` pour un bloc de l'écran de fin).
   Le nombre d'étapes vient de `DEFIS` (`@ag/domain`) : pour le changer, modifier `stepsTotal` et `perseverantThreshold`
   de ce défi. `badgeBasis: 'points'` calcule le badge sur les points plutôt que sur les étapes faites.
4. Dans `apps/web/src/app/definitions.ts`, ajouter la définition à la liste `REAL_DEFINITIONS`.
5. Tester : tests unitaires de la librairie, puis `npx nx serve web` et le parcours du défi au clavier seul.

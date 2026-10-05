# Tâches : home v4

## Phase 1: Setup

- [x] T001 Initialiser Spec Kit/Codex et définir les exigences dans `specs/001-home-v4/spec.md`.
- [x] T002 Formaliser le plan et les contrats dans `specs/001-home-v4/plan.md` et `contracts/navigation.md`.

## Phase 2: Foundational

- [x] T003 Copier les assets autorisés et polices dans `v4/assets/`.
- [x] T004 Documenter la direction dans `v4/DESIGN.md`.

## Phase 3: US1 Parcours

Objectif : hero et navigation conformes. Vérification indépendante : cinq étapes, CTA clair et toutes les destinations fonctionnelles.

- [x] T005 [US1] Construire header, hero et cinq étapes dans `v4/index.html` et `v4/home.css`.
- [x] T006 [US1] Implémenter menu et carrousel clavier/tactile dans `v4/home.js`.

## Phase 4: US2 Accompagnement

Objectif : retrouver les sections des références et rejoindre les vrais services. Vérification indépendante : comparaison et liens.

- [x] T007 [US2] Composer diagnostic, méthode, semaine, progression et continuité dans `v4/index.html` et `v4/home.css`.
- [x] T008 [US2] Brancher le résultat du test, les CTA et analytics dans `v4/home.js`.

## Phase 5: US3 Professeurs

Objectif : représentation équivalente. Vérification indépendante : deux permutations chronométrées, pause et mouvement réduit.

- [x] T009 [US3] Composer les deux nouveaux portraits et leur animation dans `v4/home.css` et `v4/home.js`.

## Phase 6: Polish et vérification

- [x] T010 Intégrer la copie de `v4/` dans `build.mjs` et l'aperçu dans `scripts/serve.mjs`.
- [x] T011 Vérifier ressources, destinations et contraintes via `scripts/verify-v4.mjs`.
- [x] T012 Vérifier visuellement et cliquer les contrôles desktop/mobile ; consigner les preuves dans `specs/001-home-v4/verification.md`.
- [x] T013 Exécuter la convergence et le Delivery Gate Anti Slop dans `specs/001-home-v4/verification.md`.

## Dépendances et stratégie

## Extension 08–17

- [x] T014 Vérifier les planches, récupérer les ajustements V4 existants et étendre spec/plan.
- [x] T015 Centraliser les tarifs, témoignages et sources ; préparer le module IRCC.
- [x] T016 Ajouter les dix compositions finales sans reconstruire la première partie.
- [x] T017 Relier tarifs, témoignages, FAQ, conditions, formulaire et navigation V4.
- [x] T018 Créer le SVG phare/chemin autorisé et utiliser le logo officiel dans le footer.
- [x] T019 Vérifier build, données, liens, interactions, desktop/mobile et états d'erreur.
- [x] T020 Convergence finale et preuves Anti Slop dans `continuation-verification.md` ; attente externe T022 documentée.

Setup → actifs/direction → US1 → US2 → US3 → build et validation. Les actifs sont indépendants du HTML, mais les histoires partagent les mêmes fichiers : implémentation séquentielle pour éviter les conflits. Livrer toutes les histoires, pas seulement le hero.

## Phase 7: Convergence

- [x] T021 Faire dériver chaque prix de cycle de la même valeur source que son prix mensuel, ainsi que du taux de remise centralisé, selon Extension 08–17 / cohérence tarifaire (partial).
- [ ] T022 Brancher Instagram et TikTok après réception des URL exactes du propriétaire, selon Extension 08–17 / footer (missing, source externe attendue).

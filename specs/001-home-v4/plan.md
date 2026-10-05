# Implementation Plan: Home v4

**Branch**: `v4` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

## Summary

Créer une page HTML autonome dans `v4/`, sa feuille CSS et son JavaScript, en gardant les services et pages du site à la racine. Copier les fichiers de marque et les nouveaux portraits dans les assets de v4. Ajouter la copie de v4 au build existant.

## Technical Context

- Langages : HTML, CSS, JavaScript ES modules, Node pour le build et la vérification.
- Dépendances de production : aucune nouvelle bibliothèque ; `site-config.js` et `analytics.js` existants.
- Stockage : lecture défensive de `sessionStorage.pathwayPlacementResult`, aucune nouvelle persistance personnelle.
- Plateforme : site statique, navigateurs modernes desktop et mobile.
- Vérification : build existant, contrôles Node des liens/ressources, navigateur automatisé et captures visuelles.
- Performance : polices locales, dimensions d'images explicites, portraits différés, transitions par transform/opacity, timer limité à la section visible.
- Périmètre : une home espagnole, sept compositions, cinq états de parcours, routes existantes conservées.

## Constitution Check

Le fichier initial est un modèle non rempli ; les préférences utilisateur gouvernent. La pile actuelle est conservée, les sous-projets exclus, les changements antérieurs préservés et aucun déploiement automatique ajouté. La charte et les références priment sur les préférences visuelles des skills.

## Project Structure

- `v4/index.html` : header fixe, hero, diagnostic, méthode, semaine, progression, professeurs, continuité et accès aux services existants.
- `v4/home.css` : tokens, polices, dispositions de référence, animation, responsive et focus.
- `v4/home.js` : carrousel, menu, portraits, reprise du résultat et suivi des sections.
- `v4/assets/` : copies des nouvelles photos, logo officiel, polices OFL et fond du parcours.
- `build.mjs` : inclusion de v4 dans `dist/client/v4`.
- `scripts/verify-v4.mjs` : intégrité des chemins et invariants de livraison.
- `scripts/serve.mjs` : aperçu local statique, écoute uniquement localhost.
- `specs/001-home-v4/` : intention, plan, tâches et preuves finales.

## Integration Decisions

- Évaluation : `/test-placement.html`, pas le calculateur CRS.
- Programmes : `/programas/a1/`, `/programas/a2/`, `/programas/b1/`, `/programas/b2/` ; NCLC 7 : `/preparacion-tef-canada.html`.
- Langues : `/fr/`, `/en/`, `/de/` ; espagnol : `/v4/`.
- Programme complet et tarifs : `/#planes`, gardant les offres existantes comme source unique.
- Diagnostic : ne montrer des scores personnels qu'après validation des champs du résultat existant ; sinon conserver l'exemple annoncé.
- Maquettes de calendrier et progression : statiques, identifiées comme exemples, sans fausse réservation.

## Execution

## Extension 08–17 (2026-10-05)

Conserver `home.css`, `home.js` et le DOM de la première partie synchronisés depuis la V4 actuelle. Ajouter les sections dans `index.html`, isoler leurs styles dans `continuation.css`, leurs contrôles dans `continuation.js`, les données commerciales et témoignages dans `content.js`. Un rendu partagé `render.js` permet le HTML initial au build et le changement d'état sans dupliquer les données. Le module `ircc-rounds.js` vérifie l'endpoint officiel et son repli daté. Réutiliser le formulaire et les pages légales existants sous V4 via le build, sans modifier le site racine. Générer le SVG phare/chemin autorisé, conserver le logo officiel. Pas de dépendance de production supplémentaire.

Fondations et actifs, structure et couleurs, interactions, branchement/build, contrôle visuel et fonctionnel, convergence. Les actifs peuvent être préparés indépendamment du code ; réalisation et contrôle locaux.

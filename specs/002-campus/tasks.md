# Tâches : Campus Pathway

## Phase 0 : cadrage

- [x] T001 Spécification dans `specs/002-campus/spec.md`.
- [x] T002 Architecture, coûts, méthode de contenu et phases dans `specs/002-campus/plan.md`.
- [x] T003 Prototype cliquable élève + professeur dans `prototipos/campus.html` (unité 1 de l'A2 jouable, données de démonstration).
- [x] T004 Premier retour : direction visuelle refaite (prototype v2).
- [x] T004b Prototype v3 : onboarding, choix TEF / TCF, thème sombre revu.
- [ ] T004c Retours de Ryan et Abdrahim sur le prototype v3.
- [ ] T005 Pathway crée le projet Supabase (région Americas / East US, voir spec) et transmet l'URL et la clé publique ; compte d'envoi d'e-mails ensuite.

## Phase 1 : base

- [ ] T010 Schéma Postgres, règles RLS et données de test (`campus/db/`).
- [ ] T011 `scripts/build-campus.mjs` : publication sous `/campus/`, `noindex` tant que le campus est fermé, vérifications de construction.
- [ ] T012 Connexion, invitation des élèves, rôles, onboarding (profil, examen, date, niveau, rythme).
- [ ] T013 Coque de l'application (navigation, thème, icônes V4) et tableau de bord élève.
- [ ] T014 Moteur d'exercices (7 types) et lecteur de leçon, repris du prototype.
- [ ] T015 XP, niveaux, objectif du jour, séries et protecteurs, badges.
- [ ] T016 Devoirs : assignation, suivi, rendu.
- [ ] T017 Vue professeur : groupe, alertes, erreurs fréquentes.
- [ ] T018 Contenu : unités 1 à 16 de l'A2 + examen A, rédigées puis validées par Sacha.
- [ ] T019 Lien « Campus » dans l'en-tête du site vitrine, toutes langues.
- [ ] T020 Mise à jour de la politique de confidentialité (Ley 29733, hébergement aux États-Unis), validée par le conseil juridique de Pathway.
- [ ] T021 Test avec 3 à 5 élèves volontaires avant ouverture à tous.

## Phase 2 : profondeur

- [ ] T030 Révision espacée et erreurs notées en cours.
- [ ] T031 Simulacres TEF chronométrés et estimation NCLC.
- [ ] T032 Rappels par e-mail.
- [ ] T033 A2 complet, puis A1, B1, B2.

## Phase 3 : premium

- [ ] T040 Productions écrites et orales, correction professeur.
- [ ] T041 Pré-correction IA (option, coût mesuré avant activation).
- [ ] T042 Statistiques de progression et rapport pour l'élève.

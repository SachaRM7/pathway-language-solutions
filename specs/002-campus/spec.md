# Feature Specification: Campus Pathway (espace élève et professeur)

**Feature Branch**: `claude/admiring-faraday-xviq98`
**Created**: 2026-11-10
**Status**: Prototype validé à discuter — pas encore en production
**Input**: Construire une plateforme d'apprentissage ambitieuse, accessible depuis le site vitrine, pour donner aux élèves de la matière entre les cours en visio : exercices, révisions, préparation TEF, gamification. Moderne, très travaillée côté UI / UX, 100 % fonctionnelle.

**Prototype** : `prototipos/campus.html` (fichier autonome, données de démonstration, `noindex`, non publié par `build.mjs`). Version 2 : nouvelle direction visuelle après le premier retour.

## Décisions déjà prises

| Sujet | Décision |
|---|---|
| Pédagogie | Sacha, en concertation avec Ryan et Abdrahim. Environ 1 h par jour, 5 jours par semaine. |
| Volume | 2 professeurs, quelques dizaines d'élèves, moins de 100 connectés en même temps. |
| Langue | Interface en espagnol d'abord ; le contenu travaillé est en français. Les autres langues du site (FR, EN, DE) viendront après. |
| Services tiers | Accord pour Supabase (comptes, base de données, fichiers) et pour une IA de correction en option. |
| Architecture | Le site vitrine reste sur GitHub Pages (`pathway-languages.com`). Le campus est servi par le même dépôt et le même déploiement, sous `/campus/`. Seule nouveauté : un projet Supabase. |

## Principes

1. **Le campus prolonge le cours, il ne le remplace pas.** Chaque fonction relie l'élève à son professeur : devoirs donnés en classe, erreurs notées pendant le cours et renvoyées dans la révision, productions corrigées.
2. **La gamification sert l'objectif réel.** Les XP, séries et badges récompensent des pas vers le NCLC 7 et le TEF Canada, pas le temps passé dans l'app. Pas de « vies » qui bloquent l'apprentissage. Pas de classement public individuel : avec quelques dizaines d'élèves, on préfère les objectifs personnels et des défis coopératifs de groupe.
3. **Le contenu vient des manuels Pathway.** Les 64 unités par niveau (A1 → B2) deviennent des leçons interactives. Aucun exercice n'est publié sans validation pédagogique.
4. **Rien d'inventé.** Les estimations NCLC sont présentées comme indicatives ; le campus ne promet aucun résultat d'examen ni de tirage Express Entry.

## User Scenarios & Testing

### User Story 1 — Faire ses devoirs entre deux cours (P1)

L'élève se connecte, voit le devoir donné par son professeur et fait la leçon de l'unité en une dizaine de minutes.

**Independent Test** : se connecter avec un compte élève, ouvrir le devoir, terminer la leçon, constater l'XP, la série et le devoir rendu côté professeur.

1. Le tableau de bord affiche : devoir à faire et échéance, série, objectif du jour, progression vers le NCLC 7, prochain cours, défi de la semaine.
2. Une leçon enchaîne 8 à 12 exercices variés (QCM, texte à trous, compréhension orale, phrase à remettre dans l'ordre, association, dictée, repérage d'erreur).
3. Chaque réponse reçoit un retour immédiat avec une explication en espagnol ; une erreur revient en fin de leçon.
4. L'écran de fin montre XP, taux de réussite, temps, série, badges obtenus et cartes ajoutées à la révision.
5. La leçon fonctionne au clavier (1–4, Entrée, Échap), au doigt sur téléphone de 360 px et en mouvement réduit.

### User Story 2 — Suivre son groupe (P1)

Le professeur voit qui travaille, qui décroche et quelles erreurs reviennent, puis agit avant le prochain cours.

**Independent Test** : avec un compte professeur, assigner une unité à des élèves, noter une erreur de cours, vérifier que l'élève la retrouve dans sa révision.

1. Vue « Mon groupe » : élèves, niveau, série, dernière activité, état des devoirs, alertes (inactivité, difficulté sur une notion).
2. Assigner une unité ou un simulacre à un ou plusieurs élèves, avec échéance.
3. Noter une erreur entendue en cours (phrase fautive, correction, explication) : elle devient une carte de révision de l'élève.
4. Erreurs fréquentes du groupe, agrégées depuis les leçons.

### User Story 3 — Réviser au bon moment (P2)

L'élève révise des cartes (vocabulaire, conjugaisons, erreurs) qui reviennent selon un algorithme de répétition espacée.

1. Cartes issues des unités, des erreurs de leçon et des erreurs notées par le professeur.
2. Quatre réponses (À revoir, Difficile, Bien, Facile) qui fixent la prochaine échéance.
3. Lecture audio de chaque carte.

### User Story 4 — S'entraîner au TEF Canada (P2)

1. Simulacres chronométrés par épreuve (compréhension orale et écrite, expression écrite et orale).
2. Estimation NCLC par compétence, historique, lien vers le calculateur CRS existant.

### User Story 5 — Produire et être corrigé (P3)

1. L'élève rend un texte ou un enregistrement vocal sur un sujet type TEF.
2. Le professeur corrige dans le campus ; une pré-correction automatique (IA) peut lui proposer des annotations qu'il valide.

### Edge Cases

- Fuseaux horaires : la série et l'objectif du jour se calculent dans le fuseau de l'élève.
- Un jour sans pratique consomme un « protecteur de série » s'il en reste (1 gagné tous les 7 jours, 2 au maximum).
- Navigateur sans voix française : l'audio vient des enregistrements, jamais uniquement de la synthèse du navigateur.
- Réseau coupé pendant une leçon : les réponses sont gardées localement et envoyées au retour.
- Élève sans professeur ou ancien élève : accès au parcours et à la révision sans devoirs.
- Accent oublié dans une réponse tapée : accepté avec avertissement, compté comme « presque ».

## Requirements

### Functional Requirements

- **FR-001** : Lien « Campus » dans l'en-tête du site vitrine (toutes langues) vers `/campus/`.
- **FR-002** : Connexion par e-mail (lien magique ou mot de passe) ; comptes créés ou invités par Pathway, pas d'inscription publique.
- **FR-003** : Rôles élève, professeur et admin ; un élève ne voit que ses données, un professeur celles de ses élèves.
- **FR-004** : Moteur d'exercices avec au moins 7 types (choix, texte à trous, écoute, ordre, association, dictée, repérage d'erreur).
- **FR-005** : Contenu stocké en base, avec statut brouillon / validé ; seuls les exercices validés sont visibles des élèves.
- **FR-006** : XP, niveaux, objectif quotidien réglable, séries avec protecteurs, badges liés à des étapes réelles, défis hebdomadaires du professeur et défi coopératif de groupe.
- **FR-007** : Devoirs assignés par le professeur, avec échéance et suivi.
- **FR-008** : Révision espacée alimentée par les leçons et par le professeur.
- **FR-009** : Tableau de bord professeur avec alertes d'inactivité et de difficulté.
- **FR-010** : Simulacres TEF chronométrés et estimation NCLC indicative (phase 2).
- **FR-011** : Productions écrites et orales, correction professeur, pré-correction IA en option (phase 3).
- **FR-012** : Rappels par e-mail (devoir, série en danger), puis WhatsApp si souhaité.
- **FR-013** : Direction visuelle propre au campus, validée sur le prototype v2 : fond neutre, tuiles pastel en grille « bento », typographie Plus Jakarta Sans, boutons en pilule, le corail de Pathway comme seule couleur vive. Thème clair et sombre, accessible au clavier, utilisable à 360 px.
- **FR-014** : Le site vitrine existant, son déploiement et ses tests ne changent pas, à l'exception du lien FR-001.

### Key Entities

- **Profil** : rôle, nom, langue, niveau, objectif (examen, date visée), professeur, fuseau horaire.
- **Unité** : niveau, segment, numéro, titre, statut.
- **Exercice** : unité, type, énoncé, solution, explication, audio, ordre, statut (brouillon / validé).
- **Tentative** : élève, exercice, réponse, correct, date, session.
- **Carte de révision** : élève, source (unité, erreur de leçon, erreur de cours), recto, verso, échéance, intervalle, facilité.
- **Devoir** : professeur, contenu, échéance, élèves ciblés, date de rendu.
- **Événement XP** : élève, montant, raison, date (journal ; série et niveau en sont déduits).
- **Badge obtenu**, **Défi**, **Simulacre / résultat**, **Production / correction**.

## Success Criteria

- **SC-001** : Un élève termine une leçon de 10 minutes sur téléphone sans aide.
- **SC-002** : Un professeur assigne un devoir en moins d'une minute.
- **SC-003** : Au bout d'un mois, au moins 60 % des élèves actifs pratiquent 3 jours par semaine ou plus.
- **SC-004** : Le segment A de l'A2 (16 unités + examen A) est entièrement jouable et validé à la fin de la phase 1.
- **SC-005** : Coût d'infrastructure inférieur à 50 CAD par mois tant que le campus compte moins de 100 élèves.

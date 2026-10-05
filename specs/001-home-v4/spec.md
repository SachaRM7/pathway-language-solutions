# Feature Specification: Home Pathway v4

**Feature Branch**: `v4`
**Created**: 2026-09-22
**Status**: Ready for implementation
**Input**: Refaire la home sur `/v4/`, au plus près des images 1 à 11, avec la charte officielle et les deux nouveaux portraits joints ensuite.

## User Scenarios & Testing

### User Story 1 - Découvrir son parcours (Priority: P1)

Le visiteur retrouve la composition de l'image 1 et explore cinq étapes de français avant d'ouvrir un vrai programme.

**Independent Test**: parcourir les cinq étapes, ouvrir leurs destinations et commencer le test de niveau.

**Acceptance Scenarios**:

1. À l'ouverture, le header de l'image 1 reste fixé au défilement et A1 affiche 1/5.
2. Les flèches, les étapes et le clavier permettent de parcourir A1, A2, B1, B2, NCLC 7, avec les textes des images 1 à 5.
3. Le CTA du carrousel conserve son fond clair et son contour dans toutes les étapes, au survol, au focus et à l'appui.
4. Chaque programme et chaque CTA d'évaluation rejoint le contenu existant correspondant.

### User Story 2 - Comprendre l'accompagnement (Priority: P1)

Le visiteur parcourt les compositions des images 6 à 11 et peut poursuivre vers le programme, le test et l'inscription.

**Independent Test**: comparer chaque section aux références à 1280 px, puis à 390 px et au clavier.

**Acceptance Scenarios**:

1. Les sections suivent les références 6, 7, 8, 9, 10 et 11 et gardent leurs textes espagnols.
2. Les exemples de résultat, calendrier et progression sont explicitement présentés comme exemples, jamais comme un espace connecté inventé.
3. Les couleurs et polices suivent la charte 1.1. La taille des titres s'adapte à la maquette et à l'écran.
4. La zone média de l'image 11 présente un placeholder de paysage, remplaçable ensuite.

### User Story 3 - Rencontrer les deux professeurs (Priority: P1)

Les deux professeurs bénéficient du même temps au premier plan.

**Independent Test**: observer au moins deux permutations et vérifier les photos employées.

**Acceptance Scenarios**:

1. Les seules photos utilisées sont les deux JPEG du second envoi, jamais les anciens portraits.
2. Les cartes échangent leurs positions et leur profondeur toutes les 2,5 secondes avec une animation lisible.
3. Une commande permet de suspendre l'alternance. En mouvement réduit, les portraits ont une présentation statique équivalente.

### Edge Cases

- Navigation cyclique après 5/5 et avant 1/5 ; touches Home/End ; glissement tactile horizontal.
- Page masquée, section professeurs hors écran, préférence de mouvement réduit et pause manuelle.
- JavaScript indisponible : contenus et liens essentiels lisibles.
- Résultat de test absent, invalide ou stockage inaccessible : conserver l'exemple annoncé.
- Téléphone de 360 px, tablette et zoom texte : aucun débordement horizontal.

## Requirements

### Functional Requirements

- **FR-001** : Livrer une home distincte à `/v4/` sur la branche `v4`.
- **FR-002** : Reprendre un unique header fixe conforme à l'image 1, avec navigation mobile utilisable.
- **FR-003** : Reproduire les sept compositions principales, avec le contenu exact des cinq étapes.
- **FR-004** : Garder le CTA secondaire du carrousel clair dans tous ses états.
- **FR-005** : Employer Outfit, DM Sans et la palette officielle de la charte v1.1.
- **FR-006** : Utiliser exclusivement les deux nouveaux portraits joints pour la section professeurs.
- **FR-007** : Alterner équitablement les portraits à 2,5 secondes, avec pause et mouvement réduit.
- **FR-008** : Prévoir le placeholder demandé dans la section continuité.
- **FR-009** : Relier navigation, programmes, évaluation, inscription, langues, contact et informations légales aux destinations réelles du site.
- **FR-010** : Garder le suivi des clics existant et exploiter un résultat de test disponible sans fabriquer de données.
- **FR-011** : Assurer navigation clavier, focus visible, lisibilité et adaptation mobile.
- **FR-012** : Ne pas utiliser les sous-projets présents dans le dépôt, ni modifier les suppressions et changements antérieurs de l'utilisateur.

### Key Entities

- Étape : niveau, titre, texte, programme, ordre et état courant.
- Portrait : photo fournie, position, profondeur et durée de présence devant.
- Résultat de test : niveau et scores existants, ou exemple explicitement indiqué.

## Success Criteria

- **SC-001** : Les sept compositions sont vérifiées visuellement face aux références, en documentant les écarts imposés par la charte.
- **SC-002** : Les cinq étapes fonctionnent dans les deux sens, tous les CTA ouvrent leur destination et le CTA secondaire ne devient jamais foncé.
- **SC-003** : Deux permutations consécutives des professeurs sont vérifiées à 2,5 secondes et le mode réduit conserve deux portraits équivalents.
- **SC-004** : Aucun débordement ni contrôle inaccessible à 360, 390, 768 et 1280 px.
- **SC-005** : La page construite et ses ressources chargent sans erreur, avec vérification des destinations internes.

## Assumptions

## Extension du 5 octobre 2026 : planches 08 à 17

La demande actuelle remplace les anciennes hypothèses de navigation : toutes les destinations internes restent dans `/v4/`. Les routes indisponibles gardent le message de refonte existant. La première partie, y compris ses ajustements distants et ses langues, est conservée.

- Ajouter témoignages (8 vidéos et 16 avis sourcés), tarifs mensuels/cycle, bilan pédagogique d'exemple, FAQ, NCLC 7, CRS, rondes IRCC, engagement et CTA/footer après le bento.
- Ne créer qu'une série de trois tarifs. Valeurs centralisées, choix transmis au formulaire existant, aucun saut lors du changement de facturation.
- IRCC : source officielle, date de consultation explicite, copie datée en repli signalée comme telle, état indisponible si les deux sources échouent.
- Garder le bilan Pathway distinct d'un résultat officiel TEF/TCF et ne pas ajouter de promesse commerciale.
- L'utilisateur autorise explicitement la création des SVG nécessaires au phare/chemin de la planche 17. Le logo reste l'asset de marque réel.
- Vérifier toutes les interactions, les liens, le formulaire sans envoyer de données, le long scroll desktop/mobile, l'absence de débordement et le mouvement réduit. Documenter les ressources réellement manquantes.

- Les références définissent la version espagnole ; le sélecteur rejoint les versions linguistiques existantes du site.
- Les pages programmes, test, inscription, tarifs, témoignages, ressources et conditions existantes restent les destinations de référence. Elles ne font pas l'objet de nouvelles maquettes.
- Le chiffre +50 et les textes des maquettes sont du contenu fourni par l'utilisateur, sans ajout de promesse commerciale.
- Le build prépare `/v4/` sans remplacer la home publique. La mise en production n'est pas demandée.

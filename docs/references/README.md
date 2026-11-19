# Références : vidéo, animation, réseaux sociaux, marketing, SEO

Ce dossier rassemble des **articles de référence** (guides publiés sur X, sauvegardés en HTML ou en Markdown) et une **liste de dépôts GitHub**, rangés par thème.

**Règle pour les agents :** quand une tâche touche à l'un de ces thèmes, lire d'abord ce sommaire, puis les références marquées ★★★ pour ce thème. Elles servent de méthode et d'idées. **Les règles de Pathway passent avant** : `MASTER.md` §13 (plan du studio), `docs/marketing/studio-video.md`, et les interdits de `MASTER.md` §15.

À savoir avant de lire :

- **Ce sont des articles d'auteurs externes**, souvent écrits pour vendre une formation, un outil ou un lien affilié. Les chiffres de vues et de revenus ne sont **pas vérifiés**.
- Les noms des modèles d'IA ont été remplacés par des niveaux génériques : `[top model]`, `[advanced model]`, `[mid model]`, `[light model]`. Le dépôt ne contient pas d'identifiant de modèle (règle de `AGENTS.md`). Pour choisir un modèle, suivre ce que l'outil utilisé propose au moment du travail.
- **Rien n'a été installé ni testé.** Avant d'installer un outil, un skill ou un serveur MCP :
  - lire son code ;
  - vérifier sa licence ;
  - ne jamais coller de clé dans le chat ;
  - ne créer de compte ou payer qu'avec l'accord de Sacha.
- Les fichiers HTML s'ouvrent dans un navigateur, images comprises. Pour un agent, il est plus simple d'en extraire le texte.

---

## Quelle référence pour quelle tâche

| Je dois… | Lire en priorité |
|---|---|
| Monter le **studio vidéo** (outils, rendu, chaîne de production) | 01, 03, 02 |
| Écrire le **brief** d'une vidéo, ou les règles du studio (`bible.md`) | 03, 04, 01 |
| Rendre une animation HTML en **MP4** (vertical 1080×1920) | 02 (script `render.py`), 01 (`seek(t)`, FFmpeg), 03 |
| Faire les **variantes** d'une pub (accroches, formats 9:16 / 1:1 / 16:9, appels à l'action) | 01 |
| Mettre en place la **relecture des images** avant le rendu (planche, contrôle qualité) | 01, 03, 04 |
| Créer un **personnage récurrent** (la mascotte phare) qui reste identique d'une vidéo à l'autre | 06 |
| Faire des **shorts racontés** (histoires, voix off, sous-titres au mot) | 07, 05 |
| Préparer le **contenu Instagram / TikTok** : tendances, accroches, analyse de concurrents | 08 |
| Préparer une **campagne** (lancement du 1er janvier : page, plan, e-mails) | 09 |
| Faire un **audit SEO** ou choisir les prochains articles | 10 |
| Choisir un **outil** (rendu, sous-titres, détourage, design…) | `outils/depots-github.md` |

---

## Motion design (vidéos en code) — `motion-design/`

### 01 · Moteur de motion design automatisé ★★★
`motion-design/01-moteur-motion-design-automatise.md`

Il décrit **comment passer d'une vidéo réussie à un système** qui produit des campagnes entières à partir d'une même base.

- **La chaîne :** brief → données structurées (`campaign.json`) → moteur d'animation → relecture des images → rendu → variantes.
- **Le principe `seek(t)` :** l'animation est une fonction du temps, donc chaque image peut être calculée seule et la vidéo est rejouable à l'identique.
- **Rendu :** Remotion ou Playwright + FFmpeg.
- **Mouvement :** ressorts calculés directement pour chaque instant ; contenant et texte animés séparément ; son calé sur la timeline.
- **Contrôle qualité en 5 passes :** storyboard, timing, taille téléphone, marque et faits, vidéo complète. Planche d'images FFmpeg.
- **Matrice de campagne :** 3 accroches × 3 formats × 2 appels à l'action = 18 fichiers. Les formats sont recomposés, pas recadrés.
- **Skill réutilisable** (`motion-campaign`) et vérification de la licence Remotion. Elle est gratuite pour les équipes de 3 personnes au plus, conditions à vérifier.

**Pour Pathway :** c'est le modèle pour la **pub principale** et ses déclinaisons. La règle « ne jamais inventer un chiffre » rejoint nos interdits sur les chiffres IRCC.

### 02 · Premiers pas en motion design ★★
`motion-design/02-premiers-pas-motion-design.html`

Un guide pas à pas pour débutants, de rien installé à un MP4 publiable.

- Deux chemins : l'application Claude sans installation, ou Claude Code.
- Un **modèle de brief en 6 lignes** et **12 formulations** pour demander des changements.
- La vidéo verticale pour Reels, TikTok et Shorts.
- Un **script `render.py`** qui transforme une page HTML animée en MP4 image par image, avec une horloge simulée pour ne perdre aucune image.
- L'ajout de musique, et **10 erreurs de débutant** avec leur correction.

**Pour Pathway :** une base rapide pour le prototype « Ronda IRCC » (15 s, vertical).

### 03 · Ce que cachent les vidéos virales « en un prompt » ★★★
`motion-design/03-ce-que-cachent-les-videos-virales.html`

L'auteur a démonté les vidéos virales. Les meilleures ne sortent pas d'un seul prompt, mais d'un **brief de production détaillé**, d'un dossier de skills et d'une longue session de travail.

- **Fonction d'image** (le principe `seek(t)`).
- **L'outillage :** Claude Code, FFmpeg, navigateur sans interface, et un `CLAUDE.md` avec un « contrat de rendu ».
- **Le brief remplace l'ambiance :** une référence visuelle pour éviter le look générique.
- **Listes d'états :** une même forme qui se transforme tout au long de l'histoire.
- **Ressorts et son** sur la même horloge.
- **Le critique :** l'agent note sa propre planche d'images et corrige les 3 pires plans.
- **Un skill**, pour que la vidéo suivante tienne en une phrase.

**Pour Pathway :** à lire avant d'écrire `bible.md` et le premier brief.

### 04 · Le motion design devient une compétence d'écriture ★★
`motion-design/04-motion-design-par-l-ecriture.html`

Une vidéo de lancement virale, démontée couche par couche. On y retrouve toujours trois choses :

- **une description claire** (ce qu'on montre, ce qu'on interdit) ;
- **une référence** (ce que ça doit faire ressentir) ;
- **une vérification** (l'agent regarde ses images et corrige).

L'article donne 6 prompts à copier, des « règles du studio » et l'ajout de la bande-son.

**Pour Pathway :** une source de prompts et de règles pour le scénariste et le relecteur.

---

## Animation et séries — `animation/`

### 05 · Studio de shorts 2.5D avec Blender ★
`animation/05-studio-shorts-2-5d-blender.html`

Il reconstitue un format viral de 65 s : une histoire vraie, des personnages 2D plats dans des décors 3D éclairés, un plan toutes les 2 s, des sous-titres de 1 à 2 mots. La production passe par Claude, qui pilote **Blender** via MCP, plus des skills open source. L'article couvre l'histoire d'abord, puis le décor, les personnages, le son et la relecture.

**Pour Pathway :** utile seulement pour un format « histoire » (par exemple l'immigration au Canada). C'est lourd (Blender, 3D) et ce n'est pas prioritaire.

### 06 · Studio de série animée (avec Picsart) ★★
`animation/06-studio-serie-animee-picsart.html`

C'est le guide en 13 étapes déjà cité dans `docs/marketing/studio-video.md`. Il enseigne à **diriger avant de rendre**.

- **Une bible** de l'univers, et une équipe de 7 sous-agents avec un réalisateur.
- **Un « passeport » du personnage**, verrouillé, pour qu'il reste identique dans chaque plan.
- **Des fiches de plan** (une action par plan), les images d'abord, puis un relecteur neuf.
- **Brouillon en 480p**, version finale en 1080p, avec le contrôle des 16 images.
- **Rythme de lancement** sur 30 jours.
- La génération passe par Picsart, **payant**, via son serveur MCP.

**Pour Pathway :** la méthode est déjà reprise dans notre plan. Le **passeport de personnage** est à utiliser pour la **mascotte phare**. Pas de Picsart sans budget validé.

### 07 · Shorts animés « niveau télé » ★
`animation/07-shorts-animes-niveau-tele.html`

Un skill externe (« video maker ») transforme un paragraphe en short vertical animé en code, avec voix ElevenLabs et sous-titres au mot.

- Il relit ses propres images et repeint les plus faibles.
- Il propose plus de 13 styles (aquarelle, encre, papier, craie, typographie animée…).

**Pour Pathway :** des idées de styles et de méthode. Le skill se télécharge depuis un site tiers : **lire son code avant tout usage**.

---

## Réseaux sociaux — `reseaux-sociaux/`

### 08 · Un « cerveau réseaux sociaux » pour Claude ★★
`reseaux-sociaux/08-cerveau-reseaux-sociaux.html`

L'article branche Claude à **Virlo**, un service tiers (MCP) qui indexe des vidéos virales TikTok, Instagram et Shorts. Il fait écrire un fichier **`voice.md`** (identité de la marque), puis propose 5 routines hebdomadaires :

1. repérer les vidéos qui sortent du lot dans la niche ;
2. décortiquer un concurrent ;
3. reprendre les accroches, formats et sons qui marchent ;
4. surveiller la niche la nuit ;
5. transformer tout ça en vidéos à tourner dans la semaine.

**Pour Pathway :** c'est le travail des agents **stratège** et **analyste** de notre plan. `voice.md` correspond à notre `bible.md`. Virlo demande un compte : décision de Sacha. On ne fait **jamais** de collecte automatique nous-mêmes sur les réseaux (protections anti-robots).

---

## Marketing — `marketing/`

### 09 · Une campagne marketing menée par des agents ★★★
`marketing/09-campagne-marketing-par-agents.html`

C'est le récit d'une campagne complète produite par une équipe d'agents :

- **le brief et ses 4 règles :** des fichiers plutôt que la mémoire, un seul public, chaque livrable avec un nom et une forme, et la règle « À VÉRIFIER » ;
- **un fichier de faits** sur le produit (« MANQUANT : … » quand une information manque) ;
- **l'analyse des pages concurrentes** ;
- **la page d'arrivée, le plan de lancement, les e-mails**, puis une relecture ;
- ce que l'auteur a corrigé avant publication ;
- le coût, et le choix du niveau d'effort et des sous-agents selon la tâche.

Prompts à copier : fichier de faits, analyse de concurrents, page d'arrivée, plan de lancement et e-mails, relecture.

**Pour Pathway :** à utiliser pour la **campagne du lancement du Campus (1er janvier 2027)** et la page d'arrivée des pubs. Le fichier de faits doit reprendre `MASTER.md` §3 (prix, promesses), jamais des chiffres inventés.

---

## SEO — `seo/`

### 10 · Prompts SEO ★★
`seo/10-prompts-seo.html`

- **Règles SEO d'un projet**, à mettre dans un fichier lu par l'agent.
- **Organisation :** le modèle le plus puissant **planifie et juge**, des modèles moins chers **lisent et extraient**. Toujours préciser le modèle de chaque sous-agent, et rejeter les retours qui devinent un chiffre.
- **Audit en équipe** à partir de l'exploration du site et des requêtes de la Search Console. Chaque page reçoit un verdict : garder, corriger le titre, corriger le contenu, fusionner, ou créer une nouvelle page.
- **5 erreurs à éviter** et l'ordre de travail conseillé.

**Pour Pathway :** pour la suite du SEO et du GEO (`MASTER.md` §13), dès que la Search Console a des données.

---

## Outils — `outils/`

### Dépôts GitHub classés par thème et par utilité ★★★
`outils/depots-github.md`

63 dépôts cités dans ces articles, rangés par thème (rendu vidéo, montage et audio, génération IA et 3D, design d'interface), avec une note d'utilité pour Pathway et une **sélection de départ pour le studio vidéo**.

---

## Ajouter une référence

1. Ranger le fichier dans le bon dossier, avec un nom clair et un numéro.
2. Retirer les noms de modèles d'IA du texte. Les liens peuvent rester tels quels.
3. Ajouter ici un résumé, une note ★ à ★★★ et la ligne « Pour Pathway », puis une ligne dans le tableau « Quelle référence pour quelle tâche ».

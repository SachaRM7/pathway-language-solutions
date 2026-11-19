# Références : vidéo, animation, réseaux sociaux, marketing, SEO

Ce dossier rassemble des **articles de référence** (guides publiés sur X, sauvegardés en HTML ou en Markdown) et une **liste de dépôts GitHub**, rangés par thème.

## Légende des modèles

Dans les copies de ce dossier, les noms des modèles d'IA sont remplacés par des étiquettes :

| Étiquette | Modèle |
|---|---|
| `[top model]` | Claude Fable 5.2 |
| `[previous top model]` | Claude Fable 5.1 |
| `[advanced model]` | Claude Opus 5.5 |
| `[mid model]` | Claude Sonnet 5.5 |
| `[light model]` | Claude Haiku 5.5 |

**Règle pour les agents :** quand une tâche touche à l'un de ces thèmes, lire d'abord ce sommaire, puis les références marquées ★★★ pour ce thème. Elles servent de méthode et d'idées. **Les règles de Pathway passent avant** : `MASTER.md` §13 (plan du studio), `docs/marketing/studio-video.md`, et les interdits de `MASTER.md` §15.

À savoir avant de lire :

- **Ce sont des articles d'auteurs externes**, souvent écrits pour vendre une formation, un outil ou un lien affilié. Les chiffres de vues et de revenus ne sont **pas vérifiés**.
- Dans les copies, les noms des modèles d'IA sont remplacés par les étiquettes de la légende ci-dessus. Ce n'est pas une règle de Pathway : les copies ont été faites par une session Claude, qui n'a pas le droit d'écrire ces noms dans un dépôt. Rien n'empêche d'ajouter les articles d'origine tels quels.
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
| Monter le **studio vidéo** (outils, rendu, chaîne de production) | 11, 13, 01, 03 |
| Faire la **pub principale** (vidéo de lancement qui montre le site et le Campus) | **13**, 11, 01 |
| Écrire le **brief** d'une vidéo, ou les règles du studio (`bible.md`, `CLAUDE.md` du studio) | 11, 12, 03, 04 |
| Choisir les **valeurs exactes** du mouvement (courbes, ressorts, durées, grille de rythme) | 11, 12, 14 |
| Rendre une animation HTML en **MP4** (vertical 1080×1920) | 11 (`render.mjs`, flou de mouvement), 12, 02 (`render.py`), 01 |
| Faire les **variantes** d'une pub (accroches, formats 9:16 / 1:1 / 16:9, appels à l'action) | 01, 12 (tous les formats et tailles) |
| Mettre en place la **relecture des images** avant le rendu (planche, contrôle qualité) | 12 (« les images fixes mentent »), 13, 01, 03 |
| Corriger une vidéo qui ne va pas (symptôme → phrase à envoyer) | 12 |
| Animer l'**interface** du site ou du Campus avec un vocabulaire commun | 14 |
| Organiser des **agents** (qui construit, qui relit, quel niveau d'effort, quel coût) | 16, 12, 09 |
| Créer un **personnage récurrent** (la mascotte phare) qui reste identique d'une vidéo à l'autre | 06 |
| Faire des **shorts racontés** (histoires, voix off, sous-titres au mot) | 07, 05 |
| Faire une vidéo « simulateur » en 3D (une journée dans un système, interface par-dessus) | 15, 17 |
| Préparer le **contenu Instagram / TikTok** : tendances, accroches, analyse de concurrents | 08 |
| Préparer une **campagne** (lancement du 1er janvier : page, plan, e-mails) | 09 |
| Faire un **audit SEO** ou choisir les prochains articles | 10 |
| Choisir un **outil** (rendu, sous-titres, détourage, design…) | `outils/depots-github.md`, 12 (boîte à outils) |

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

### 11 · Le playbook complet du motion design ★★★
`motion-design/11-playbook-complet-motion-design.html`

La référence la plus complète sur la vidéo en code.

- **12 règles** résumées au début.
- **L'échelle des prompts,** du plus simple au plus complet :
  - une ligne ;
  - un reel de marque ;
  - une liste d'états ;
  - un brief de réalisateur.
- **L'effet de chaque ligne du prompt** sur le résultat.
- **Deux façons de démarrer :** l'application Claude ou Claude Code.
- **Un `CLAUDE.md` de studio**, prêt à copier : contrat de rendu, look, son, contrôles avant de montrer.
- **Le moteur :** une page HTML et un `render.mjs` à copier, avec un flou de mouvement obtenu en moyennant des sous-images.
- **Les chiffres :** courbes, ressorts, durées en images, grille de rythme.

**Pour Pathway :** c'est la base technique du studio. On reprend son `CLAUDE.md` de studio et son renderer, adaptés à notre charte.

### 12 · Cours complet : du prompt au film ★★★
`motion-design/12-cours-complet-du-prompt-au-film.html`

Un cours long et très pratique.

- **Écrire :** une ligne contre un brief de réalisateur, et « des chiffres, pas des adjectifs ».
- **Le mouvement :** ressorts et courbes, puis l'horloge (le timing passe avant tout).
- **Une première boucle en 10 minutes**, puis le rendu MP4 et l'export pour les réseaux.
- **Contrôle qualité du mouvement :** « les images fixes mentent ». On vérifie la vidéo en mouvement, pas seulement des captures.
- **Les retouches :** formulations de retouche qui marchent, et comment utiliser son propre matériel (captures, logo).
- **Au-delà :** la 3D et Blender par script, et les équipes d'agents (qui construit, qui relit).
- **En pratique :**
  - coûts et niveau d'effort ;
  - **tous les formats et toutes les tailles** ;
  - la boîte à outils ;
  - un tableau « symptôme → phrase à envoyer » ;
  - 4 prompts.

**Pour Pathway :** le manuel à garder ouvert pendant la production, surtout pour le contrôle qualité et les corrections.

### 13 · Studio de vidéo de lancement ★★★
`motion-design/13-studio-video-de-lancement.html`

Le cours le plus proche de **notre pub principale** : une vidéo de lancement, c'est « du HTML qui bouge » (cartes d'interface, texte animé, compteurs, logo).

- **Pourquoi les promos faites par IA se ressemblent toutes**, et comment l'éviter.
- **N'installer que le nécessaire :**
  - le renderer HTML → MP4 déterministe ;
  - GSAP (SplitText, MorphSVG) ;
  - des skills de goût (timing, chorégraphie, les 12 principes de Disney appliqués à l'interface) ;
  - le son fait en code.
- **Les règles du studio**, écrites une fois. On y trouve une partie « **Product truth** » : rien que le vrai produit.
- **L'histoire d'abord :** capturer le produit, écrire un script de 40 mots, puis le découper en plans.
- **La fabrication :**
  - des blocs d'abord, des finitions faites à la main ensuite ;
  - plans d'interface cadrés serré, avec une caméra qui bouge ;
  - texte animé qui a du poids ;
  - le « chiffre preuve ».
- **La finition :** son calé sur l'image, rendu, vérification du fichier, boucle de relecture.

**Pour Pathway :** **à suivre presque pas à pas** pour la pub du lancement du Campus. Captures réelles du site et du Campus (compte de démonstration). Le « chiffre preuve » doit être un chiffre réel : une ronde IRCC datée, ou un résultat d'élève autorisé.

### 14 · Design engineering : un langage du mouvement ★★
`motion-design/14-design-engineering-langage-du-mouvement.html`

L'article montre comment monter un petit « studio de mouvement » quand on est seul entre design et code. Le modèle écrit les **jetons de mouvement** (durées, courbes, comportements), construit les prototypes et audite le travail, mais le goût reste humain. On définit d'abord le vocabulaire, une seule fois, pour que tout bouge de la même façon. L'article fournit du code et une fiche de comportements.

**Pour Pathway :** utile pour harmoniser les animations du Campus (`motion.js` / `motion.css`), du site et des vidéos, pour que la marque bouge pareil partout.

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

### 15 · Un secteur entier en « système vivant » ★
`animation/15-simulateur-systeme-vivant.html`

Des vidéos façon simulateur 3D. Exemple : un aéroport qui tourne, avec un curseur qui clique dans une interface posée par-dessus. Elles reposent sur 5 règles :

- une seule caméra, sans coupe ;
- une lumière fixe ;
- la journée écrite comme une fonction du temps ;
- une vérification que rien ne traverse rien ;
- des sous-agents qui construisent.

L'article donne tous les prompts.

**Pour Pathway :** une idée de format possible plus tard (par exemple « une semaine dans le Campus »), mais lourde. Pas prioritaire.

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

## IA en général (capacités, agents, coûts) — `ia-generale/`

### 16 · Guide complet d'un modèle avancé et de ses agents ★★
`ia-generale/16-guide-complet-modele-et-agents.html`

- **Les capacités** du modèle le plus puissant, avec les mesures et ce qu'il a construit.
- **Quand il coûte trop cher** pour ce qu'il apporte, et comment régler le **niveau d'effort**.
- **Le principe « le cerveau, pas les mains »** : le modèle puissant planifie et juge, des modèles moins chers exécutent.
- **Une installation en 3 minutes**, des règles de travail à mettre dans `CLAUDE.md` (façon de travailler, validations, comptes rendus) et 5 prompts.
- **Ses limites**, dites honnêtement.

**Pour Pathway :** pour organiser nos agents (studio vidéo, Difusión, SEO) sans gaspiller : choisir le bon modèle et le bon effort pour chaque tâche.

### 17 · Jeux, vidéos et mondes 3D : guide de terrain ★
`ia-generale/17-jeux-videos-mondes-3d.html`

Un tour de ce que des gens ont construit en quelques jours (jeux, films, scènes 3D), avec le temps et le coût qu'ils ont annoncés. L'article donne aussi ce qu'il faut retenir avant d'essayer, et l'installation sur macOS et Windows.

**Pour Pathway :** une source d'idées et des ordres de grandeur. Rien à appliquer directement.

---

## Outils — `outils/`

### Dépôts GitHub classés par thème et par utilité ★★★
`outils/depots-github.md`

63 dépôts cités dans ces articles, rangés par thème (rendu vidéo, montage et audio, génération IA et 3D, design d'interface), avec une note d'utilité pour Pathway et une **sélection de départ pour le studio vidéo**.

---

### 18 · Rétro-ingénierie avec un agent (REA) ★
`outils/18-reverse-engineering.html`

Il présente un outil open source (MCP et ligne de commande) qui permet à un agent d'expliquer **comment fonctionne une application** sans son code source : applications de bureau, sites, fichiers .NET ou Android…

---

## Ajouter une référence

1. Ranger le fichier dans le bon dossier, avec un nom clair et un numéro.
2. L'ajouter tel quel. Si c'est une session Claude qui l'ajoute, elle remplace les noms de modèles par les étiquettes de la légende.
3. Ajouter ici un résumé, une note ★ à ★★★ et la ligne « Pour Pathway », puis une ligne dans le tableau « Quelle référence pour quelle tâche ».

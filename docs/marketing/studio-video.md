# Studio vidéo Pathway : plan à traiter plus tard

Statut : **en attente**. Rédigé le 14 novembre 2026, à reprendre quand les priorités actuelles seront terminées (CRM, relances, lancement du 1er janvier).

## L'objectif

Produire chaque semaine des vidéos courtes (Reels, TikTok, pubs Instagram) qui font faire le test de niveau, avec une équipe d'agents IA qui prépare tout. Sacha valide à deux moments seulement : avant toute dépense, avant toute publication. Temps visé : environ 30 minutes par semaine pour 3 vidéos.

Les vidéos sont du **motion design fabriqué par Claude en code** : animation HTML/SVG/GSAP (ou Remotion), filmée image par image par un navigateur, puis montée avec FFmpeg. Coût de rendu : 0 €. Claude ne génère pas de vidéo réaliste (personnes, décors filmés). Pour ça, il faudrait un service de génération payant, voir « Plus tard ».

## Sources

- Liste de 20 outils : post X de @0xmovez, https://x.com/0xmovez/status/2121312707588583455
- Guide « 13 étapes » (série animée avec Claude Code + Picsart MCP) : https://x.com/0xmovez/status/2120879442008457700
- Le guide vise une série animée monétisée aux vues. Pathway gagne de l'argent par les inscriptions : on reprend la méthode, pas l'objectif.

## Les principes repris du guide

1. **Préparer avant de produire** : script → plan découpé (une action par plan) → maquette animée gratuite → brouillon → version finale. On ne paie rien tant que le brouillon n'est pas validé.
2. **Une bible** (`bible.md`) : public, ton, charte, appel à l'action, interdits. Chaque agent la lit avant de travailler.
3. **Des agents à une seule tâche**, chacun avec ses fichiers à lire, son fichier à écrire et ce qu'il ne fait jamais. Deux validations humaines : avant de dépenser, avant de publier.
4. **Un dossier qui sert de mémoire**, avec un journal (`log.md`) : chaque production, son coût, son verdict. Un bon plan non noté est un plan qu'on ne sait pas refaire.
5. **Un relecteur neuf** : une session sans mémoire du travail juge la vidéo, pas les intentions. Il ne modifie rien et conclut « bon » ou « à reprendre », avec la liste de ce qu'il faut changer.
6. **Planche de 18 images** à valider avant chaque rendu.
7. **Rythme** :
   - tout tombe sur le temps d'une musique à 120 BPM, soit un temps toutes les 0,5 s ;
   - accroche de 6 mots maximum, lisible sans le son, dans les 3 premières secondes ;
   - jamais de mouvement linéaire : petit recul avant, léger dépassement après ;
   - la dernière image est la première, pour que la vidéo boucle.
8. **Le chiffre qui compte** : la part des gens qui regardent jusqu'au bout, comparée à notre propre moyenne. Plus, grâce au CRM : tests faits et inscrits par vidéo, via l'étiquette de campagne. On ne juge pas un format sur moins de 8 vidéos.
9. **Format « coulisses »** (breakdown reel) : la vidéo finale se décompose en ses couches, puis se recompose. À garder en réserve.

## Les règles propres à Pathway

- **Charte** : couleurs de `v4/home.css` (encre `#122b26`, papier `#fffaf2`, crème `#f5efe4`, terracotta `#c76f56`, action `#a34e3b`, sauge `#cad8c3`). Polices Outfit (titres) et DM Sans (texte), locales dans `v4/assets/fonts/`.
- **Langue** : espagnol d'Amérique latine (tú) par défaut ; versions FR, EN, DE à partir du même script traduit.
- **Interdits** :
  - aucun faux témoignage, aucun faux élève ni faux prof généré par IA ;
  - jamais « garantie d'invitation » ni « certificat Pathway » ;
  - les chiffres IRCC viennent de la source officielle, avec la date de la ronde.
- **Appel à l'action** : le test de niveau gratuit, avec un lien étiqueté, par exemple `https://pathway-languages.com/test-placement.html?utm_source=instagram&utm_campaign=<nom>`. Le CRM range automatiquement le prospect en « Publicidad · <nom> ».
- **Zones sûres en 9:16** : texte à 96 px des bords, en évitant le haut (environ 200 px) et le bas (environ 300 px) cachés par l'interface d'Instagram et de TikTok.

## Les outils

| Garder | Pour quoi |
| --- | --- |
| GSAP (gratuit) ou Remotion | Animation en code (Remotion : vérifier la licence, gratuite pour les très petites structures) |
| Principes du motion design (LottieFiles motion-design-skill) | Rythme, courbes, les 12 principes |
| Lottie | Petites animations vectorielles (icônes, coches) |
| ElevenLabs (abonnement Starter déjà pris) | Voix off multilingue avec minutage mot à mot, musique, bruitages, transcription |
| WhisperX ou transcription ElevenLabs | Sous-titres des vrais témoignages |
| Openverse | Sons et musiques libres (vérifier la licence de chaque fichier) |
| FFmpeg, Playwright | Rendu et encodage (déjà disponibles dans les sessions cloud) |

Laissés de côté pour l'instant : Blender, Three.js, physique 3D, particules (inutiles pour ces formats), et les sources de revenus du guide (vues, Picsart Earn).

## Le dossier studio (à créer)

```
marketing/studio/
  bible.md        public, ton, charte, interdits, appel à l'action, rythme, zones sûres
  cast/faro/      fiche de la mascotte (si validée) : dessin vectoriel en pièces séparées
  formatos/       les modèles réutilisables (voir ci-dessous)
  piezas/<id>/    script.md, shots.md, reel.html, contact-sheet.png, reel.mp4
  log.md          chaque production : format, version, coût, verdict
.claude/agents/   les 7 fiches d'agents (le dossier .claude/agents peut être versionné)
```

## L'équipe d'agents

| Agent | Son travail | Il ne fait jamais |
| --- | --- | --- |
| Stratège | Propose 3 sujets par semaine (nouvelle ronde IRCC, astuce TEF, témoignage) | Choisir seul |
| Scénariste | Script de 15 à 30 s et plan découpé | Promettre un résultat |
| Motion designer | Anime la pièce en code, aux couleurs de Pathway, en 9:16, 1:1 et 16:9 | Sortir de la charte |
| Relecteur | Vérifie charte, chiffres, orthographe, accroche, zones sûres. Conclut « bon » ou « à reprendre » | Modifier quoi que ce soit |
| Rendu | Planche de 18 images, puis MP4. Voix ElevenLabs en annonçant le coût avant | Dépasser le budget du jour |
| Publication | Légende, lien étiqueté, horaire de publication | Publier sans l'accord de Sacha |
| Analyste | Chaque semaine : vidéos classées par visionnage complet et par inscriptions (CRM), 3 nouvelles accroches | Conclure sur moins de 8 vidéos |

Où ils tournent : les agents de production dans Claude Code (sessions cloud, avec Chromium, Playwright et FFmpeg). Les agents de suivi (stratège, publication, analyste) peuvent tourner sur AppuBot s'il est gardé après le premier mois.

## Les 4 premiers formats

1. **« Ronda IRCC »** : « La categoría de francés invitó desde 407 puntos ». Se remplit tout seul à chaque nouvelle ronde, à partir de `v4/data/ircc-rounds.json`.
2. **« Tip TEF »** : une erreur fréquente des hispanophones et sa correction, en texte animé.
3. **« Testimonio »** : extrait d'une vraie vidéo d'élève, sous-titré et habillé Pathway.
4. **« Oferta »** : le test gratuit, avec l'appel à l'action.

## La semaine type, une fois en place

1. Le stratège propose ses sujets, Sacha en choisit.
2. Le scénariste écrit, le motion designer anime, le relecteur vérifie.
3. Sacha valide la planche de 18 images. Le rendu sort les MP4.
4. Sacha valide la publication, qui part avec son lien étiqueté.
5. Fin de semaine : l'analyste fait le bilan, à partir des statistiques des réseaux et du CRM.

## Première pièce à produire (prototype)

« Ronda IRCC #452 » :
- **Format** : 15 secondes, 1080×1920, sans voix, sur une grille de 120 BPM.
- **Données** : la ronde la plus récente de `v4/data/ircc-rounds.json`.
- **Rendu** : une seule page HTML animée par une timeline GSAP en pause, positionnée image par image à 30 images par seconde par Playwright, encodée par FFmpeg en H.264.
- **Validation** : la planche de 18 images d'abord, puis la vidéo.

## Questions ouvertes

- **Mascotte** (le phare du logo, animé, qui présente les rondes) : Sacha est pour, à confirmer avec Ryan et Abdrahim.
- **Clé API ElevenLabs** : à enregistrer par le formulaire sécurisé de la session, jamais dans le chat. Configuration des droits déjà définie : Text to Speech, Transcription, Sound Effects, Musique, Génération de voix, Alignement forcé, Modèles en accès ; Doublage, Voix et Dictionnaires de prononciation en écriture ; tout le reste sans accès ; plafond de crédits ; expiration à 90 jours.

## Plus tard

- **Picsart ou un service équivalent**, pour des plans réalistes générés par IA (un décor de Montréal, par exemple) : seulement si un format le demande, avec un budget plafonné par jour. Les agents pilotent ces services ; ils ne remplacent pas leurs modèles de génération, qui tournent sur des serveurs avec des cartes graphiques puissantes.
- **Format « coulisses »**, pour montrer le savoir-faire.

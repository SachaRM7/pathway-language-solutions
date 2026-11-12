# Home V4 : suite des planches 08–17

Livraison locale du 5 octobre 2026, branche `v4`. Aperçu : http://127.0.0.1:4174/v4/. Cette extension n'a pas été redéployée sur le domaine public.

## Périmètre livré

Après le bento existant : témoignages, introduction et tarifs, résultat Pathway d'exemple, FAQ, NCLC 7, CRS, rondes IRCC, engagement, CTA final et footer. Une seule série de trois tarifs, deux états. Un seul header fixe. Les planches ne sont pas utilisées comme captures dans la page.

La V4 distante possédait des ajustements absents du checkout local (navigation V4, variantes de langue, animation du diagnostic). Ils ont été récupérés avant l'extension. Le DOM des sept sections précédentes est préservé intégralement, vérifié par SHA-256 normalisé : `218299f22e8d90376c43fcdc052af46cc6c903711799c82d0b811342cf47eb99`. Seuls les anciens emplacements de refonte des tarifs/témoignages et l'ancien footer sont remplacés après le bento. Les suppressions d'assets déjà présentes dans le worktree n'ont pas été modifiées.

## Sources et branchements

- `v4/content.js` : 8 vidéos existantes, 16 avis condensés issus de la home racine, lien Superprof réel. Les collections restent indépendantes, les compteurs utilisent leur longueur réelle.
- Tarifs : 185 / 370 / 555 CAD mensuels ; cycles 6 / 5 / 4 mois, 943,50 / 1 572,50 / 1 887 CAD. Les cycles, économies et équivalents dérivent des montants mensuels et du taux centralisé. Frais uniques de 15 CAD et règle de passage mensuel → cycle conservés.
- CTA de rythme : `/v4/inscription.html?plan=…&billing=…`. Le formulaire existant, ses champs et son fonctionnement sont conservés. Présélection URL, repli session ; aucun envoi de test.
- Conditions et confidentialité : réutilisation des pages existantes sous `/v4/` au build, sans changement de promesse ni de formulaire racine. L'engagement rejoint les vraies conditions.
- CRS : calculatrice officielle et page de critères IRCC, pas un calculateur de substitution.
- IRCC : requête sur le JSON officiel à l'ouverture, dates et scores validés, date de consultation explicite, copie officielle datée identifiée en cas d'indisponibilité du direct, aucune valeur si direct et copie échouent. Références détaillées dans `ircc-sources.md`.
- Footer : vrai logo SVG inverse, `contact@pathway-languages.com`, `+51 989 887 516`, `https://wa.me/51989887516`.
- Illustration finale : `v4/assets/phare-chemin.svg`, dessin vectoriel créé selon la planche 17 après l'autorisation explicite de générer les SVG. Le logo n'a pas été redessiné.

## Vérifications exécutées

| Contrôle | Résultat |
| --- | --- |
| `rtk npm run build` | PASS, génération du site et des routes V4 |
| `scripts/verify-v4-continuation.mjs` | PASS, 25 contrôles navigateur et ressources |
| `scripts/verify-v4-routes.mjs` | PASS, 18 contrôles des routes/formulaires/assets |
| `scripts/verify-v4-ircc.mjs` | PASS, 23 contrôles du parseur et des sources |
| `scripts/refresh-v4-ircc.mjs --check` | PASS, endpoint officiel consulté, snapshot non réécrit |
| `scripts/audit-v4-continuation.mjs` | PASS, première partie, clavier, mouvement réduit, données indisponibles et vidéo en erreur |
| Axe, desktop 1440 et mobile 390, mensuel et cycle | 0 violation détectée sur les nouvelles sections, 20 règles réussies par passage |
| Console du navigateur, chargement normal | Aucune erreur JavaScript |
| `git diff --check` | PASS |

Vérifications concrètes :

- Tarifs : changement dans les deux sens, trois cartes uniquement, hauteur identique (567,98 px desktop ; 1 875,95 px à 390 px ; 1 862,78 px à 320 px), six combinaisons correctement présélectionnées dans le formulaire.
- Témoignages : navigation sur les huit vidéos et huit paires d'avis, retour cyclique, indépendance, lecture effective d'un fichier MP4 (36,85 s), erreur récupérable avec lien vers l'original.
- FAQ : première réponse ouverte ; Enter et Espace ouvrent une autre réponse et ferment la précédente.
- Header mobile : ouverture au clavier et fermeture avec Échap. Un header fixe dans la home.
- Carrousel de niveaux : cinq états et CTA toujours clair, y compris au survol.
- Professeurs : deux permutations, intervalle observé de 2 501 ms ; deux portraits de largeur égale et aucune transformation en mouvement réduit.
- IRCC : direct, copie datée et échec total testés dans le navigateur. Scores vides lorsque les deux sources échouent, lien officiel conservé.
- Liens : les 54 liens de la home contrôlés ; toutes les routes et ancres internes existent sous `/v4/`.
- Responsive : zéro débordement horizontal à 320, 360, 390, 768, 1024, 1280 et 1440 px. Contrôle visuel de chaque nouvelle section et du long scroll desktop/mobile. Les captures sont dans `tmp/v4-continuation/`.

L'audit automatisé laisse le contraste superposé et les sous-titres vidéo en revue manuelle : ce n'est pas une certification WCAG complète. Les couleurs de texte utilisent la palette contrôlée ; le nom sur la vidéo a un fond opaque vert profond. Aucun fichier de sous-titres VTT/SRT n'est disponible dans les assets fournis. Aucun texte de sous-titrage n'a été inventé.

## Éléments réellement manquants ou non refaits

- Les URL Instagram et TikTok sont absentes du dépôt. Elles ont été demandées au propriétaire ; aucun compte fictif ni lien inactif n'est affiché. Deux champs `LINKS.social` sont prêts à les recevoir.
- L'évaluation et les programmes V4, ainsi que les guides non encore refaits, conservent leur message de refonte existant, comme autorisé. Les tarifs, l'inscription, les conditions et la confidentialité sont réellement reliés.
- Aucune page source d'avis légal ni de politique de cookies distincte n'a été trouvée. Ces deux destinations existent sous V4 avec le même message de refonte, sans inventer de texte juridique.
- Le média du premier bento reste intentionnellement le placeholder demandé.

## Convergence et direction

Anti Slop utilisé pendant l'implémentation, selon la direction existante. ENERGY 2 / RHYTHM 3 / MOTION 2. Les planches et les demandes explicites priment sur les préférences génériques du skill : trois cartes tarifaires, FAQ accordéon, footer sombre et bilan incliné sont intentionnels.

Couleurs et typographie : tokens V4, Outfit et DM Sans locaux pour la continuité. Composition : grande vidéo et deux avis, comparaison des rythmes, panels documentaires et phare final selon les planches. Espacement : conteneur existant et marges mobiles 20 px. Cartes : distinguer les rythmes et isoler les exemples. Ombre : seulement le document en relief ; aucune animation décorative supplémentaire. SVG : métaphore du phare/chemin explicitement demandée, marque réelle préservée. Les titres de section restent à 49 px maximum, sous le hero ; le CTA final reste à 58 px.

Convergence : exigence de conservation et neuf groupes fonctionnels ajoutés vérifiés, décisions de pile/data/routes/médias/responsive vérifiées ; constitution laissée de côté car modèle non rempli. L'unique tâche externe restante est T022 (liens sociaux à recevoir). T021, centralisation intégrale des montants mensuels et remises, corrigée.

### Delivery Gate Anti Slop (périmètre disponible)

- R-02 PASS : aucun tiret long ajouté à la copie ; ponctuation et intitulés de la référence conservés.
- R-03 PASS : sept largeurs contrôlées, aucun débordement ; bilan et sélecteur 320 px corrigés.
- R-17 PASS : nombres commerciaux issus du site ; données migratoires officielles datées.
- R-18 PASS : huit vidéos et seize avis existants, pas d'avatar ou de témoignage fabriqué.
- R-23 PASS : logo officiel, SVG autorisé, placeholder bento explicitement demandé.
- R-24 PASS : routes et ancres V4 vérifiées ; messages honnêtes sur les pages indisponibles.
- R-25 PASS pour les nouveaux textes UI : palette AA, nom vidéo sur fond opaque ; vérifications automatiques complétées par lecture visuelle. Sous-titres structurés non fournis, réserve ci-dessus.
- R-26 PASS : tous les contrôles ont un comportement, un lien réel ou un état désactivé ; aucun lien social fictif.
- R-27 PASS : chargement IRCC, copie datée, échec total et erreur vidéo testés.
- R-28 PASS : questions du brief liées aux rythmes, classes privées, test, examens et inscription.
- R-32 PASS : focus, clavier FAQ et menu, contrôles natifs vidéo, mouvement réduit.
- R-33 PASS : modifications écrites dans les sources ; le build ne fait que générer les pages et données rendues.
- R-34 PASS : pas de toggle de thème ; thème de marque explicitement demandé.
- R-35 PASS : build, tests des contrôles, ressources, formulaire et captures exécutés.
- R-36 PASS : pas de nouvelle promesse de résultat ni de document officiel fictif.
- R-37 PASS : direction fournie, planches et charte utilisées.
- R-38 PASS : exemples étiquetés ; sources commerciales, pédagogiques et IRCC distinguées.
- R-01 PASS : dégradés limités au faisceau/relief du phare pour retrouver la planche.
- R-04 PASS : symboles utiles aux actions, pas d'icône décorative générique ajoutée.
- R-06 PASS : polices de marque et libellés des planches, pas de remplacement typographique.
- R-07 PASS : pas de grille décorative ajoutée.
- R-08 PASS : flèches de navigation ou de destination conformes aux planches.
- R-09 PASS : labels des rythmes, exemples et sections portent une information réelle.
- R-10 PASS : pas de nouvel effet de verre.
- R-12 PASS : relief réservé au bilan d'exemple, pas d'ombre globale sur les cartes.
- R-13 PASS : pas de halos ajoutés aux contrôles.
- R-14 PASS : rythme central mis en avant, latéraux identiques, disposition demandée.
- R-19 PASS : animations existantes conservées ; FAQ native et interactions sans mouvement imposé.
- R-22 PASS : phare propre au brief, pas de bibliothèque d'illustrations génériques.
- Liveliness PASS : focalisation par section, espaces structurels, accent terracotta, motif phare/chemin, dials conservés.
- C-1 / C-3 PASS : chaque composition vient du brief, aucune section de remplissage.
- C-2 / C-4 PASS : clics, clavier, états d'échec et responsive éprouvés ; pages indisponibles signalées.
- C-5 PASS : avis et chiffres sourcés ; aucun chiffre IRCC inventé.
- R-05 / R-11 PASS : rythme des planches, rayons différenciés pour documents, panels et boutons.
- R-15 / R-16 PASS : CTA du brief et copie spécifique, pas de slogans ajoutés.
- R-20 / R-21 / R-29 / R-30 PASS : identité Pathway, palette officielle, footer sombre prescrit, aucune imitation d'un autre produit.
- R-31 PASS : raisons des choix listées dans « Convergence et direction ».

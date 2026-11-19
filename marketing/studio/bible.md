# Bible du studio vidéo Pathway

> À lire par tout agent **avant** de produire ou de relire une pièce. Les règles de `MASTER.md` (§3, §13, §15) passent avant ce fichier ; les chiffres viennent de [`faits.md`](faits.md).
> Statut : **version 1, à valider par Sacha** (19 nov. 2026).

## 1. Pour qui, pour quoi

- **Public :** un professionnel hispanophone d'Amérique latine (Pérou, Colombie, Chili, Paraguay en priorité) qui veut immigrer au Canada. Il regarde sur téléphone, souvent sans le son.
- **Un seul objectif :** lui faire faire le **test de niveau gratuit**.
- **Un seul lien**, toujours étiqueté : `https://pathway-languages.com/test-placement.html?utm_source=<réseau>&utm_medium=<format>&utm_campaign=<id de la pièce>`.

## 2. Ton et langue

- **Espagnol d'Amérique latine, simple, tutoyé** (« tú »). Phrases courtes. Pas de jargon sans explication.
- On informe avec un fait daté, puis on invite. On ne presse pas, on ne fait pas peur.
- Appel à l'action par défaut : **« Mide tu nivel gratis »**.
- Mention de fin, sur toute pièce qui parle d'immigration : **« Solo enseñamos francés; no damos asesoría migratoria. »**

## 3. Interdits

- Aucun **faux témoignage**, aucun faux élève ni faux professeur généré par IA.
- Jamais « invitación garantizada », « certificado Pathway », ni date ou résultat promis.
- **Aucune promesse migratoire.** Un chiffre IRCC décrit une ronde passée, jamais l'avenir.
- **Aucun chiffre absent de `faits.md`.** Un chiffre IRCC porte toujours le numéro et la date de sa ronde.
- Aucune donnée réelle d'élève à l'écran. Captures du Campus : compte de démonstration seulement.
- Pas d'étiquette « IA ». Pas de « gratis » ni « garantizado » pour autre chose que ce que `faits.md` confirme.
- Un vrai témoignage n'est utilisé qu'avec l'**accord écrit** de l'élève pour la publicité.

## 4. Charte

| Rôle | Couleur |
|---|---|
| Encre (texte, fonds sombres) | `#122b26` |
| Papier (fonds clairs) | `#fffaf2` |
| Crème | `#f5efe4` |
| Terracotta (le chiffre ou le mot qui compte) | `#c76f56` |
| Action (bouton, badge, texte accentué sur fond clair) | `#a34e3b` |
| Sauge (fond calme, pastilles) | `#cad8c3` |

- **Polices :** Outfit (titres, chiffres, 700–800) et DM Sans (texte), fichiers locaux de `v4/assets/fonts/`.
- **Logo :** `v4/assets/pathway-logo.svg` (fond clair) et `pathway-logo-inverse.svg` (fond sombre). Jamais redessiné, jamais seul en première image.
- **Une seule couleur d'accent par plan.** Fonds unis. Pas de dégradé décoratif, de halo, de particules.
- **Taille minimale** (cadre 1080 × 1920) : 40 px pour un texte à lire, 28 px pour une source ou une mention.
- La mascotte (le phare animé) n'est **pas encore validée** : ne pas l'utiliser comme personnage.

## 5. Formats et zones sûres

- **9:16** (1080 × 1920) pour Reels, TikTok et Stories ; **4:5** (1080 × 1350) pour le fil Instagram ; 1:1 et 16:9 à la demande. Un format est **recomposé**, jamais recadré.
- **Zones sûres en 9:16 :** texte à 96 px des bords ; rien d'important dans les 200 px du haut ni les 300 px du bas.

## 6. Rythme et mouvement

- **Grille de 120 BPM :** un temps toutes les 0,5 s (15 images à 30 i/s). Chaque coupe et chaque arrivée tombe sur un temps ou un demi-temps.
- **Accroche :** 6 mots au plus, lisible sans le son, posée dès la première image.
- **Du nouveau toutes les 2 à 4 s.** Un seul mouvement principal par plan.
- **Jamais de mouvement linéaire** sur une position : ressorts. Texte sans rebond (amortissement 1), interface 0,8, badge et bouton 0,55.
- La caméra ne s'arrête jamais (léger zoom continu). Un plan sort **poussé** par le suivant, pas en fondu.
- **Boucle :** la dernière image rejoint la première.
- Les valeurs vivent dans l'objet `MOTION` en tête de chaque pièce.

## 7. Contrat de rendu

- Chaque pièce est une page HTML qui expose **`window.seek(t)`** : l'image est une fonction du temps. Pas de transition CSS, pas de minuteur, pas de hasard non semé.
- Rendu : `node marketing/studio/motor/render.mjs <pièce>/reel.html` (options `--secs`, `--fps`, `--w`, `--h`, `--planche`, `--audio`). 30 images par seconde, H.264.
- **Coût de rendu : 0 €.** Toute dépense (voix off, musique, service payant) est annoncée et validée par Sacha **avant**.

## 8. Chaîne de production

1. `script.md` : les mots à l'écran, chacun relié à une ligne de `faits.md`.
2. `shots.md` : le plan découpé, en images à 30 i/s, une action par plan.
3. `reel.html` : l'animation.
4. **`contact-sheet.png` : la planche de 18 images. Validation n° 1 de Sacha.**
5. `reel.mp4`, puis relecture par un agent neuf (« bon » ou « à reprendre »).
6. **Validation n° 2 de Sacha avant toute publication.** Aucun agent ne publie.
7. Une ligne dans `log.md` : format, version, coût, verdict.

## 9. Grille de relecture (note sur 10, objectif : 8 partout)

Accroche dans les 2 premières secondes · lisibilité à la taille d'un téléphone · qualité du mouvement · variété · composition · fidélité à la charte · exactitude des faits (bloquant : un fait faux ou non sourcé = « à reprendre »).

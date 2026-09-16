# Pathway — prototype R2, trois parties continues

Révision de Phase 2A à partir du retour demandant à la fois une présentation de Pathway et une invitation à rejoindre son programme. Ce n’est pas une V2 finale.

## Structure

1. **0–15 s — Institut et site** : Pathway, capture réelle du site, cours privés en direct, parcours A1–B2.
2. **15–30 s — Expérience accompagnée** : entrée dans A2, exemple réel, professeur, pratique guidée et feedback.
3. **30–45 s — Objectif et premier pas** : objectif NCLC 7 / TEF–TCF, point de départ et plan, CTA d’évaluation.

Un seul espace vectoriel et un seul tracé connecté. Une fenêtre de trait avance le long de ce chemin. La caméra suit les contenus dans le même espace ; la pointe du fil reste dans le cadre. Les deux derniers segments sont les courbes originales du symbole Pathway. Le corps du phare se révèle seulement autour de 40 secondes, puis la composition finale reste stable de 41 à 45 secondes.

## Reproduction

Composition Remotion : 1920×1080, 30 fps, 1350 images. MP4 de revue : 1280×720, sans audio. Les sources restent séparées de la V1 et de la première Phase 2A.

```sh
npm ci
npm run check
node render.mjs frames
node render.mjs video
python assemble.py
```

`assemble.py` requiert Python avec Pillow, FFmpeg et FFprobe. Il extrait trois clips de 450 images puis les concatène sans réencodage supplémentaire. Le fichier de 45 secondes livré est donc réellement l’assemblage des trois fichiers de 15 secondes livrés.

Le runtime Work utilisé nécessite le préchargement du `render-compat.cjs` existant dans le workspace pour contourner un défaut d’énumération de ses interfaces réseau. Ce détail d’environnement ne concerne pas une installation locale ordinaire.

## Sources

Polices Outfit et DM Sans, leurs notices et SVG Pathway conservés du projet précédent. Capture `public/pathway-site-hero.jpg` issue de la V1, représentant la page d’accueil Pathway. Extrait pédagogique : unité A2 no 1, page 2. La capture du site intervient une seule fois ; le film n’est pas un défilement de captures.

Voir `deliverables/Pathway-R2-notes.md` et `deliverables/assets-manifest.json` pour le détail du récit, les limites de revue et les ressources. Aucun média des références vidéo n’est utilisé.

V1 et prototypes précédents conservés. Aucun son final, aucune adaptation sociale, aucune fusion de PR. Cette révision attend encore la revue créative.

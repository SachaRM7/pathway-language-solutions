# Extraits du Manuel A2

Source locale : `output/pdf/Manuel A1 Pahtway V.1.pdf`. Malgré son nom, la couverture indique « Manuel de français – niveau A2 ». Le PDF comporte 390 pages numérisées.

- Table des matières : page 2.
- Sommaire détaillé : pages 3–4, 64 unités.
- Unité 1 : pages 5–10, puis vocabulaire en haut de la page 11 ; la suite de l’unité 2 est exclue.
- Examen A : introduction en bas de la page 87, pages 88–90, production orale en haut de la page 91.
- Autoévaluation : grille du segment A au milieu de la page 91.
- Textes de compréhension orale de l’unité 1 et de l’examen : transcrits depuis l’annexe, page 97, dans la page HTML.

Les images WebP et PDF sont produits par `scripts/extract-manual-a2.py` avec PyMuPDF et Pillow. Les coordonnées de découpe sont en points PDF. La page du site est en espagnol ; les extraits et critères originaux restent en français.

## Pagination de lecture

`compose-manual-a2.py` génère la version utilisée par le lecteur et les téléchargements dans `assets/manual-a2/reader/` : 14 pages A4, sommaire A–B / C–D, unité 1 en six pages, examen A en quatre pages, puis autoévaluation. Les blocs de contenu sont conservés ; seules leurs positions et leur répartition changent. Les sources sont indiquées au pied de chaque page. Le manifeste `pages.js` alimente le lecteur et ses chapitres. Les extractions originales restent disponibles séparément et le PDF source n’est pas modifié.

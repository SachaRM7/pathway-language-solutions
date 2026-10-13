# Extraits des manuels A1, B1 et B2

Sources : `Manuel A1 - APPRENANT.pdf`, `Manuel B1 - APPRENANT.pdf` et `Manuel B2 - APPRENANT.pdf` (dossier Drive « Pathway Languages », version élève). Les PDF ne sont pas versionnés dans ce dépôt.

Contrairement au manuel A2 (PDF numérisé, voir `manual-a2-source.md`), ces manuels sont des PDF numériques : les pages sont publiées entières. Seules les pages qui mêlent deux contenus sont recadrées, à la limite repérée dans le texte de la page (couverture et table des matières de l'A1, fin du bilan B2).

| Niveau | Table des matières | Sommaire | Unité 1 | Bilan du segment A (U16, version A) |
|---|---|---|---|---|
| A1 | p. 1 (bas) – 3 | p. 4–5 | p. 6–12 | p. 98–101 |
| B1 | p. 2 | p. 3–4 | p. 6–12 | p. 97–100 |
| B2 | p. 2 | p. 3–4 | p. 6–13 | p. 110–113 (haut) |

Les segments, les titres des unités 1 à 15, la durée et la règle de décision du bilan sont lus dans le PDF au moment de la génération.

Régénérer un niveau (PyMuPDF et Pillow requis) :

```sh
python3 scripts/build-manual-level.py a1 "chemin/vers/Manuel A1 - APPRENANT.pdf"
```

Le script réécrit `assets/manual-<niveau>/` et `programas/<niveau>/index.html`. Si une nouvelle version du manuel décale les pages, ajuster les numéros dans `LEVELS` du script.

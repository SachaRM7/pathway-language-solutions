# Extraits des manuels A1, B1 et B2

Sources : `Manuel A1 - APPRENANT.pdf`, `Manuel A2 - APPRENANT.pdf`, `Manuel B1 - APPRENANT.pdf` et `Manuel B2 - APPRENANT.pdf` (dossier Drive « Pathway Languages », version élève). Les PDF ne sont pas versionnés dans ce dépôt.

Ces manuels sont des PDF numériques (depuis novembre 2026, l'A2 aussi : l'ancienne chaîne à partir d'un PDF numérisé, `manual-a2-source.md`, n'est plus utilisée) : les pages sont publiées entières. Seules les pages qui mêlent deux contenus sont recadrées, à la limite repérée dans le texte de la page (couverture et table des matières de l'A1, fin du bilan B2).

| Niveau | Table des matières | Sommaire | Unité 1 | Bilan du segment A (U16, version A) |
|---|---|---|---|---|
| A1 | p. 1 (bas) – 3 | p. 4–5 | p. 6–12 | p. 98–101 |
| A2 | p. 2 | p. 3–4 | p. 6–12 | p. 97–100 |
| B1 | p. 2 | p. 3–4 | p. 6–12 | p. 97–100 |
| B2 | p. 2 | p. 3–4 | p. 6–13 | p. 110–113 (haut) |

Les segments, les titres des unités 1 à 15, la durée et la règle de décision du bilan sont lus dans le PDF au moment de la génération.

Régénérer un niveau (PyMuPDF et Pillow requis) :

```sh
python3 scripts/build-manual-level.py a1 "chemin/vers/Manuel A1 - APPRENANT.pdf"
```

Le script réécrit `assets/manual-<niveau>/` et `programas/<niveau>/index.html`. Si une nouvelle version du manuel décale les pages, ajuster les numéros dans `LEVELS` du script.

## Extrait de l'examen dans le livre

Le site ne publie pas le bilan du segment A en entier : après la génération, les 4 pages `examen-a` sont remplacées par 3 pages composées (1 ou 2 exercices par épreuve : compréhension orale, premier document de compréhension écrite, production écrite et orale ; sans la page « Profil par compétence »), et `examen-a.pdf` et `manuel-<niveau>-extraits.pdf` sont reconstruits avec ces pages. Après une régénération, refaire cet extrait avant de publier.

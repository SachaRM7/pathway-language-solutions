# Format « Ronda IRCC »

**Idée :** à chaque nouvelle ronde de la catégorie de français, une vidéo de 15 s qui donne le score, le compare à la dernière ronde « Experiencia canadiense », rappelle la condition (NCLC 7) et invite au test.

**Fabrication (aucun chiffre saisi à la main) :**

```bash
node scripts/refresh-v4-ircc.mjs                               # 1. instantané officiel IRCC à jour
node marketing/studio/formatos/ronda-ircc/nueva-pieza.mjs      # 2. crée piezas/<date>-ronda-<n>/ (reel.html + data.js)
node marketing/studio/motor/render.mjs marketing/studio/piezas/<id>/reel.html --planche   # 3. planche de 18 images → validation
node marketing/studio/formatos/ronda-ircc/sonido.mjs marketing/studio/piezas/<id>        # 4. audio.wav (cumbia à 120 BPM + bruitages, fabriqués en code)
node marketing/studio/motor/render.mjs marketing/studio/piezas/<id>/reel.html --audio marketing/studio/piezas/<id>/audio.wav   # 5. reel.mp4 avec le son
```

- Pour voir l'animation : ouvrir `reel.html` dans un navigateur (lecture en boucle).
- Le modèle est `reel.html` de ce dossier ; chaque pièce en reçoit une copie, pour rester reproductible.
- Le script refuse de créer la pièce si le score « francés » n'est pas inférieur au score comparé.
- Le texte ne change pas d'une ronde à l'autre ; seuls les numéros, dates et scores changent.

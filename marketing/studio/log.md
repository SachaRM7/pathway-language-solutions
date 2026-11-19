# Journal du studio

Une ligne par production : ce qui a été fait, ce que ça a coûté, le verdict.

| Date | Pièce | Format | Version | Coût | Verdict |
|---|---|---|---|---|---|
| 19 nov. 2026 | `2026-10-27-ronda-452` | Ronda IRCC, 15 s, 9:16, avec son | v4 (prototype) | 0 € | v1 jugée « à reprendre » par le relecteur ; 7 retouches appliquées (voir Leçons). v3 : retours de Sacha (bouton en coup de tampon, logo sous l'adresse). Planche et MP4 prêts. **En attente de la validation de Sacha.** Chiffres IRCC à revérifier avant publication (instantané du 10 nov.). |

## Leçons

- **Flou de mouvement :** avec 4 sous-images à 30 i/s, les changements de plan laissent des images fantômes. On rend sans flou (`--sub 1`) : texte net.
- **Source IRCC :** `canada.ca` n'est pas joignable depuis la session cloud du 19 nov. La vérification du jour de publication est à faire depuis le build du site ou à la main.
- **Relecture de la v1 (agent neuf) :** contexte « Express Entry » et ronde datée dès la première image ; pas de compteur qui affiche des valeurs intermédiaires sous une étiquette de ronde (un faux score daté en cas de capture) ; au moins 2 s pour une phrase de 10 mots ; la mention légale entre tôt et reste 3 s ; dates des rondes en 40 px, encre pleine ; marge de 106 px au repos pour que le zoom reste dans les 96 px ; un seul accent par plan.
- **À trancher par Sacha :** les anneaux du fond du plan 1 (motif « phare ») : garder ou retirer.
- **Retours de Sacha sur la v2 (19 nov.) :** le bouton d'appel à l'action arrive en **coup de tampon** ; le **logo Pathway** apparaît (pop) entre l'adresse du site et la mention. À reprendre dans les prochains formats.
- **Son (demande de Sacha, 19 nov.) : « il faut que ça parle aux Latinos ».** Musique fabriquée en code (`formatos/ronda-ircc/sonido.mjs`, 0 €) : cumbia légère à 120 BPM (basse, guitare à contretemps, güiro, conga, marimba), plus les bruitages calés sur les images (battement du 407, chiffres, coches, coup de tampon). Niveau mesuré : −14 LUFS. **L'agent ne peut pas écouter le résultat : le jugement à l'oreille revient à Sacha.** Une musique ElevenLabs reste possible si le rendu paraît trop synthétique.
- **Trois versions par pièce (demande de Sacha, 19 nov.) :** `reel-muet.mp4` (sans son), `reel-effets.mp4` (bruitages seuls, au même niveau que dans le mix complet, donc plus calme : −21 LUFS) et `reel.mp4` (musique et bruitages, −14 LUFS). Les fichiers WAV ne sont pas gardés : `sonido.mjs` les refait à l'identique.

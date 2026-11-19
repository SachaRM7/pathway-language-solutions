# Fichier de faits — ce qu'une pub Pathway a le droit de dire

> Source unique des chiffres et des affirmations des vidéos. Tiré de `MASTER.md` §1 et §3 et de `v4/data/ircc-rounds.json`. **À relire par Sacha** : c'est le seul fichier qu'on ne délègue jamais entièrement.
> Règle : ce qui n'est pas ici ne passe pas à l'écran. Une information qui manque est notée **MANQUANT**, jamais devinée.
> Dernière mise à jour : 19 nov. 2026.

## 1. Rondes IRCC (Express Entry)

| Réf. | Fait | Valeur | Source |
|---|---|---|---|
| F1 | Dernière ronde « francés » connue | **n.º 452, 27 oct. 2026, 407 points** | JSON officiel IRCC (`ee_rounds_123_en.json`), **vérifié le 19 nov. 2026** |
| F2 | Dernière ronde « Experiencia canadiense » connue | **n.º 449, 15 oct. 2026, 519 points** | idem |
| F3 | Écart entre F2 et F1 | **112 points** (519 − 407) | calcul |

- ✅ **Vérifié sur la source officielle le 19 nov. 2026 :** la ronde n.º 452 reste la dernière ronde « francés ». Ronde suivante : n.º 453 (28 oct., Transport Occupations) ; aucune ronde française depuis. À refaire le jour de la publication si une nouvelle ronde est annoncée (`node scripts/refresh-v4-ircc.mjs --check`, qui fonctionne depuis la session cloud ; c'est `curl` qui échoue sur `canada.ca`).
- Formulation permise : « Puntos mínimos para recibir invitación » **dans cette ronde**, avec son numéro et sa date. Jamais « necesitas 407 puntos » ni « con francés te invitan ».

## 2. Le français et Express Entry

| Réf. | Fait | Source |
|---|---|---|
| F4 | La catégorie francophone exige le **NCLC 7 dans les 4 compétences** (compréhension orale et écrite, expression orale et écrite) | `MASTER.md` §3, vérifié IRCC le 17 nov. 2026 |
| F5 | Le niveau se prouve avec le **TEF Canada** ou le **TCF Canada** | `MASTER.md` §1 |
| F6 | NCLC 7 au TEF Canada : CO 249, CE 207, EO 310, EE 310 | `MASTER.md` §3 |
| F7 | NCLC 7 au TCF Canada : CO 458, CE 453, EO 10, EE 10 | `MASTER.md` §3 |
| F8 | Points CRS du français au NCLC 7, sans conjoint : 12 (2ᵉ langue) ou 68 (1ʳᵉ langue) ; points additionnels +25 ou +50 | `MASTER.md` §3 |

## 3. Pathway

| Réf. | Fait | Source |
|---|---|---|
| F9 | École de français en ligne ; cours particuliers en direct sur Zoom, un professeur pour un élève | `MASTER.md` §1 |
| F10 | Professeurs natifs, plan d'étude personnalisé | `MASTER.md` §1 |
| F11 | Programmes A1 → B2 ; environ 6 mois par niveau à 2 h par semaine | `MASTER.md` §1 |
| F12 | Campus : exercices, révision espacée, cours enregistrés, messagerie avec le professeur | `MASTER.md` §1 |
| F13 | **Test de niveau gratuit**, en ligne : 12–15 min (exprés) ou 25–30 min (intensif) | `MASTER.md` §3 |
| F14 | Calculateur CRS et guides gratuits ; réunion Zoom gratuite avec un professeur après le test | `MASTER.md` §3 |
| F15 | Prix : 92,50 CAD par heure hebdomadaire et par mois (185 CAD/mois à 2 h) ; inscription 15 CAD | `MASTER.md` §3 |
| F16 | Lancement du Campus : 1er janvier 2027 | `MASTER.md` en-tête |

## 4. Ce qu'on ne dit jamais

- Aucun conseil ni promesse migratoire ; aucune date ni résultat garanti.
- Pas de « certificado Pathway », pas d'« invitación garantizada ».
- Pas de délai de réponse promis.
- Les simulacres TEF/TCF en ligne **n'existent pas encore** : ne pas les montrer comme disponibles.

## 5. Manquant

- **MANQUANT :** résultats réels d'élèves utilisables en pub (nom, score, accord écrit). Rien à l'écran tant que l'accord n'est pas noté ici.
- **MANQUANT :** accord d'Elena et de Devon pour l'usage publicitaire de leur vidéo.
- **MANQUANT :** nombre d'élèves, taux de réussite, avis notés. Aucun chiffre de ce type en pub.

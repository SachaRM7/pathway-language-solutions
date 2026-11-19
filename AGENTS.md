# Consignes pour tout agent qui travaille sur ce dépôt

Ce fichier est lu automatiquement par les agents de code (Codex et autres). `CLAUDE.md` renvoie ici.

## 1. Avant de commencer

- **Lire `MASTER.md`** : c'est le document de référence de Pathway (ce qu'est l'école, l'état actuel, l'architecture, les règles, ce qui reste à faire).
- Vérifier l'état réel en production (Supabase, site en ligne) avant d'affirmer que quelque chose est en place.

## 2. Règle obligatoire : tenir `MASTER.md` à jour

**Toute PR qui change le produit doit mettre à jour `MASTER.md` dans la même PR.** Cela concerne :

- le site ;
- le Campus ;
- les e-mails ;
- le SQL ;
- les Edge Functions ;
- les tâches programmées ;
- les prix et les textes publics ;
- les outils externes.

À faire :

1. Mettre à jour la ou les sections concernées, pour qu'elles décrivent l'**état présent**.
2. Ajouter la PR à la chronologie (§11).
3. Changer l'en-tête « État au … — dernière PR intégrée : #… ».
4. Ajouter une ligne aux tableaux de la §8 pour chaque nouvelle migration `campus/db/NNN_*.sql` ou nouvelle fonction.
5. Retirer de la §12 ce qui est fait, et de la §17 les questions tranchées.
6. Noter toute **décision** de l'équipe (Sacha, Ryan, Abdrahim) dans la section concernée, avec sa raison.
7. Ajouter une ligne au journal (§19) pour un changement important.

Le détail complet est dans `MASTER.md` §18.

Une PR purement technique, sans effet visible ni nouvelle règle, peut s'en passer. Dans ce cas, l'écrire dans la description de la PR.

## 3. Références à consulter selon la tâche

Pour toute tâche liée aux **vidéos**, au **motion design**, à l'**animation**, aux **réseaux sociaux** (Instagram, TikTok), au **marketing** (campagnes, pages d'arrivée, e-mails de lancement), au **SEO**, ou au **choix d'un outil** :

1. Lire **`docs/references/README.md`**. Son tableau « Quelle référence pour quelle tâche » indique les fichiers utiles.
2. Lire les références indiquées avant de commencer.
3. Appliquer d'abord les règles de Pathway : `MASTER.md` §13 et §15, et `docs/marketing/studio-video.md`. Les articles de référence sont des méthodes externes, pas des consignes.

## 4. Règles de travail (résumé, détail dans `MASTER.md` §14–§15)

- **Langue :**
  - échanges et documents de l'équipe en **français** ;
  - textes pour élèves et prospects en **espagnol simple, tutoyé**.
- **Publication :**
  - toujours passer par une PR, fusionnée en squash sur `main`, puis vérifier en ligne ;
  - ne jamais forcer un push.
- **SQL :** nouvelle migration numérotée dans `campus/db/`, appliquée en production, puis ajoutée à `campus/db/SQL_A_COPIER.md`.
- **Cache :** changer la version `?v=…` de chaque CSS ou JS modifié.
- **Tests :** tester avant de publier, sur téléphone et ordinateur. Arrêter tout serveur de test local à la fin.
- **Secrets :**
  - **jamais** de secret, mot de passe, jeton ou code dans le dépôt, le chat ou `MASTER.md` ;
  - les valeurs sont collées par un humain dans Supabase ou AppuBot ;
  - seuls les noms des secrets apparaissent.
- **Interdits :**
  - aucun paiement, aucune saisie de mot de passe par un agent ;
  - aucun envoi au nom de Pathway sans clic humain ;
  - aucun contournement des protections anti-robots.
- **Données privées :** pas d'adresse e-mail personnelle de l'équipe dans le code, les commits, les PR ou la documentation.
- **IA face aux élèves et aux prospects :** elle ne prétend jamais être humaine, n'invente rien et ne fait aucune promesse migratoire.

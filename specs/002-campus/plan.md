# Plan : Campus Pathway

## Architecture

```
pathway-languages.com  (GitHub Pages, inchangé)
├── /, /fr/, /programas/…   site vitrine actuel
└── /campus/                application du campus (fichiers statiques, même dépôt, même workflow)
                                │
                                ▼
                        Supabase (seul nouveau service)
                        ├── Auth : comptes élèves et professeurs
                        ├── Postgres : contenu, progression, devoirs, révision
                        │   (règles RLS : chacun ne lit que ce qu'il a le droit de voir)
                        ├── Storage : audio des exercices, enregistrements des élèves
                        └── Edge Functions : rappels, pré-correction IA (phase 3)
```

- **Pourquoi le même site** : pas de sous-domaine ni d'hébergeur en plus, le déploiement GitHub Actions actuel publie aussi le campus, et rien ne change pour les pages existantes.
- **Pourquoi Supabase** : comptes, base de données, fichiers et règles d'accès dans un seul service, utilisable directement depuis le navigateur (pas de serveur à maintenir). La clé publique (« anon ») peut être dans le code : ce sont les règles RLS de la base qui protègent les données.
- **Protection du contenu** : les exercices sont en base et ne sont lisibles que par un compte élève actif. Ils ne sont pas dans le dépôt public, ni dans les fichiers servis.
- **Front** : JavaScript sans framework, comme le reste du site (modules ES, `v4/icons.js`, polices V4). On ajoutera un outil de build seulement si la taille de l'application l'exige. `scripts/build-campus.mjs` copie `campus/` dans `dist/client/campus/` et vérifie ses marqueurs, comme les autres scripts de construction.

## Coûts estimés

| Poste | Démarrage | En production |
|---|---|---|
| GitHub Pages | 0 | 0 |
| Supabase | Offre gratuite (projet mis en pause après une semaine sans activité, pas de sauvegarde quotidienne) | Offre Pro, environ 25 USD/mois : sauvegardes quotidiennes, pas de pause |
| E-mails (connexion, rappels) | Offre gratuite d'un service SMTP (Resend, Brevo…) | Idem tant que le volume reste faible |
| IA de correction (phase 3) | — | Paiement à l'usage ; quelques dollars par mois au volume actuel, à mesurer avant d'activer |

Les tarifs sont ceux affichés publiquement ; ils sont à confirmer au moment de l'inscription.

## Contenu : méthode de travail pour Sacha

1. Claude rédige un brouillon d'exercices pour une unité à partir du manuel (8 à 12 exercices, explications en espagnol, cartes de révision).
2. Sacha relit, corrige et valide avec Ryan et Abdrahim (environ 20 à 30 minutes par unité).
3. Le contenu validé est importé en base (statut « validé ») et devient visible des élèves.

À 1 h par jour, 5 jours par semaine, on peut valider à peu près 10 unités par semaine : le segment A de l'A2 prend environ 2 semaines, l'A2 complet environ 6 à 7 semaines. C'est suffisant pour la phase 1. Les quatre niveaux prendront plusieurs mois ; on les ouvre au fil de l'eau.

**Besoin** : les manuels sources. Les PDF A1, B1 et B2 sont numériques (texte extractible). L'A2 est un PDF numérisé : sa source Word, si elle existe, ferait gagner beaucoup de temps. Ils ne doivent pas être versionnés dans ce dépôt public.

**Audio** : les textes de compréhension orale sont enregistrés par Ryan et Abdrahim (téléphone, pièce calme), ou par une synthèse vocale de qualité validée par l'équipe. La voix du navigateur sert uniquement au prototype.

## Phases

| Phase | Contenu | Livrable visible |
|---|---|---|
| 0 | Spécification, prototype, choix validés | `prototipos/campus.html` (fait) |
| 1 — Base | Supabase, connexion, rôles, tableau de bord élève, moteur d'exercices, segment A de l'A2, XP, séries, badges, devoirs, vue professeur, lien depuis le site | Les élèves A2 font leurs devoirs dans le campus |
| 2 — Profondeur | Révision espacée, erreurs de cours, simulacres TEF, rappels e-mail, A2 complet puis autres niveaux | Préparation TEF dans le campus |
| 3 — Premium | Productions écrites et orales, correction et pré-correction IA, statistiques, éventuellement paiement en ligne | Offre qui justifie une hausse de prix |

## Ce que Pathway doit créer (Claude ne peut pas le faire)

- Le projet Supabase (compte au nom de Pathway), puis transmettre l'URL du projet et la clé publique « anon ». La clé secrète « service_role » ne doit jamais être mise dans le dépôt.
- Un compte d'envoi d'e-mails et la vérification du domaine `pathway-languages.com` pour l'envoi.
- La liste des élèves à inviter (nom, e-mail, niveau, professeur).

## Risques

- **Contenu en retard sur le code** : on ouvre le campus unité par unité. Le prototype montre que 8 exercices bien faits suffisent à rendre une unité utile.
- **Adoption** : les devoirs donnés en cours sont le moteur principal. Les professeurs doivent y renvoyer systématiquement.
- **Données personnelles** : peu de données (nom, e-mail, progression). Mettre à jour la politique de confidentialité avant l'ouverture, et choisir une région Supabase au Canada si elle est proposée.

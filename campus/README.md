# Campus Pathway

Espace élève et professeur, publié sous `https://pathway-languages.com/campus/` (non indexé, accès sur invitation).
Le code est dans ce dossier ; la base de données et les comptes sont dans le projet Supabase « Pathway » (région Canada Central).

| Fichier | Rôle |
|---|---|
| `index.html`, `campus.css`, `app.js` | L'application (élève + professeur), sans outil de build |
| `config.js` | Adresse du projet Supabase et clé publique (publishable). Jamais de clé secrète ici. |
| `db/001_init.sql` | Tables, règles d'accès (RLS), calcul des XP et des séries, contenu de l'unité 1 de l'A2 |
| `db/002_weekly_challenge.sql` | Défi de la semaine (5 jours de pratique, +50 XP) et objectif de groupe |

`scripts/build-campus.mjs` copie le dossier dans le site à la construction (sans `db/` ni les `.md`), refuse de publier si `config.js` contient autre chose que la clé publique, et ajoute le lien d'accès (« Acceso alumnos », « Espace élève », « Student area », « Kursbereich ») dans l'en-tête de chaque page du site, dans sa langue.

Les professeurs et l'admin peuvent passer en vue « Alumno » (bouton en haut) pour utiliser le campus comme un élève avec leur propre compte.

## Mise en route (une seule fois)

### 1. Créer la base

Supabase → **SQL Editor** → **New query** → coller tout le contenu de `db/001_init.sql` → **Run**.
Puis une nouvelle requête avec `db/002_weekly_challenge.sql` → **Run**.
Le message attendu est « Success. No rows returned ». Chaque script ne s'exécute qu'une fois, dans l'ordre des numéros.
Sans le 002, le campus fonctionne et affiche la carte « Repaso » à la place du défi de la semaine.

### 2. Régler la connexion

Supabase → **Authentication** :

- **Sign In / Providers** → désactiver **Allow new users to sign up**. Seules les personnes invitées par Pathway peuvent entrer.
- **URL Configuration** → **Site URL** : `https://pathway-languages.com/campus/`. Ajouter la même adresse dans **Redirect URLs**.
- **Emails** → modèle **Magic Link** : ajouter la ligne `Tu código: {{ .Token }}`. L'élève peut ainsi taper le code dans le campus si le lien s'ouvre dans un autre navigateur (fréquent sur téléphone). Supabase ne permet de modifier les modèles qu'une fois un SMTP personnalisé branché (étape 3) : à faire à ce moment-là, en traduisant aussi les e-mails en espagnol.

### 3. Envoi des e-mails

Le service d'e-mail fourni par défaut par Supabase n'envoie qu'aux membres de l'équipe du projet, avec quelques messages par heure. Il suffit pour vos propres tests.
Avant d'inviter des élèves, brancher un service d'envoi : Supabase → **Authentication** → **Emails** → **SMTP Settings** (par exemple Resend ou Brevo, offre gratuite, domaine `pathway-languages.com` à vérifier chez eux).

### 4. Créer les comptes

Supabase → **Authentication** → **Users** → **Add user** → **Send invitation**, avec l'adresse e-mail.
Le profil est créé automatiquement. Ensuite, dans **SQL Editor**, régler le rôle, le nom et le professeur :

```sql
-- Sacha : administrateur (voit tous les élèves et le contenu)
update public.profiles set role = 'admin', full_name = 'Sacha'
where id = (select id from auth.users where email = 'ADRESSE_DE_SACHA');

-- Un professeur
update public.profiles set role = 'teacher', full_name = 'Ryan'
where id = (select id from auth.users where email = 'ADRESSE_DE_RYAN');

-- Un élève : nom, niveau et professeur
update public.profiles set full_name = 'Valentina Rojas', level = 'A2',
  teacher_id = (select id from auth.users where email = 'ADRESSE_DE_RYAN')
where id = (select id from auth.users where email = 'ADRESSE_DE_L_ELEVE');
```

Un écran d'administration remplacera ces requêtes (tâche T012 de `specs/002-campus/tasks.md`).

## Publier une unité

Les exercices arrivent en **brouillon** : les élèves ne les voient pas.
Dans le campus, un professeur ou l'admin ouvre **Contenido**, clique sur **Probar** pour faire la leçon en vue préalable (rien n'est enregistré), puis sur **Publicar**.

## Ce que fait la base

- Les élèves ne lisent que leurs propres données ; un professeur ne voit que ses élèves ; l'admin voit tout.
- Les XP, la série, les badges et les devoirs rendus sont calculés côté base, dans `finish_lesson` et `review_card` : un élève ne peut pas s'attribuer des points.
- La série compte un jour quand l'objectif quotidien est atteint, dans le fuseau horaire de l'élève. Un protecteur est gagné tous les 7 jours (2 au maximum) et sauve un jour manqué.
- Les erreurs d'une leçon et celles que le professeur note en cours deviennent des cartes de révision espacée.

## Tests

Le schéma et l'application ont été testés de bout en bout sur un PostgreSQL local avec les mêmes rôles que Supabase (`anon`, `authenticated`) : règles d'accès, onboarding, leçon complète avec erreurs, révision, vue professeur (publication, devoir, erreur de cours, prochain cours). Les scripts de test ne sont pas versionnés pour l'instant.

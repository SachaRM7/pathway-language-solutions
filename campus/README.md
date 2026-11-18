# Campus Pathway

Espace élève et professeur, publié sous `https://pathway-languages.com/campus/` (non indexé, accès sur invitation).
Le code est dans ce dossier ; la base de données et les comptes sont dans le projet Supabase « Pathway » (région Canada Central).

| Fichier | Rôle |
|---|---|
| `index.html`, `campus.css`, `app.js` | L'application (élève + professeur), sans outil de build |
| `tour.js` | Tutoriels de l'élève et du professeur : écran flouté, zone encadrée, explication en espagnol. Chacun s'ouvre seul la première fois et se rejoue avec le bouton « ? » en haut de l'écran (souvenir gardé dans le compte, voir `db/007_tutorial.sql`) |
| `config.js` | Adresse du projet Supabase et clé publique (publishable). Jamais de clé secrète ici. |
| `db/001_init.sql` | Tables, règles d'accès (RLS), calcul des XP et des séries, contenu de l'unité 1 de l'A2 |
| `db/002_weekly_challenge.sql` | Défi de la semaine (5 jours de pratique, +50 XP) et objectif de groupe |
| `db/003_invitations.sql` | Invitations préparées depuis le Campus : nom, niveau, rôle et professeur appliqués à la création du compte |
| `../supabase/functions/invite-student/` | Edge Function qui envoie l'e-mail d'invitation (réservée aux professeurs et à l'admin) |
| `db/004_admin_members.sql` | Carte « Miembros » réservée à l'admin : modifier nom, niveau, professeur, type de compte ; supprimer un compte et ses données |
| `../supabase/templates/` | E-mails « Invite user » et « Magic link » en espagnol, à la charte du Campus (`EMAILS_A_COPIER.md`) ; logo servi par `campus/email/logo.png` |
| `db/005_content_editor.sql` | Éditeur de contenu dans « Contenido » (professeurs et admins) : unités et exercices des 7 types |
| `db/006_progression.sql` | Progression : unité suivante ouverte à partir de 75 % de bonnes réponses, nouvel essai 24 h après un échec, reprise d'une unité commencée |
| `db/007_tutorial.sql` | Tutoriels : le compte garde quels tutoriels (élève, professeur) ont été vus |
| `db/008_horarios.sql` | Groupes et horaires fixes : « Prochain cours » calculé depuis l'horaire, changements demandés par le professeur et validés par l'admin, documents du programme par niveau (« Mi curso ») |
| `db/009_zoom.sql` | Suivi Zoom : heure réelle de chaque cours, enregistrements rangés automatiquement (« Tus clases grabadas » pour l'élève, « Últimas clases » pour l'équipe), réunions Zoom sans groupe |
| `../supabase/functions/zoom-webhook/` | Edge Function qui reçoit les avis du compte Zoom Pathway (signature Zoom vérifiée) |
| `db/010_integridad.sql` | Sorties d'onglet pendant une question d'unité : comptées, montrées à l'élève et au professeur. Copie, clic droit et impression bloqués dans une leçon ; contenu flouté quand l'élève s'absente |
| `db/011_informe.sql` | Rapport du lundi envoyé aux admins (cours prévus, tenus sur Zoom, enregistrés, retards, changements en attente, élèves inactifs, sorties d'onglet), programmé avec pg_cron |
| `../supabase/functions/weekly-report/` | Edge Function qui compose et envoie ce rapport avec Resend, une fois par semaine au plus |
| `db/012_fin_nivel.sql` | Fin de niveau : examen validé par le professeur, puis examen final du Campus ; passage automatique au niveau suivant |
| `db/013_asistencia.sql` | Présences par le bouton « Entrar a la clase » (lien ouvert N min avant, absent après N min, palier « tarde » optionnel) et rappel e-mail avant chaque cours ; règles réglées par l'admin dans « Horarios » |
| `../supabase/functions/class-reminders/` | Edge Function qui envoie les rappels avec Resend (appelée toutes les 5 min par pg_cron) |
| `db/014_cron_secreto.sql` | Secret partagé (Vault) envoyé par pg_cron et vérifié par `weekly-report` et `class-reminders` : un appel extérieur est refusé |
| `db/025_mensajes.sql` | « Mensajes » : une conversation par élève avec son professeur (et les admins), limites anti-spam, « Necesita respuesta » dans la cloche et « Por revisar », e-mails groupés (via `class-reminders`), réglage « Respuestas del asistente » (brouillons à envoyer ou réponses directes) |
| `../supabase/functions/campus-assistant/` | Edge Function facultative : l'assistant (Claude Haiku) prépare la réponse aux questions pratiques avec les seules données de l'élève (lues avec sa session) et passe au professeur ce qu'il ne sait pas ou ce que le professeur décide. `logic.ts` : la partie pure (contexte, prompt, validation, décision), testable sans réseau |
| `db/SQL_A_COPIER.md` | Tous les blocs SQL et le code de la fonction, prêts à copier-coller |

`scripts/build-campus.mjs` copie le dossier dans le site à la construction (sans `db/` ni les `.md`), refuse de publier si `config.js` contient autre chose que la clé publique, et ajoute le lien d'accès (« Acceso alumnos », « Espace élève », « Student area », « Kursbereich ») dans l'en-tête de chaque page du site, dans sa langue.

L'équipe a deux espaces : « Profesor » (l'enseignement) et, pour les admins, « Admin » (la gestion), choisis avec le sélecteur en haut ; le campus retient le dernier utilisé. Un professeur qui n'est pas admin n'a pas de sélecteur. Pour voir le campus comme un élève, on se connecte avec un compte élève de test.

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

Une fois `003_invitations.sql` exécuté et la fonction `invite-student` déployée (voir `db/SQL_A_COPIER.md`), tout se fait depuis le Campus : onglet **Cuentas** → **Invitar a un alumno** (correo, nombre, nivel, profesor). L'admin peut aussi inviter un professeur (« Tipo de cuenta : Profesor »). La personne reçoit un e-mail ; à son arrivée, son nom, son niveau et son professeur sont déjà configurés, et l'onboarding les reprend.

Un professeur invite uniquement pour lui-même ; l'admin choisit le professeur. Si l'adresse a déjà un compte, le profil est mis à jour immédiatement. Une invitation non acceptée peut être renvoyée ou annulée depuis la liste « Invitaciones ».

Sans la fonction, l'invitation est quand même enregistrée : on peut envoyer l'e-mail depuis Supabase → **Authentication** → **Users** → **Add user** → **Send invitation**, et le profil sera configuré pareil.

Pour modifier ou supprimer un compte ensuite, l'admin utilise la carte **Miembros** de l'onglet Cuentas (après `004_admin_members.sql`) : plus besoin de passer par Supabase.

Le premier administrateur se crée une fois pour toutes en SQL :

```sql
update public.profiles set role = 'admin', full_name = 'Sacha'
where id = (select id from auth.users where email = 'ADRESSE_DE_SACHA');
```

## Espace « Alumno »

Cinq onglets : **Inicio**, **Mi ruta**, **Repasar**, **Simulacros** et **Mi curso** (ce dernier dès que l'élève a un horaire, des documents ou un engagement signé). **Mensajes** est l'icône de conversation en haut, avec le nombre de messages non lus ; **Logros** (niveau, XP, insignes) s'ouvre depuis « Mi cuenta » (l'avatar) et depuis « Mis logros » sur la carte « Camino al NCLC 7 ». Le « i » à côté de chaque titre explique l'onglet en quelques étapes, comme pour l'équipe.

## Espace « Profesor »

Seulement ce qui sert à enseigner. Un admin qui enseigne n'y voit que ses élèves et ses cours ; un admin qui n'enseigne pas les voit tous. Dans Inicio, Alumnos et Tareas, un filtre « Mis alumnos / Todos los alumnos » (admins qui ont des élèves) choisit les élèves affichés : les siens (dont il est le professeur, ou qui sont dans un de ses groupes) ou tous. Le choix est retenu sur l'appareil.

- **Inicio** : le rapport de fin de cours (unités vues, qui s'ouvrent pour l'élève : `db/018_informe_clase.sql`), les chiffres de la semaine, les élèves à relancer et « Por revisar » (messages, informes, justificatifs, examens à valider). Pour un admin, la dernière ligne ouvre l'espace Admin s'il y a des tâches en attente.
- **Alumnos** : l'avance de chaque élève, ses absences (justificatifs à accepter, rattrapages à programmer, mois non validés : `db/017_reglas_clases.sql`) et la validation de fin de niveau.
- **Mensajes**, **Tareas** : les conversations avec les élèves ; assigner une unité et noter une erreur entendue en cours.
- **Horarios** : ses élèves, leurs horaires fixes et la demande de changement d'un cours (appliquée directement pour un admin).
- **Contenido** et **Cuentas** : seulement pour un professeur qui n'est pas admin (voir les unités, inviter ses élèves). Les admins les trouvent dans l'espace Admin.

## Espace « Admin »

La gestion, regroupée par métier dans la barre latérale ; le compteur rouge d'un onglet dit ce qui attend quelqu'un. Un point rouge sur « Admin » dans le sélecteur signale une tâche urgente quand on est dans un autre espace.

- **Inicio (bandeja)** : une ligne par tâche, dite simplement (qui, quoi) avec un bouton qui ouvre le bon endroit, en trois blocs : « Urgente » (en retard, un élève ou un intéressé qui attend, un cours imminent), « Por hacer » (par métier) et « Hecho » (ce que l'équipe a fait ces 7 derniers jours et qui l'a fait : `db/033_actividad_admin.sql`).
- **Ventas** : **Captación** (Prospectos, WhatsApp, **Correo**, Difusión) et **Inscripciones** (solicitudes du site, invitations, comptes et formules).
  - **Correo** (`db/035_correo.sql`, fonction `mail`) : la boîte Zoho de l'équipe, lue toutes les 2 minutes (IMAP). Seuls les e-mails de vraies personnes arrivent (pas les newsletters, notifications, rebonds, réponses automatiques ni nos propres adresses), rangés par conversation et reliés à la fiche Prospectos ou Difusión de la personne. Chacun reçoit un brouillon de réponse de l'IA. L'équipe choisit « Enviar desde » (ryan@, abdrahim@, contacto@ ou contact@ ; la signature suit), relit, puis « Enviar » deux fois : la réponse part par Zoho (SMTP) dans le même fil et est rangée dans les « Envoyés » de Zoho.
  - **Prospectos** : après le test de niveau, 3 e-mails partent tout seuls (5 à 10 minutes après le test, puis à 2 jours et à 5 jours ; `db/029`, `db/040`) : le résultat et les points à travailler, puis l'invitation à compléter le test par une réunion Zoom avec un professeur (partie orale, objectif, date de début, cours et Campus, inscription, tarifs). Le bouton mène à `disponibilidad.html`, où la personne coche ses moments libres : la fiche les affiche (« Disponibilidades »), les relances s'arrêtent et la tâche « Proponer la reunión por Zoom » apparaît en « Urgente » (`db/037_reunion_test.sql`). La fiche montre où ils en sont (« Correos del test ») et la tâche de l'équipe n'arrive que le lendemain du 3e : « Si no respondió a los correos automáticos, escribirle » (`db/036_seguimiento_test.sql`). Une réponse par e-mail arrête les relances et demande de répondre dans « Correo ».
  - **Difusión** : même liste « Desde » pour l'envoi d'un brouillon de démarchage.
- **Escuela** : **Clases** (cours particuliers : « Programar a un alumno » fixe son professeur, son lien Zoom personnel gardé toute la formation et ses jours et heures ; les changements à valider, les élèves sans horaire avec un bouton « Programar », les réunions Zoom sans élève). En base, chaque élève reste un « groupe » d'une personne (`class_groups`) et **Programa** (les unités et les documents du programme ; un manuel s'ouvre unité par unité au fil des cours : `db/020_manual.sql`).
- **Configuración** : **Ajustes** (règles d'assistance, rappel avant les cours, contrat de l'élève `db/015_contrato.sql`, ouverture des unités, réponses de l'assistant, accès des assistants IA, e-mails de test).

Chaque espace a son tutoriel (bouton « ? »), ouvert tout seul la première fois (`db/034_tutorial_admin.sql`).

## Publier une unité

Les exercices arrivent en **brouillon** : les élèves ne les voient pas.
Dans le campus, un professeur ouvre **Contenido** (un admin : espace Admin → **Programa**), clique sur **Probar** pour faire la leçon en vue préalable (rien n'est enregistré), puis sur **Publicar**.

## Ce que fait la base

- Les élèves ne lisent que leurs propres données ; un professeur ne voit que ses élèves ; l'admin voit tout.
- Les XP, la série, les badges et les devoirs rendus sont calculés côté base, dans `finish_lesson` et `review_card` : un élève ne peut pas s'attribuer des points.
- La série compte un jour quand l'objectif quotidien est atteint, dans le fuseau horaire de l'élève. Un protecteur est gagné tous les 7 jours (2 au maximum) et sauve un jour manqué.
- Les erreurs d'une leçon et celles que le professeur note en cours deviennent des cartes de révision espacée.

## Tests

Le schéma et l'application ont été testés de bout en bout sur un PostgreSQL local avec les mêmes rôles que Supabase (`anon`, `authenticated`) : règles d'accès, onboarding, leçon complète avec erreurs, révision, vue professeur (publication, devoir, erreur de cours, prochain cours). Les scripts de test ne sont pas versionnés pour l'instant.

# MASTER — Pathway Language Solutions

> **Le document de référence de Pathway** : ce qu'est l'école, comment elle fonctionne, ce qui est en ligne, ce qui reste à faire et où l'on va.
> À lire en premier par toute personne (ou tout assistant IA) qui rejoint le projet.
>
> **État au 19 novembre 2026** — dernière PR intégrée : #155 (parcours A1 → B2 dans Mi ruta).
> **🚀 Lancement du Campus : 1er janvier 2027.** Ce qu'il reste à faire avant cette date : [§12](#12-en-cours-en-attente-à-faire).
> **Prochain grand chantier :** publicités vidéo et réseaux sociaux ([§13](#13-vision-et-backlog)).
> Règles de mise à jour : [section 18](#18-comment-tenir-ce-document-à-jour). Historique des mises à jour : [section 19](#19-journal-des-mises-à-jour).

## Sommaire

1. [Pathway en bref](#1-pathway-en-bref)
2. [Équipe et rôles](#2-équipe-et-rôles)
3. [Offre, prix et promesses](#3-offre-prix-et-promesses)
4. [Le parcours complet d'un élève](#4-le-parcours-complet-dun-élève)
5. [Le site public](#5-le-site-public)
6. [Le Campus](#6-le-campus)
7. [Automatismes : e-mails et tâches programmées](#7-automatismes--e-mails-et-tâches-programmées)
8. [Architecture technique](#8-architecture-technique)
9. [Outils et comptes externes](#9-outils-et-comptes-externes)
10. [État actuel en production](#10-état-actuel-en-production)
11. [Chronologie](#11-chronologie)
12. [En cours, en attente, à faire](#12-en-cours-en-attente-à-faire)
13. [Vision et backlog](#13-vision-et-backlog)
14. [Règles de travail](#14-règles-de-travail)
15. [Sécurité et éthique](#15-sécurité-et-éthique)
16. [Pièges connus et leçons apprises](#16-pièges-connus-et-leçons-apprises)
17. [Questions ouvertes et dette technique](#17-questions-ouvertes-et-dette-technique)
18. [Comment tenir ce document à jour](#18-comment-tenir-ce-document-à-jour)
19. [Journal des mises à jour](#19-journal-des-mises-à-jour)

---

## 1. Pathway en bref

**Pathway Language Solutions** est une **école de français en ligne** : des **cours particuliers en direct sur Zoom**, pour des **Latino-Américains hispanophones** qui veulent immigrer au **Canada**.

- **Objectif central : le NCLC 7.** C'est le seuil linguistique qui rapporte des points dans **Express Entry**, et qui ouvre la catégorie « francophone ». On l'atteint avec le **TEF Canada** ou le **TCF Canada**. Le **TEFAQ** (Québec) est aussi couvert.
- **Public :**
  - pays visés en priorité : **Pérou, Colombie, Chili, Paraguay**. Mexique, Bolivie, Argentine, Équateur et Venezuela sont aussi concernés ;
  - profil type : un professionnel hispanophone qui arrive par une pub Instagram ou Facebook, souvent sur Android ou PC.
- **Format :** un professeur pour un élève. Chaque élève a **un lien Zoom personnel, le même pendant toute sa formation**. Ses cours sont enregistrés et retrouvés dans le Campus.
- **Programmes A1 → A2 → B1 → B2** (CECRL). Un **cycle = un niveau**. Il faut environ 6 mois par niveau à 2 h par semaine.
- **Ce qui différencie Pathway :**
  - **contenu en espagnol**, factuel et vérifié (guides NCLC 7, TEF vs TCF, points CRS, délais), sur un marché latino moins encombré que le marché francophone ;
  - **professeurs natifs**, plan d'étude personnalisé ;
  - **un Campus propre à l'école** : parcours d'exercices, révision espacée, cours enregistrés, messagerie avec le professeur, contrat d'engagement ;
  - **une équipe outillée** : CRM, boîtes WhatsApp et e-mail avec brouillons IA relus par un humain, agenda, réunions automatisées.
- **Langues :** site en **espagnol** par défaut, plus **français, anglais, allemand**. Campus et e-mails aux élèves en **espagnol simple et tutoyé**. L'équipe travaille en **français**.
- **Domaine :** `pathway-languages.com` — Campus : `pathway-languages.com/campus/`.

---

## 2. Équipe et rôles

| Personne | Rôle | Ce qu'elle fait |
|---|---|---|
| **Sacha** | Propriétaire, décideur, admin du Campus | Pilote le produit, les comptes (Supabase, Cloudflare, GitHub, Meta, Zoom, Zoho, Google Search Console, AppuBot) et les assistants IA. Ne donne pas cours (aucun élève attribué). Travaille souvent depuis un téléphone, en français. |
| **Ryan** | Admin et professeur | Relation commerciale : premier contact, Messenger, WhatsApp, pubs (témoignages). Signe les e-mails de démarchage (`ryan@`). A des élèves. A fixé les règles de correction des exercices et la ligne des e-mails du test. A acheté le numéro canadien chez Twilio. |
| **Abdrahim** | Admin et professeur | Cours, réunions avec les prospects (`abdrahim@`). Les tests Zoom du 17 nov. ont été faits sur son compte. |

- **Les trois sont admins** dans le Campus. Il n'y a pas encore de professeur non admin, mais le Campus le prévoit (droits réduits : ses élèves seulement).
- Ryan et Abdrahim sont moins à l'aise avec les outils que Sacha : l'espace Admin est pensé pour eux (une ligne = une tâche = un bouton, aides « i », tutoriel).
- **Règle d'équipe :** personne ne répond deux fois à la même personne. Le bloc « Hecho » de la Bandeja montre qui a fait quoi.
- **Assistants IA de l'équipe** (bots AppuBot branchés au Campus par MCP) : Admisiones, Difusión, et d'autres rôles prévus (Seguimiento, Gestión, Marketing, Secretaría). Voir [§9](#appubot-bots-ia-de-léquipe).

---

## 3. Offre, prix et promesses

### Rythmes et prix (source : `inscription.html` / `v4/content.js`)

| h/semaine | Formule | Prix mensuel | Cycle complet (−15 %) | Durée d'un cycle | A1 → B2 |
|---|---|---|---|---|---|
| 2 h | Esencial | 185 CAD | 943,50 CAD | 6 mois | ~24 mois |
| 3 h | Acelerado | 277,50 CAD | 1 179,50 CAD | 5 mois | ~20 mois |
| 4 h | Acelerado | 370 CAD | 1 572,50 CAD | 5 mois | ~20 mois |
| 5 h | Intensivo | 462,50 CAD | 1 572,50 CAD | 4 mois | ~16 mois |
| 6 h | Intensivo | 555 CAD | 1 887 CAD | 4 mois | ~16 mois |

- **92,50 CAD par heure hebdomadaire et par mois.** Paiement en CAD. Les montants en monnaie locale sont indicatifs.
- **Frais d'inscription :** 15 CAD, une seule fois.
- **Remises :**
  - −15 % pour un cycle complet payé à l'inscription. C'est un tarif **non remboursable**, en échange de l'engagement d'aller au bout du cycle ;
  - −10 % pour un cycle pris après un premier mois.
- **Mode « urgent »** (examen proche) : l'équipe recommande le rythme, le prix est donné après confirmation.
- **Une demande d'inscription ne réserve aucun horaire** tant que Pathway n'a pas confirmé par écrit.

### Gratuit

- Le **test de niveau** (12–15 min en exprés, 25–30 min en intensif).
- Le **calculateur CRS**, les guides.
- La **réunion Zoom personnalisée avec un professeur** après le test. Elle complète le test (partie orale) et permet de parler objectif, date de début, cours et tarifs.

### Règles des cours (contrat « Tu compromiso », SQL 017)

- **Formule mensuelle** (mois de 4 semaines) ou **cycle**.
- **Absence justifiée :** prévenir 48 h avant, ou envoyer un justificatif sous 72 h. Elle donne droit à un rattrapage.
- **3 absences injustifiées sur 4 semaines = mois non validé.**
- Le contrat est signé à la fin de l'onboarding du Campus. Une nouvelle signature est demandée si le texte change.
- `condiciones.html` décrit l'engagement NCLC 7 : projection B1, évaluation B2, consolidation de 4 mois.

### Ce que Pathway ne promet pas

- **Aucun conseil en immigration** (« Solo enseñamos francés; no damos asesoría migratoria »).
- **Aucune date garantie.** Depuis le 18 nov., le résultat du test et ses e-mails ne donnent **ni date, ni rythme, ni prix**. C'était une demande de Ryan.
- Les estimations (niveau du test, NCLC des simulacres) sont **indicatives**, à confirmer par un professeur.
- **Aucun délai de réponse promis** dans la messagerie.
- **Rien d'inventé** dans les brouillons IA.

### Chiffres officiels utilisés (vérifiés sur IRCC le 17 nov. 2026)

- **NCLC 7, TEF Canada :** CO 249, CE 207, EO 310, EE 310.
- **NCLC 7, TCF Canada :** CO 458, CE 453, EO 10, EE 10.
- **Points CRS pour le français** (NCLC 7, sans conjoint) :
  - 12 points en 2ᵉ langue, 68 points en 1ʳᵉ langue ;
  - points additionnels : +25 ou +50 ;
  - la catégorie francophone exige le NCLC 7 dans les 4 compétences.
- Centres d'examen et prix de référence 2025 : sur les pages pays (Pérou, Colombie, Chili). Quand un prix n'est pas vérifiable, la page dit « consulta el centro ».

---

## 4. Le parcours complet d'un élève

Voici le chemin prévu de la pub jusqu'aux cours, avec l'outil en jeu à chaque étape.

1. **Pub Meta** (Instagram, Facebook), lien avec UTM. Le pixel Meta et la mesure maison enregistrent la visite.
2. **Site :** test de niveau gratuit (`/test-placement.html`). Autres entrées : calculateur CRS, inscription, guides.
3. **Fin du test :** la personne donne son **e-mail** avant de voir son résultat.
   - Le résultat est enregistré (`submit_placement`).
   - Une **fiche Prospectos** est créée dans le CRM.
4. **Page de résultat :** niveau estimé et barres par compétence. Elle invite à une **réunion gratuite avec un professeur**, avec le bouton **« Enviar mis disponibilidades »** (`/disponibilidad.html?t=<jeton>`).
5. **E-mails automatiques** (au plus 3) :
   - **résultat** 5 minutes après le test ;
   - **rappel** à J+2 ;
   - **dernier rappel** à J+5.
   - Ils s'arrêtent dès que la personne agit : disponibilités, réponse, inscription…
6. **Disponibilités reçues** : la tâche **Urgente** « Proponer la reunión por Zoom » apparaît dans la Bandeja.
7. **Réunion proposée** depuis la fiche :
   - le Campus suggère les créneaux où le prospect est disponible et où Ryan ou Abdrahim est libre ;
   - un clic envoie l'**invitation** : lien Zoom, « Confirmo », autre horaire, ajout au calendrier ;
   - rappels automatiques la veille et 1 h avant.
8. **Réunion faite** : « Se hizo » avec des notes (niveau oral, objectif, rythme), ou « No vino ».
9. **Inscription** (`/inscription.html`) : rythme, formule, horaires. La demande arrive dans Admin → Inscripciones, et la conversation continue sur **WhatsApp ou Messenger**.
10. **Invitation au Campus** depuis Admin → Inscripciones, avec le niveau et le professeur.
11. **Onboarding** : objectif TEF ou TCF, mois visé, rythme quotidien, puis **signature du contrat**.
12. **Programmation** : Admin → Clases → « Programar a un alumno ». On y met le professeur, les jours et heures fixes et le **lien Zoom personnel**.
13. **Vie de l'élève :**
    - « Entrar a la clase » enregistre la présence ;
    - cours enregistrés automatiquement par Zoom ;
    - unités ouvertes après le cours, révision espacée, messagerie avec un assistant qui répond d'abord ;
    - examen de fin de niveau, puis passage automatique au niveau suivant.

> **État réel au 19 nov. :** les étapes 1 à 8 sont en ligne, mais aucune réunion réelle n'a encore eu lieu. Les étapes 9 à 13 existent, mais aucun élève n'est encore programmé (0 horaire). WhatsApp reste sur l'ancien numéro péruvien tant que le numéro canadien n'est pas branché ([§12](#12-en-cours-en-attente-à-faire)).

---

## 5. Le site public

### Principes

- **Hébergement :** Worker Cloudflare `pathway-language`, déployé automatiquement à chaque merge sur `main` (Workers Builds). GitHub Pages n'est plus utilisé depuis le 11 nov.
- **HTML/CSS/JS statique**, sans framework ni dépendance npm. `build.mjs` assemble `dist/client/`.
- **Design « V4 »** en production depuis le 13 oct. Les pages V4 sont **générées au build** et **écrasent** certains fichiers racine (voir [§16](#16-pièges-connus-et-leçons-apprises)).
- **Langues :** `/` espagnol, `/fr/`, `/en/`, `/de/`, avec adresses propres en EN/DE (301 depuis les anciennes).
- **Contact affiché :** `contacto@` sur les pages espagnoles, `contact@` ailleurs.
- **SEO et GEO :**
  - sitemap généré (**70 URL indexables**), `robots.txt`, hreflang, Open Graph par langue ;
  - **FAQ en JSON-LD** sur l'accueil et les guides ;
  - **`llms.txt`**, un résumé destiné aux IA.

### Pages

| Type | Pages (espagnol) |
|---|---|
| Accueil | `/` : parcours, professeurs, **rondes IRCC en direct**, témoignages (vidéos Devon et Elena, avis défilants), tarifs (un prix par heure), FAQ |
| Outils | `test-placement.html` (test), `calculador.html` (CRS), `inscription.html` |
| Guides | `nclc-7.html`, `preparacion-tef-canada.html`, `tef-vs-tcf.html`, `puntos-crs-frances.html`, `cuanto-tiempo-nclc-7.html`, `tefaq-quebec.html`, `recursos.html` |
| Pages pays | `tef-tcf-canada-peru.html`, `-colombia.html`, `-chile.html` |
| Programmes | `/programas/a1/` à `/b2/` : lecteur animé du manuel, visite guidée, extraits d'examens, audio |
| Légal | `condiciones.html`, `privacidad.html`, `cookies.html`, `aviso-legal.html` |
| Utilitaires (noindex) | `gracias.html`, `baja.html` (désinscription en un clic), `disponibilidad.html` (disponibilités, liées au test par jeton), `reunion.html` (confirmer la réunion ou demander un autre horaire), `404.html` |

Les versions FR/EN/DE couvrent l'accueil, le test, le calculateur, l'inscription, les conditions, la confidentialité, les cookies, les mentions légales, les guides NCLC 7, TEF et TEFAQ, les ressources et les programmes. Les nouveaux guides et les pages pays n'existent **qu'en espagnol**.

### Le test de niveau

- **32 questions de A1 à B2.** Trois compétences : compréhension écrite, compréhension orale (une seule écoute par audio), grammaire et vocabulaire. **L'oral n'est pas évalué** : c'est le rôle de la réunion avec le professeur.
- **Deux modes :** exprés (16 questions, 12–15 min) et intensif (32 questions, 25–30 min). Sur mobile, un bouton « Empezar el test exprés » apparaît sous le titre.
- **Calcul déterministe** (`placement-scoring.js`), avec des poids croissants par niveau.
- **E-mail demandé à la fin**, juste avant le résultat. C'est une décision du 17 nov. : le demander au début ferait baisser le nombre de tests commencés. L'e-mail est repris par le formulaire d'inscription.
- **Limites anti-abus :** 5 tests par adresse et par heure, 30 par IP et par heure (seule une empreinte de l'IP est gardée, effacée à 24 h).

### L'inscription

- Choix du **rythme (2 à 6 h)**, de la formule (mensuelle ou cycle), du fuseau, de la date de début, des jours, des créneaux et de la date d'examen.
- **Tableau des prix en monnaies locales** :
  - drapeaux en SVG (Windows n'affiche pas les drapeaux emoji) ;
  - le pays du visiteur apparaît en premier ;
  - taux de change d'ExchangeRate-API en cache 12 h, avec des taux de secours.
- **Dernière étape :** « ¿Por dónde seguimos? », **WhatsApp ou Messenger** à égalité.
  - WhatsApp : message prérempli.
  - Messenger : on ne peut pas préremplir ; le résumé est copié automatiquement et la page de remerciement dit de le coller.

### Mesure

- **Mesure maison anonyme** (`funnel_events`, sans e-mail ni IP), qui respecte DNT et GPC. Événements :
  - test : `test_view`, `test_start`, `test_half`, `test_email`, `test_done`, `result_cta` ;
  - inscription : `enroll_view`, `enroll_step`, `enroll_sent` ;
  - contact : `contact_whatsapp`, `contact_messenger`, `email_click`.
  - Résumé dans le bloc « Site » du **rapport du lundi** : taux de passage, appareils, campagnes, e-mails.
- **Pixel Meta** sur les pages publiques. Il n'est pas sur le Campus ni sur les pages `data-no-pixel`. Il est inactif avec DNT ou GPC et n'envoie jamais de donnée personnelle.
- **Première origine** (UTM ou site d'où vient la personne) gardée 30 jours et envoyée avec le test, l'inscription et le calculateur.
- Plausible est prévu mais **non configuré**.

---

## 6. Le Campus

Application web d'une seule page (`campus/app.js`, environ 5 600 lignes, sans build), branchée sur Supabase. Interface en espagnol.

- **Comptes sur invitation uniquement.**
- **Connexion :** lien magique ou **code à 6 chiffres** saisi dans 6 cases.
- **Rôles :** `student`, `teacher`, `admin`. Les droits sont appliqués **en base** (RLS et fonctions SQL).
- Toutes les dates s'affichent à l'heure de l'appareil.

### Les espaces

- **Élèves :** un seul espace.
- **Équipe :** un sélecteur **Profesor · Admin**. L'espace « Alumno » a été retiré pour l'équipe le 17 nov. : pour voir le Campus côté élève, on utilise le **Campus de démonstration** (voir plus bas).
- Un point rouge sur « Admin » signale une tâche urgente.
- Le Campus retient le dernier espace utilisé.

### Espace élève

- **5 onglets en bas : Inicio, Mi ruta, Repasar, Simulacros, Mi curso.**
  - **Inicio :** objectif du jour en XP, série, prochaine classe, défi de la semaine.
  - **Mi ruta :**
    - onglets **A1 · A2 · B1 · B2** : l'élève voit tout le parcours. Les autres niveaux sont en lecture seule, avec les titres réels des unités, tirés des manuels ;
    - unités à réussir à **75 %**, nouvel essai après **24 h** ;
    - certaines unités ne s'ouvrent **qu'après avoir été vues en cours** (rapport de fin de cours) ;
    - examen tous les 16 unités, puis **examen de fin de niveau** en deux étapes (examen validé par le professeur, puis examen final du Campus) ;
    - **passage automatique** au niveau suivant, annulable pendant 14 jours.
  - **Repasar :** cartes de révision espacée, en paquet à balayer (Otra vez / Difícil / Bien / Fácil). Les erreurs des leçons et des cours deviennent des cartes.
  - **Simulacros :** présentation des épreuves. **La version en ligne n'existe pas encore** (« llega pronto »).
  - **Mi curso :**
    - horaire fixe à l'heure locale, bouton **« Entrar a la clase »** (lien Zoom fixe) ;
    - **« Tus clases grabadas »** ;
    - **« Tu compromiso »** (le contrat) ;
    - absences et justificatifs ;
    - manuel lu dans le Campus, qui s'ouvre au fil des cours.
- **Barre du haut :**
  - « ? » (tutoriel) **seul à gauche** ;
  - à droite : **loupe** (la recherche s'ouvre vers la gauche), **messages** (pastille de non-lus), **cloche**, **avatar**.
- **Mensajes :**
  - messagerie avec le professeur ;
  - un **assistant IA répond d'abord** aux questions pratiques. Il reste **silencieux** si le message ne lui est pas destiné, et ne dit **jamais** qu'il transmet le message ;
  - les réponses de l'assistant sont signées « Equipo Pathway ».
- **Logros** (niveau, XP, badges) s'ouvre depuis l'avatar → « Mis logros ». Un petit lien **« Cerrar sesión »** discret se trouve tout en bas.
- **Aide « i »** à côté du titre de chaque onglet, et **tutoriel élève** rejouable par le « ? ».
- **Exercices :** 7 types (choix, saisie, écoute, ordre, association, dictée, repérage).
  - Correction **lettre par lettre**, une puce par erreur classée par type, mots mal placés en pointillé rouge. Ce sont les règles de Ryan.
  - Les sorties d'onglet pendant une question sont comptées et signalées au professeur.
  - Copie, clic droit et impression sont bloqués.

### Espace Profesor

- **Inicio :** rapport de fin de cours, élèves qui ont besoin d'attention, prochains cours, « Por revisar ». Une ligne finale renvoie aux tâches d'administration en attente.
- **Alumnos :** avancement, absences, justificatifs, rattrapages, fins de niveau (« Validar el examen », « Deshacer »).
- **Mensajes**, **Tareas** (devoirs, erreurs de cours).
- **Horarios :** les cours de ses élèves et les demandes de changement d'horaire.
- **Mi agenda** (nouveau, 18 nov.) :
  - semaine par semaine, à son heure : **cours**, **réunions avec des prospects**, **moments bloqués** ;
  - bloc « Reuniones con interesados » :
    - **lien Zoom personnel** ;
    - **adresse d'envoi** (`ryan@` ou `abdrahim@`) ;
    - case **« Hago reuniones con interesados »** ;
    - plages **« No disponible »** (chaque semaine ou une fois) ;
  - sans plage bloquée, le Campus considère la personne libre de **7 h à 22 h** en dehors de ses cours ;
  - **« Añadir a mi calendario »** : abonnement iCal privé, qui marche avec le calendrier de n'importe quel téléphone (Apple, Google, Outlook) ;
  - un admin peut voir l'agenda des autres.
- **Filtre « Mis alumnos / Todos los alumnos »** pour les admins qui enseignent.
- Pour un professeur non admin : onglets Contenido et Cuentas.

### Espace Admin

Navigation regroupée : **Inicio (Bandeja)**, **Ventas** (Captación, Inscripciones), **Escuela** (Clases, Programa), **Configuración** (Ajustes).

- **Bandeja :** trois blocs.
  - **Urgente :** ce qui fait attendre quelqu'un. Exemples : message WhatsApp, demande d'inscription de plus de 24 h, cours sans lien Zoom, élève sans horaire, e-mail sans réponse, disponibilités reçues, réunion du jour.
  - **Por hacer :** le reste.
  - **Hecho :** qui a fait quoi sur 7 jours.
  - Une ligne = une tâche en espagnol simple, avec **un seul bouton** qui mène au bon endroit. Un **tutoriel Admin** de 16 étapes s'ouvre la première fois.
- **Captación**, avec quatre sous-onglets :
  - **Prospectos (CRM) :**
    - fiches créées automatiquement par le test, l'inscription, le calculateur et WhatsApp ;
    - étapes : nuevo, contactado, test, horario propuesto, inscrito, activo, pausa ;
    - origine et campagne, prochaine action, historique ;
    - ligne **« Correos del test »** (où en sont les 3 e-mails) ;
    - bloc **« Disponibilidades »** ;
    - bloc **« Reunión con un profesor »** : proposer, inviter, confirmer, puis « Se hizo » ou « No vino ».
  - **WhatsApp :**
    - interface façon WhatsApp ;
    - chaque message reçu arrive avec un **brouillon IA** et les boutons **Enviar / Editar / Descartar** ;
    - **rien ne part sans clic humain** ;
    - fenêtre de 24 h de Meta : hors fenêtre, l'envoi est refusé (pas de modèles approuvés) ;
    - **vide** tant que le numéro canadien n'est pas branché.
  - **Correo :**
    - e-mails reçus sur `contacto@`, `contact@`, `ryan@`, `abdrahim@`, lus par IMAP toutes les **2 min** ;
    - seuls les e-mails de vraies personnes s'affichent : les newsletters et les rebonds restent dans Zoho ;
    - **brouillon IA** pour chaque e-mail ;
    - **« Enviar desde »** au choix, avec la signature qui va avec ;
    - envoi en double confirmation, dans le même fil, copie dans les Envoyés de Zoho ;
    - **150 envois par 24 h**.
  - **Difusión** (démarchage de sites et médias hispanophones pour obtenir des liens et de la visibilité) :
    - **33 contacts** ;
    - statuts : Por contactar → Contactado → Respondió → Enlace obtenido, ou Rechazado / Descartado ;
    - le bot Difusión prépare des brouillons, qu'un humain envoie depuis le Campus (Zoho, `ryan@` par défaut) ;
    - **20 envois par 24 h glissantes**, ligne de désinscription dans chaque e-mail, relance à 7 jours.
- **Inscripciones :** demandes d'inscription, invitations (niveau et professeur), comptes et membres (les admins sont protégés).
- **Clases :**
  - **« Programar a un alumno »** : cours **particuliers** (avant le 17 nov., on parlait de « groupes »). On y met le professeur, la zone horaire, les jours et heures fixes et le lien Zoom personnel ;
  - « Alumnos sin horario » ;
  - changements d'horaire à valider ;
  - **« Reuniones Zoom sin alumno »** ;
  - règles d'assistance.
  - En base, chaque élève reste un « groupe » d'une personne.
- **Programa :** éditeur d'unités et d'exercices (brouillon → Probar → Publicar), documents et manuels par niveau.
- **Ajustes :**
  - règles d'assistance et rappels, contrat, ouverture des unités, réponses de l'assistant ;
  - **« Correos automáticos »**, avec les boutons de test « Enviarme los correos de las clases » et **« Enviarme los 3 correos del test »** (la page de disponibilités s'ouvre alors en mode démo) ;
  - fin de niveau ;
  - **« Accesos de asistentes »** : clés MCP par rôle, affichées une seule fois, avec un registre des actions.
- **Aide « i »** sur chaque onglet et sur les cartes clés. **Sur téléphone**, le sélecteur Profesor / Admin occupe la première ligne de l'en-tête.

### Campus de démonstration (19 nov. 2026)

Un **monde fictif, séparé du vrai Campus**, pour montrer le Campus, le tester ou en faire des captures pour les vidéos, sans créer de faux e-mails ni toucher aux vrais élèves.

- **Entrer :** Admin → Ajustes → **« Campus de demostración »**, puis un clic sur une personne. Aucune boîte e-mail n'est nécessaire.
  - **Lucía Ramírez**, alumna : série de 12 jours, cours enregistrés, messages, une demande de changement d'horaire.
  - **Valentina Quispe**, alumna : série de 31 jours, fin de niveau à valider.
  - **Mateo Torres**, alumno : en retard, 2 absences, inactif depuis 9 jours.
  - **Diego Fernández**, alumno : nouveau, une tâche et une question en attente.
  - **Julien Moreau**, professeur : voit les 4 élèves (avancement, absences, messages, rapports de cours).
- **Revenir :** bandeau en haut « Volver a mi cuenta », ou « Salir de la demo » dans le menu du compte. Le bandeau peut être masqué (×) pour des captures propres.
- **Données :** toutes fictives, avec des dates relatives à aujourd'hui. Elles se **rafraîchissent toutes seules** si elles ont plus de 6 jours ; bouton « Reiniciar los datos » pour repartir de zéro.
- **Séparation garantie (SQL 044) :**
  - l'équipe réelle ne voit jamais la démo (listes, Bandeja, alertes, rapport du lundi, outils des bots), et un compte démo ne voit que la démo ;
  - aucun e-mail automatique n'est envoyé aux comptes démo ; leurs adresses sont en @example.com et ne reçoivent rien ;
  - rien ne va dans le CRM.
- **Exercices :** les comptes démo voient aussi les **exercices en brouillon** (SQL 046). Les vrais élèves ne voient que les exercices publiés par un professeur dans Programa. La démo montre donc le Campus tel qu'il sera, à mesure que les brouillons sont écrits.
- **Pas encore couvert :** l'espace Admin (prospects, disponibilités, réunions) n'a pas de données démo. C'est une étape 2 possible.

---

## 7. Automatismes : e-mails et tâches programmées

### Tâches programmées (pg_cron, protégées par le secret Vault `pathway_cron_secret`)

| Tâche | Fréquence | Fonction | Rôle |
|---|---|---|---|
| `pathway-placement-followups` | toutes les 5 min | `placement-followups` | E-mails après le test |
| `pathway-mail-sync` | toutes les 2 min | `mail` | Lecture IMAP de Zoho, brouillons IA |
| `pathway-meetings` | toutes les 5 min | `meetings` | Rappels des réunions |
| `pathway-class-reminders` | toutes les 5 min | `class-reminders` | Rappels de cours, avis d'absence, avis de messagerie |
| `pathway-weekly-report` | lundi 13:07 UTC (8:07 à Lima) | `weekly-report` | Rapport du lundi aux admins (en français) |

### E-mails automatiques

| E-mail | Quand | Expéditeur |
|---|---|---|
| **Test 1 :** résultat, compétence prioritaire, invitation à la réunion gratuite, bouton « Enviar mis disponibilidades » (ou « Recibimos tus disponibilidades » s'il les a déjà envoyées) | 5 à 10 min après le test | `hola@`, réponse vers `contacto@` |
| **Test 2 :** « ¿Cuándo hacemos la parte oral de tu test? » | J+2 | idem |
| **Test 3 :** « Tu test de nivel sigue incompleto » | J+5 | idem |
| Invitation à la réunion (lien Zoom, Confirmo / autre horaire, .ics et Google Calendar) | Clic « Enviar la invitación » | adresse choisie (`ryan@`, `abdrahim@`, `contacto@`) |
| Rappels de réunion au prospect | La veille et 1 h avant | idem |
| Rappel à l'animateur | 1 h avant | `campus@` |
| Rappel de cours | N min avant (réglable) | `campus@` |
| Avis d'absence (justifier sous 72 h, mois non validé) | Après une absence injustifiée | `campus@` |
| Avis de messagerie (au professeur, à l'élève) | Conversation en attente depuis 5 min, réponse non lue depuis 10 min | `campus@` |
| Alerte WhatsApp aux admins | Message entrant (1 toutes les 30 min au plus par conversation) | `campus@` |
| Rapport du lundi | Lundi matin | `campus@` |
| Invitation et code de connexion au Campus | Invitation, connexion | Supabase Auth (modèles dans `supabase/templates/`) |

**Règles des e-mails du test :**
- en **4 langues**, selon la langue du test ;
- **aucun lien WhatsApp**, donc aucun numéro péruvien ;
- ils **s'arrêtent** si la personne envoie ses disponibilités, répond par e-mail, envoie une demande d'inscription, devient élève, passe à « contactado » ou au-delà, se désinscrit ou refait le test ;
- **disponibilités envoyées avant le 1er e-mail :** le 1er part quand même (avec le résultat promis), puis plus rien ;
- **pourquoi 5 minutes :** éviter un e-mail 10 secondes après le test, tout en laissant le temps d'envoyer ses disponibilités depuis la page de résultat ;
- **tâche de l'équipe :** « Si no respondió a los correos automáticos, escribirle », le lendemain du 3ᵉ e-mail ;
- chaque envoi apparaît sur la fiche du prospect.

---

## 8. Architecture technique

### Vue d'ensemble

```
Visiteur ──► Worker Cloudflare (site statique V4, redirections, rondes IRCC en cache)
               │  fetch rpc (clé publique)
               ▼
           Supabase (projet ynflykxalfynxoupkxmy, région Canada Central)
           ├─ PostgreSQL : tables + RLS + fonctions SQL security definer (règles métier)
           ├─ Auth : lien magique / code à 6 chiffres, comptes sur invitation
           ├─ Storage : documents et manuels (privé)
           ├─ pg_cron + pg_net : 5 tâches programmées
           └─ Edge Functions (Deno) : e-mails (Resend), Zoho (IMAP/SMTP), Zoom, WhatsApp, IA, MCP
Campus (SPA /campus/) ──► Supabase (session de l'utilisateur)
Bots AppuBot ──► pathway-mcp (clé par rôle) ──► fonctions SQL agent_*
```

### Carte du dépôt

| Chemin | Rôle |
|---|---|
| `build.mjs` | Construction unique (`npm run build`) vers `dist/client/` + `dist/worker-data.json` |
| `worker/index.js`, `wrangler.jsonc` | Worker Cloudflare : https et www, redirections 301, plages pour les médias (Safari iOS), rondes IRCC en direct (cache 4 h), 404, en-têtes de sécurité |
| `v4/` | Design V4 : accueils, CSS, JS, données (manuels, rondes IRCC, visites guidées) |
| `scripts/` | `build-v4-*.mjs` (pages V4), `v4-pages-content.mjs` (**textes des guides V4**), `build-seo.mjs` (sitemap, hreflang, redirections), `build-campus.mjs`, vérifications |
| `i18n/locale-pages.mjs` | Textes et rendu des pages FR/EN/DE de l'ancien socle (test, inscription, calculateur…) |
| Racine `*.html/*.js/*.css` | Pages et scripts du site (test, inscription, calculateur, mesure, pixel…) |
| `campus/` | Le Campus : `app.js`, `campus.css`, `tour.js`, `motion.js/css`, `config.js` (clé **publique** seulement) |
| `campus/db/NNN_*.sql` | **43 migrations** SQL, appliquées dans l'ordre ; `SQL_A_COPIER.md` en garde une copie |
| `supabase/functions/` | 11 Edge Functions |
| `supabase/templates/` | E-mails Supabase Auth (invitation, lien magique) |
| `docs/` | `whatsapp-setup.md`, `marketing/agent-difusion.md`, `marketing/studio-video.md`, captures des animations |
| `marketing/studio/` | **Studio vidéo** (non publié sur le site) : `bible.md` (règles), `faits.md` (ce qu'une pub a le droit de dire), `motor/` (moteur et rendu HTML → MP4), `formatos/` (modèles), `piezas/<id>/` (script, plan, HTML, planche, MP4), `log.md` (journal). Fiches des 7 agents dans `.claude/agents/studio-*.md` |
| `docs/references/` | **Références externes** : motion design, animation, réseaux sociaux, marketing, SEO, et dépôts GitHub classés par utilité. Le sommaire `README.md` dit quoi lire pour quelle tâche. |
| `specs/` | Spécifications de la home V4 et du Campus (en partie datées) |
| `CONFIGURATION.md`, `campus/README.md`, `design-qa.md` | Documentation complémentaire (certaines parties sont datées, voir [§17](#17-questions-ouvertes-et-dette-technique)) |
| `prototypes/`, `prototipos/`, `v3/` | Anciennes maquettes, non publiées ou redirigées |

### Base de données (migrations `campus/db/`)

Toutes sont **appliquées en production** au 19 nov. 2026.

| N° | Objet |
|---|---|
| 001 | Schéma de base : profils, unités, exercices, essais, XP, badges, cartes de révision, devoirs, RLS |
| 002 | Défi de la semaine |
| 003 | Invitations (nom, niveau, rôle, professeur) |
| 004 | Carte « Miembros » des admins |
| 005 | Éditeur d'unités et d'exercices |
| 006 | Progression : 75 %, nouvel essai à 24 h, reprise d'une leçon |
| 007 | Tutoriels vus |
| 008 | Groupes (= élèves), horaires fixes, changements validés, documents par niveau |
| 009 | Suivi Zoom : heure réelle, enregistrements, réunions sans élève |
| 010 | Sorties d'onglet |
| 011 | Rapport du lundi + pg_cron |
| 012 | Fin de niveau en deux étapes, passage automatique |
| 013 | Présences (« Entrar a la clase »), rappels de cours |
| 014 | Secret partagé des tâches programmées (Vault) |
| 015 | Contrat d'engagement signé |
| 016 | Avertissements et justificatifs d'absence |
| 017 | Règles des cours particuliers : formule mensuelle ou cycle, rattrapages, mois non validé |
| 018 | Rapport de fin de cours qui ouvre les unités ; TEFAQ |
| 019 | Test de niveau relié à l'e-mail |
| 020 | Manuel dans le Campus, ouvert au fil des cours |
| 021 | Demandes d'inscription du site |
| 022 | Limites par IP |
| 023 | CRM Prospectos, origine des campagnes, contacts du calculateur |
| 024 | Admins dans « Miembros » |
| 025 | Messagerie élève ↔ professeur avec assistant |
| 026 | Accès limité et journalisé des bots (MCP) |
| 027 | WhatsApp : conversations, brouillons, fenêtre de 24 h |
| 028 | Annuler un passage de niveau |
| 029 | 3 e-mails après le test, mesure anonyme du parcours, désinscription |
| 030 | Difusión et rôle `difusion` |
| 031 | Envoi Difusión par Zoho |
| 032 | Quota de 20 envois sur 24 h glissantes |
| 033 | Activité admin (bloc « Hecho ») |
| 034 | Tutoriel admin |
| 035 | Correo : boîte Zoho dans le Campus |
| 036 | La tâche de l'équipe suit les e-mails du test ; une réponse arrête les relances |
| 037 | Disponibilités pour la réunion (`meeting_requests`) |
| 038 | Le test renvoie son jeton |
| 039 | Disponibilités reçues avant le 1er e-mail |
| 040 | 1er e-mail 5 min après le test |
| 041 | Mi agenda, plages bloquées, réunions avec les prospects, suggestions de créneaux, flux iCal |
| 042 | Membres de l'équipe qui animent les réunions |
| 043 | Tâche programmée des rappels de réunion |
| 044 | Monde démo séparé (`profiles.is_demo`) : invisible pour l'équipe réelle, exclu des e-mails, des rapports et du CRM |
| 045 | Données de la démo (`demo_seed`) : un professeur et 4 élèves A2 avec un historique réaliste |
| 046 | Unités A1, B1 et B2 (titres du sommaire des manuels) ; les comptes démo voient les exercices en brouillon |

### Edge Functions

| Fonction | Rôle | Secrets utilisés (noms seulement) |
|---|---|---|
| `invite-student` | E-mail d'invitation au Campus | — |
| `zoom-webhook` | Événements Zoom : début, fin, enregistrements | `ZOOM_WEBHOOK_SECRET` |
| `weekly-report` | Rapport du lundi | `RESEND_API_KEY` |
| `class-reminders` | Rappels de cours, absences, avis de messagerie | `RESEND_API_KEY` |
| `campus-assistant` | Assistant de la messagerie élève (20 réponses par jour et par élève) | `ANTHROPIC_API_KEY` |
| `pathway-mcp` | Serveur MCP des bots de l'équipe | — |
| `whatsapp` | Webhook Meta, brouillons IA, envoi depuis le Campus | `WA_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `WA_PHONE_NUMBER_ID` (non secret), `ANTHROPIC_API_KEY`, `RESEND_API_KEY` |
| `outreach-send` | Envoi Difusión par Zoho SMTP | `ZOHO_SMTP_PASSWORD` |
| `placement-followups` | 3 e-mails après le test (4 langues) | `RESEND_API_KEY` |
| `mail` | Correo : IMAP, SMTP, brouillons IA | `ZOHO_SMTP_PASSWORD`, `ANTHROPIC_API_KEY` |
| `meetings` | Invitations et rappels de réunion, flux iCal des agendas | `RESEND_API_KEY` |
| `demo` | Campus de démonstration : crée les comptes démo, rafraîchit les données, connexion d'un clic pour l'équipe | — |

- `zoho-probe` est une ancienne fonction de test, neutralisée (renvoie 410). Elle peut être supprimée.
- Les fonctions appelées par pg_cron vérifient l'en-tête `x-cron-secret`.
- « Verify JWT » est désactivé sur les fonctions qui s'authentifient elles-mêmes.
- **Un seul modèle d'IA** sert à `campus-assistant`, `whatsapp` et `mail` : il faut le changer dans les trois `logic.ts` à la fois.

### Commandes utiles

| Commande | Effet |
|---|---|
| `node build.mjs` | Construit le site, avec tous les contrôles intégrés |
| `node scripts/verify-v4-routes.mjs` | 18 contrôles des pages V4 |
| `node scripts/verify-v4-ircc.mjs` | 23 contrôles des rondes IRCC |
| `node scripts/verify-site.mjs dist/client` | Sitemap, Open Graph, hreflang, JSON-LD, redirections, 404 |
| `npx wrangler dev` | Site et Worker en local |
| `python3 -m http.server 4173` | Serveur local pour les tests Playwright du Campus. **À arrêter après les tests.** |

La CI GitHub (`.github/workflows/build.yml`) lance le build et les vérifications V4 sur chaque PR.

### Publier une modification

1. Travailler sur une branche, puis ouvrir une **PR**. La CI doit passer.
2. **Squash merge** sur `main` : Cloudflare déploie le site tout seul.
3. **SQL :** ajouter `campus/db/NNN_nom.sql`, l'appliquer en production, et ajouter son bloc à `SQL_A_COPIER.md`.
4. **Edge Function :** la déployer et vérifier son réglage « Verify JWT ».
5. **Ordre prudent :** d'abord ce qui ne casse rien. Exemple : le site, puis la fonction, puis le SQL qui active l'envoi.
6. **Cache :** changer la version `?v=…` des CSS et JS modifiés. Les fichiers statiques sont en cache une semaine.
7. **Vérifier en ligne**, sur téléphone et sur ordinateur.

---

## 9. Outils et comptes externes

> Les **valeurs** des secrets ne sont jamais écrites ici, ni dans le dépôt, ni dans le chat : seuls les noms figurent.

### Domaine, hébergement, code

- **Cloudflare :** Worker `pathway-language` sur le domaine `pathway-languages.com`.
- **GitHub :** dépôt `SachaRM7/pathway-language-solutions`. Branche par défaut `main`, PR fusionnées en squash.

### Supabase

- **Projet :** `ynflykxalfynxoupkxmy`, région Canada Central.
- **Secrets en place :** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ZOHO_SMTP_PASSWORD`, `ZOOM_WEBHOOK_SECRET`, plus le secret Vault des tâches programmées.
- **Secrets manquants :** ceux de WhatsApp (`WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `WA_TOKEN`).
- **Écran des secrets :** Supabase → Edge Functions → Secrets.
- **Modèle de l'e-mail de connexion :** Supabase → Authentication → Emails. Un modèle avec le code dans l'objet a été proposé, pour faire apparaître le bouton « Copier » de Gmail. **Pas confirmé comme appliqué.**

### Zoho Mail (offre payante, IMAP actif)

- **Boîte principale :** `contact@pathway-languages.com`.
- **Alias :** `contacto@`, `ryan@`, `abdrahim@`, `campus@`. `campus@` sert aux e-mails automatiques et n'apparaît pas dans « Enviar desde ».
- **Serveurs :** IMAP `imappro.zoho.com:993`, SMTP `smtppro.zoho.com:465`. Centre de données US.
- **Mot de passe d'application** « Campus Pathway », stocké dans `ZOHO_SMTP_PASSWORD`.
- **Signatures :** Ryan, Abdrahim, ou « Equipo Pathway Language Solutions ».

### Resend

- **Domaine d'envoi `pathway-languages.com` vérifié.** Aucun compte à créer.
- Il envoie les rappels, le rapport du lundi, les e-mails du test (`hola@`) et les invitations aux réunions.

### Zoom

- **App « Campus Pathway »** (marketplace Zoom), abonnée aux événements suivants :
  - début et fin de réunion ;
  - « All Recordings have completed » ;
  - validation de l'adresse.
- **Adresse du webhook :** `…/functions/v1/zoom-webhook`. Le secret a été régénéré, le premier étant apparu dans une capture.
- **Enregistrement cloud automatique** activé. Test réussi le 17 nov.
- **Rattachement :** une réunion est reliée à l'élève dont le lien personnel contient le même numéro de réunion. Sinon, elle tombe dans « Reuniones Zoom sin alumno ».

### Meta

- **Pixel :** `1066217513158304`, avec les événements PageView, Lead, ViewContent et Contact.
- **Page Facebook :** Messenger via `m.me/61589267362316`. Un nom d'utilisateur lisible reste à choisir.
- **WhatsApp :**
  - **numéro actuel du site : péruvien, +51 989 887 516.** Ne pas le supprimer ;
  - **nouveau numéro canadien +1 (236) 201-1529** (Twilio), dans un **nouveau compte WhatsApp Business** connecté le 17 nov. ;
  - il sera branché sur l'API, pour WhatsApp uniquement (sans appels). Configuration à finir : voir [§12](#12-en-cours-en-attente-à-faire) et `docs/whatsapp-setup.md` ;
  - une fois sur l'API, ce numéro ne s'utilise plus dans l'application WhatsApp d'un téléphone : tout passe par le Campus.

### Twilio

- **Numéro +1 (236) 201-1529**, acheté par Ryan pour environ 1–2 USD par mois.
- **Adresse canadienne demandée :** elle concerne le 911 et peut être ignorée, puisqu'il n'y a pas d'appels.
- **Formulaire fiscal :** mettre l'adresse légale réelle de Pathway.
- **SMS de vérification :** Twilio → Monitor → Logs → Messaging.

### AppuBot (bots IA de l'équipe)

- Les bots tournent sur AppuBot, pour fonctionner même ordinateur éteint. Ils sont branchés au Campus par le serveur **`pathway-mcp`**.
- **Clés :** Campus → Ajustes → Accesos de asistentes.
  - **Un rôle par clé**, actions limitées, toutes inscrites au registre.
  - Expiration à 90 jours, 60 appels par heure.
- **Rôles :**
  - **Admisiones :** brouillons sur les fiches prospects, sur demande ;
  - **Difusión :** contacts, brouillons, relances, liens obtenus. Il ne peut **ni envoyer, ni marquer « Contactado », ni supprimer** ;
  - **Seguimiento, Gestión, Marketing :** rôles prévus ;
  - **Secretaría :** rôle évoqué, non fait.
- **Le bot n'a pas accès au Campus lui-même**, seulement à ses outils MCP. C'est voulu.

### Google

- **Search Console :** propriété de domaine, sitemap `https://pathway-languages.com/sitemap.xml` soumis, indexation demandée le 17 nov. **À revoir vers le 24 nov.**
- **Google Calendar :** étape 2 de Mi agenda, non commencée. Ryan et Abdrahim n'utilisent pas Google Calendar aujourd'hui.

### Autres

- **ExchangeRate-API** (taux de change), en cache 12 h.
- **Octolinks** (backlinks) : un panier test de 60 € a été évoqué. Décision inconnue. Il n'a guère d'intérêt pour un marché hispanophone.

---

## 10. État actuel en production

Relevé du 19 nov. 2026.

| Élément | Valeur |
|---|---|
| Comptes Campus | 3 élèves, 0 professeur non admin, 3 admins |
| Prospects ouverts | 6, tous à l'étape « test » |
| Tests de niveau enregistrés | 6 |
| Demandes d'inscription | 0 |
| Élèves programmés (horaires) | 0 |
| Unités du programme | 240 (60 par niveau, A1 → B2), mais **une seule (A2, unité 1) a des exercices publiés** |
| Contacts Difusión | 33 |
| Conversations Correo | 0 (aucun e-mail réel reçu depuis la mise en route) |
| Disponibilités reçues, réunions proposées | 0, 0 |
| Conversations WhatsApp | 0 (numéro pas branché) |
| Tâches programmées | 5, actives |
| Edge Functions | 11 actives, plus `zoho-probe` neutralisée |
| Pages indexables | 70 |

**En une phrase :** toute la machine commerciale et pédagogique est construite et en ligne, mais elle n'a **pas encore servi en conditions réelles**. Ce qui manque : le premier élève programmé, la première réunion, le numéro WhatsApp canadien, et les premières données de mesure. **Échéance : le lancement du Campus le 1er janvier 2027.**

---

## 11. Chronologie

### 2026, avant le Campus

- **15–27 août :**
  - site multilingue ;
  - accueil Zoom avec Ryan en avant ;
  - optimisation mobile, tarifs ;
  - test de niveau (une écoute par question) ;
  - témoignages.
- **3–13 sept. :** bac à sable v3, carrousel des programmes A1–B2, aperçu animé du manuel A2, frais d'inscription en CAD.
- **22 sept. :** accueil **V4** publié (es, puis fr, en, de).
- **5–13 oct. :** lecteurs des manuels A1, B1, B2, rondes IRCC à jour. **La V4 devient le site par défaut.**
- **23 oct. :** mises à jour de sécurité.

### Novembre 2026

- **10 nov. :**
  - **naissance du Campus** sur Supabase (PR #5) ;
  - **hébergement sur Cloudflare Worker** (#7, #8) ;
  - invitations, membres, e-mails à la charte.
- **11 nov. :** éditeur de contenu, progression 75 % / 24 h, fin de GitHub Pages, pages programmes, tutoriels élève et professeur.
- **12 nov. :**
  - horaires fixes et changements validés (#37) ;
  - Zoom (#38), rapport du lundi (#39), examen de fin de niveau (#40) ;
  - adresses de contact, présences et rappels ;
  - **code de connexion à 6 chiffres** (#44–#49) ;
  - cron sécurisé ;
  - contrat d'engagement, cycle non remboursable, règles d'absence ;
  - rapport de fin de cours, TEFAQ, manuel dans le Campus.
- **13 nov. :** relecture complète du site en 4 lots, adresses EN/DE propres, **un prix par heure**, accueil en 9 sections, nouvel audio du test.
- **14 nov. :** **CRM Prospectos** (#76), messagerie avec assistant (#80), **accès MCP des bots** (#81), **WhatsApp avec brouillons** (#85).
- **15 nov. :** animations du Campus (#86–#88).
- **16 nov. :**
  - corrections des exercices selon les règles de Ryan (#89–#106) ;
  - annulation d'un passage de niveau ;
  - assistant silencieux qui ne dit jamais qu'il transmet ;
  - **pixel Meta** (#112) ;
  - WhatsApp mis en pause à la demande de Ryan ;
  - **autorisation durable** de Sacha d'appliquer seul le SQL et les variables.
- **17 nov.** (journée dense) :
  - audit mobile du parcours (#113) ;
  - **e-mails de relance du test, prix en monnaies latino, WhatsApp ou Messenger, mesure du parcours** (#114) ;
  - Messenger (#115) ;
  - **GEO** : FAQ JSON-LD, `llms.txt`, TEF vs TCF, pages pays, articles piliers (#116–#118) ;
  - Search Console ;
  - **Difusión** et envoi via Zoho (#119–#121) ;
  - **séparation des espaces Profesor et Admin, avec la Bandeja** (#122) ;
  - filtre « Mis alumnos » (#123) ;
  - **Correo** (#124) ;
  - webhook Zoom testé ;
  - **cours particuliers au lieu de groupes** (#125) ;
  - aides « i » (#126, #127) ;
  - **5 onglets élève** (#128) ;
  - barre du haut repensée (#129–#133) ;
  - plus d'espace Alumno pour l'équipe (#134) ;
  - numéro canadien acheté et connecté côté Meta, fonction `whatsapp` déployée (#135).
- **18 nov. :**
  - la tâche liée au test suit les e-mails (#136) ;
  - **e-mails du test réécrits selon Ryan**, réunion gratuite sans date ni prix, page `disponibilidad.html` (#137, #138) ;
  - disponibilités avant le 1er e-mail (#139) ;
  - **1er e-mail 5 min après le test** (#140) ;
  - **Mi agenda et réunions avec les prospects** (#141).
- **19 nov. :**
  - création de ce MASTER.md (#142) ;
  - consignes de mise à jour pour les agents (#143) ;
  - **la publicité vidéo et les réseaux sociaux deviennent le prochain grand chantier** (#144) ;
  - **lancement du Campus fixé au 1er janvier 2027** (#145) ;
  - **références vidéo, marketing et SEO** rangées dans `docs/references/` (#146), puis 8 de plus : motion design, vidéo de lancement, IA en général (#147) ;
  - **plan de démarrage des pubs validé**, en 4 étapes jusqu'au lancement du 1er janvier (#148) ;
  - **tâche programmée hebdomadaire du studio vidéo** (#150) ;
  - **studio vidéo créé** (`marketing/studio/`) : bible, fichier de faits, moteur de rendu, 7 fiches d'agents, et **premier prototype « Ronda IRCC n.º 452 »** (#151) ;
  - **bande-son en code** (cumbia à 120 BPM et bruitages) et **trois versions** de la vidéo : muette, bruitages seuls, complète (#152) ;
  - **Campus de démonstration** : un monde fictif séparé, un professeur et 4 élèves, entrée d'un clic depuis Ajustes (#154) ;
  - **parcours A1 → B2** dans Mi ruta, 180 unités A1/B1/B2 ajoutées, brouillons visibles dans la démo (#155) ;
  - décision de Sacha : **écrire les vrais exercices** (brouillons relus puis publiés par les professeurs) et **construire les vrais Simulacros**, plutôt que des données factices.

---

## 12. En cours, en attente, à faire

### 🚀 Lancement du Campus le 1er janvier 2027

C'est l'échéance qui fixe les priorités (décision de Sacha, 19 nov. 2026). Avant cette date, il faut :

- [ ] **WhatsApp canadien branché** (voir ci-dessous), puis le numéro +51 remplacé partout.
- [ ] **Contenus du Campus** : sur les 60 unités A2, **seule l'unité 1 a des exercices** (8). Il faut écrire et publier les exercices des unités suivantes, puis A1, B1 et B2 selon les besoins des premiers élèves. **C'est le plus gros chantier avant le lancement.**
- [ ] **Premiers élèves invités et programmés :** invitation, onboarding, contrat signé, horaire fixe, lien Zoom personnel.
- [ ] **Mi agenda configurée** par Ryan et Abdrahim, et **une réunion réelle faite** de bout en bout.
- [ ] **Essais réels de Correo**, et d'un parcours élève complet avec un compte de test.
- [ ] **E-mail de connexion** vérifié (modèle avec le code, arrivée hors spam).
- [ ] **Publicité prête pour le lancement :** pub principale et premières vidéos, voir [§13](#13-vision-et-backlog). Le studio est monté et le prototype « Ronda IRCC » attend la validation de Sacha ; la pub principale reste à faire.


### 🔴 Bloquant : WhatsApp avec le numéro canadien (Sacha, avec Ryan)

Déjà fait : numéro acheté, ajouté dans un nouveau compte WhatsApp Business, fonction `whatsapp` déployée. Il reste :

1. **App Meta** (`developers.facebook.com/apps`) : l'ouvrir ou la créer (« Pathway Campus », cas d'usage WhatsApp, reliée au portefeuille de Pathway).
2. **WhatsApp → Configuración de la API :** choisir le +1 236 dans « De ». **Transmettre le Phone number ID** : ce n'est pas un secret, l'assistant le pose dans Supabase (`WA_PHONE_NUMBER_ID`).
3. **`WA_APP_SECRET`** (Configuración de la app → Básica → Clave secreta), à coller dans les secrets Supabase.
4. **`WA_VERIFY_TOKEN`** : un mot de passe long et aléatoire, à coller dans Supabase.
5. **Webhook :**
   - adresse `https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/whatsapp`, avec le même jeton ;
   - « Verificar y guardar » ;
   - s'abonner au champ **messages**.
6. **`WA_TOKEN` permanent :**
   - créer un utilisateur système « Campus Pathway » (Admin) ;
   - lui donner l'app et le **nouveau** compte WhatsApp ;
   - générer un jeton sans expiration (`whatsapp_business_messaging`, `whatsapp_business_management`) ;
   - le coller dans Supabase.
7. **Passer l'app en mode Live** (politique de confidentialité : `/privacidad.html`). La vérification de l'entreprise est recommandée.
8. **Ensuite, l'assistant :**
   - vérifie le branchement ;
   - fait un test (un « Hola » envoyé au +1, qui doit arriver dans Captación → WhatsApp avec un brouillon) ;
   - **remplace +51 989 887 516 partout** : site, `llms.txt`, messages préparés, fichiers du bot.

### 🟠 Configuration à faire par l'équipe

- **Mi agenda** (Ryan, Abdrahim), dans Profesor → Mi agenda :
  - lien Zoom personnel ;
  - adresse d'envoi ;
  - « Hago reuniones con interesados » ;
  - plages « No disponible ».
  - Sacha décoche la case si ces réunions ne sont pas pour Sacha.
- **Essai réel des réunions :** faire le test avec une autre adresse, envoyer ses disponibilités, proposer la réunion, recevoir l'invitation, cliquer « Confirmo ».
- **Essai réel de Correo :** e-mail depuis un Gmail perso vers `contacto@`, puis vérifier qu'il arrive avec un brouillon, répondre « desde Ryan » et vérifier le fil et les Envoyés.
- **Premier vrai élève :** Admin → Clases → « Programar a un alumno », avec son lien Zoom personnel.
- **Contenu du programme :** écrire les exercices des unités A2 2 à 63 (seule l'unité 1 en a), puis A1, B1 et B2.

### 🟡 Petits réglages en attente (Sacha)

- **Modèle de l'e-mail de connexion** avec le code dans l'objet (Supabase → Authentication → Emails).
- **Pixel Meta :** désactiver la correspondance avancée et les détails automatiques.
- **Délivrabilité :** marquer « Non spam » le premier e-mail reçu si nécessaire.
- **Nom d'utilisateur de la page Facebook**, pour un lien Messenger lisible.
- **Supprimer `zoho-probe`** (facultatif).
- **Search Console** vers le 24 nov. : Indexation → Pages, et Performances.
- **Premier rapport du lundi avec données réelles :** 23 nov.

### 🟡 Difusión

- **Envoyé :** RED Immigration, à la main, depuis `ryan@`.
- **Brouillons prêts :** Immiland et Correo Canadiense, à envoyer depuis le Campus. Statut à confirmer.
- **Bot :** recharger son quota d'IA ; programmer ses routines (lundi et jeudi : brouillons ; vendredi : liens publiés et nouveaux sites).
- **Groupes Facebook :** à chercher à la main, Facebook bloque l'automatisation.

---

## 13. Vision et backlog

### 🎬 Prochain grand chantier : publicités vidéo et réseaux sociaux (Instagram, puis TikTok)

> Décidé le 19 nov. 2026 : ce sera le **prochain gros chantier**, dans une nouvelle conversation. Le plan complet, rédigé le 14 nov., est dans **`docs/marketing/studio-video.md`** : le lire en entier avant de commencer. Il était « en attente » jusqu'à la fin des priorités du moment (CRM, relances, **lancement du Campus le 1er janvier 2027**). Les vidéos doivent donc servir ce lancement.

#### État du studio au 19 nov. 2026

- **Décision de Sacha (19 nov.) :** on commence à **produire les rendus tout de suite**. Le budget et l'accès aux comptes (Meta, Instagram) ne sont pas nécessaires pour créer les vidéos ; ils seront fixés avant le test payant et la publication.
- **Le studio existe :** `marketing/studio/`.
  - `bible.md` : public, ton, interdits, charte, zones sûres, rythme, contrat de rendu, grille de relecture. **Version 1, à valider par Sacha.**
  - `faits.md` : le fichier de faits (rondes IRCC datées, NCLC 7, offre, ce qu'on ne dit jamais, ce qui manque). **À relire par Sacha.**
  - `motor/studio.js` et `motor/render.mjs` : le moteur. Chaque pièce est une page HTML dont l'image est une fonction du temps (`window.seek(t)`), filmée par Playwright et encodée par FFmpeg. **Aucune dépendance installée** (ni GSAP ni Remotion pour l'instant : les ressorts sont calculés dans `studio.js`).
  - Les 7 fiches d'agents : `.claude/agents/studio-*.md`.
- **Première pièce produite :** « Ronda IRCC n.º 452 » (`piezas/2026-10-27-ronda-452/`), 15 s, 1080 × 1920, en boucle, avec une bande-son fabriquée en code (cumbia légère à 120 BPM et bruitages : Sacha veut un son « qui parle aux Latinos »). Planche de 18 images et **trois versions** prêtes (décision de Sacha) : `reel-muet.mp4` (sans son), `reel-effets.mp4` (bruitages sans musique) et `reel.mp4` (musique et bruitages), **en attente de la validation de Sacha**. Coût : 0 €.
  - Le format se remplit seul : `formatos/ronda-ircc/nueva-pieza.mjs` lit `v4/data/ircc-rounds.json`.
  - **Chiffres vérifiés sur la source officielle IRCC le 19 nov. 2026 :** la ronde n.º 452 reste la dernière ronde « francés ». À refaire le jour de la publication avec `node scripts/refresh-v4-ircc.mjs --check` (il passe depuis la session cloud ; seul `curl` échoue sur `canada.ca`).
- **Pas encore fait :** le format 4:5, la pub principale (il faut un compte de démonstration du Campus), les variantes, le témoignage (accord d'Elena et de Devon manquant).

#### Ce qui existe déjà côté publicité

- **Pubs Meta** (Instagram, Facebook) gérées par **Ryan**, surtout en format témoignages.
  - Le budget, les campagnes en cours et leurs résultats **ne sont pas documentés** : à demander à Ryan et à noter ici.
- **Mesure prête :**
  - pixel Meta (Lead, Contact, ViewContent) ;
  - première origine UTM gardée 30 jours ;
  - parcours anonyme et bloc « Site » du rapport du lundi, avec les chiffres par campagne ;
  - **le CRM range automatiquement un prospect venu d'une pub** en origine « Publicidad · <campagne> ».
- **Convention de lien :** toujours vers le test de niveau, avec étiquette. Exemple : `https://pathway-languages.com/test-placement.html?utm_source=instagram&utm_medium=reel&utm_campaign=<nom>`.
- **Comptes Instagram et TikTok :** l'existence et l'accès aux comptes de Pathway sont **à confirmer**. La tâche T022 (Instagram / TikTok) des specs V4 est encore ouverte.
- **Lancement du Campus le 1er janvier 2027** (confirmé par Sacha le 19 nov.). La pub principale, qui montre le site et le Campus, doit être prête pour cette date.

#### Les deux usages prévus

1. **La pub principale** (priorité de Sacha) : un motion design de **30 à 45 s**, plus une version de 15 s. Il montre de **vraies captures du site et du Campus**.

   | Moment | Contenu |
   |---|---|
   | 0–3 s | Accroche lisible sans le son (ex. « 407 puntos con francés. ¿Y tú? ») |
   | 3–8 s | Le problème : préparer seul le TEF ou le TCF, sans plan ni suivi |
   | 8–18 s | Le site : test gratuit, résultat par compétence, tarifs simples |
   | 18–35 s | Le Campus : exercices, manuel, cours enregistrés, progression, rappels |
   | 35–40 s | La preuve : vrais résultats d'élèves, rondes IRCC |
   | Fin | « Mide tu nivel gratis », lien étiqueté, logo |

   - **Formats :** 9:16, 1:1, 16:9.
   - **Langues :** espagnol d'abord, puis les autres avec le même montage et une autre voix off.
   - **Captures du Campus :** uniquement un compte de démonstration avec des élèves fictifs.

2. **Les réseaux sociaux** : environ **3 vidéos courtes par semaine** (Reels, puis TikTok), toujours dans la même direction artistique. Objectif : environ 30 minutes de travail humain par semaine.

#### Méthode : production par agents IA, avec deux validations humaines

- **Fabrication :**
  - les vidéos sont du **motion design fait en code** : HTML/SVG animé (GSAP ou Remotion) ;
  - chaque image est capturée par Playwright, puis la vidéo est encodée par FFmpeg ;
  - **coût de rendu : 0 €** ;
  - pas de vidéo réaliste générée par IA (personnes, décors), sauf plus tard et avec un budget plafonné.
- **Chaîne :** script → plan découpé (une action par plan) → maquette → **planche de 18 images validée** → MP4.
- **Deux validations de Sacha :** **avant toute dépense** et **avant toute publication**.
- **Équipe de 7 agents à une seule tâche :**

  | Agent | Son travail | Ce qu'il ne fait jamais |
  |---|---|---|
  | Stratège | Propose 3 sujets par semaine | Choisir seul |
  | Scénariste | Écrit le script de 15 à 30 s et le plan découpé | Promettre un résultat |
  | Motion designer | Anime en code, aux couleurs de Pathway | Sortir de la charte |
  | Relecteur | Vérifie avec un regard neuf, conclut « bon » ou « à reprendre » | Modifier quoi que ce soit |
  | Rendu | Sort la planche puis le MP4 ; annonce le coût de la voix off avant | Dépasser le budget |
  | Publication | Prépare la légende, le lien étiqueté et l'horaire | Publier sans l'accord de Sacha |
  | Analyste | Fait le bilan hebdomadaire (vues complètes, tests, inscrits via le CRM) | Conclure sur moins de 8 vidéos |

  - Les agents de production tournent dans Claude Code (sessions cloud avec Chromium, Playwright, FFmpeg).
  - Les agents de suivi peuvent tourner sur AppuBot.
- **Dossier à créer :**
  - `marketing/studio/` avec :
    - `bible.md` (public, ton, charte, interdits, appel à l'action, rythme, zones sûres) ;
    - `formatos/` ;
    - `piezas/<id>/` (script, plan, HTML, planche, MP4) ;
    - `log.md` (chaque production, son coût, son verdict) ;
  - les fiches des agents dans `.claude/agents/`.
- **Rythme :**
  - musique à 120 BPM ;
  - accroche de 6 mots au plus dans les 3 premières secondes ;
  - pas de mouvement linéaire ;
  - la dernière image reprend la première, pour que la vidéo boucle.
- **Zones sûres 9:16 :** texte à 96 px des bords, en évitant environ 200 px en haut et 300 px en bas.
- **Indicateurs :** part des vidéos vues jusqu'au bout, comparée à notre moyenne, puis tests et inscrits par vidéo grâce aux UTM et au CRM.

#### Charte, outils, interdits

- **Couleurs** (`v4/home.css`) :
  - encre `#122b26`, papier `#fffaf2`, crème `#f5efe4` ;
  - terracotta `#c76f56`, action `#a34e3b`, sauge `#cad8c3`.
- **Polices :** Outfit (titres) et DM Sans (texte), dans `v4/assets/fonts/`.
- **Outils :**
  - GSAP ou Remotion (vérifier la licence de Remotion), Lottie ;
  - **ElevenLabs** (abonnement Starter déjà pris) pour la voix off, la musique et les sous-titres ;
  - WhisperX, Openverse (vérifier la licence de chaque son), FFmpeg, Playwright.
- **Interdits :**
  - **aucun faux témoignage, ni faux élève ou faux professeur généré par IA** ;
  - jamais « invitation garantie » ni « certificat Pathway » ;
  - chiffres IRCC tirés de la source officielle, avec la date de la ronde ;
  - aucune promesse migratoire, aucune étiquette « IA » ;
  - aucune donnée réelle d'élève à l'écran.

#### Les 4 premiers formats

1. **« Ronda IRCC »** : « La categoría de francés invitó desde N puntos ». Il se remplit tout seul avec `v4/data/ircc-rounds.json`.
2. **« Tip TEF »** : une erreur fréquente des hispanophones et sa correction.
3. **« Testimonio »** : un extrait d'une vraie vidéo d'élève (Devon, Elena…), sous-titré.
4. **« Oferta »** : le test gratuit et l'appel à l'action.

**Première pièce (prototype) :** « Ronda IRCC », 15 s, 1080×1920, sans voix, sur une grille de 120 BPM, avec la dernière ronde.

#### Plan de démarrage des pubs (validé par Sacha le 19 nov. 2026)

**Le principe :**
- **Une seule destination : le test de niveau gratuit.** Il est déjà optimisé pour mobile, et tout ce qui suit est automatique (e-mails, disponibilités, réunion, inscription).
- **On juge une pub sur ce qu'elle produit dans le CRM, pas sur ses vues :** coût par test terminé → part de tests suivis de disponibilités → réunions → inscrits. Ces chiffres sortent du rapport du lundi (par campagne) et des fiches « Publicidad · <campagne> ».

**Étape 0 — Décider (environ 1 h de Sacha)**
- *État au 19 nov. :* le fichier de faits et la bible sont rédigés (`marketing/studio/`), à relire par Sacha. Budget et accès : reportés par Sacha après les premiers rendus.
- **Budget de test :** ordre de grandeur proposé, 10 à 15 US$ par jour pendant 2 semaines. **À fixer par Sacha.**
- **Accès :** compte publicitaire Meta et compte Instagram de Pathway. TikTok plus tard.
- **Fichier de faits** (méthode de la référence 09), préparé par l'assistant à partir des §1 et §3, relu par Sacha. Il contient :
  - les prix et les promesses ;
  - les chiffres IRCC datés ;
  - ce qu'on ne promet jamais.
- **La « bible » du studio :** charte, espagnol tutoyé, interdits. Rédigée par l'assistant, puis validée.

**Étape 1 — Monter le studio et produire (semaines 1 et 2)**
1. **Prototype « Ronda IRCC »** de 15 s, pour valider la chaîne de fabrication (références 11 et 12).
2. **Pub principale** de 30 à 45 s, avec de vraies captures du site et d'un Campus de démonstration (référence 13). Script : le problème → le test gratuit → le Campus → une preuve réelle → « Mide tu nivel gratis ».
3. **Variantes** (référence 01), soit **une douzaine de pubs**, chacune avec son propre lien UTM :
   - 3 accroches, par exemple « ¿Cuántos puntos te da el francés? », « De cero a NCLC 7: ¿cuánto tiempo? », « Tu nivel de francés en 12 minutos, gratis » ;
   - 2 formats : 9:16 et 4:5 ;
   - 2 fins.
4. **Témoignage vidéo d'Elena ou de Devon**, sous-titré et habillé aux couleurs de Pathway. Il faut leur accord pour un usage publicitaire.
5. **Deux validations de Sacha :** la planche d'images avant le rendu, puis la publication.

**Étape 2 — Test à petit budget (mi-décembre, 7 à 10 jours)**
- **Campagne Meta** optimisée sur l'événement **Lead** (test terminé), ciblant le Pérou, la Colombie, le Chili et le Paraguay, en espagnol.
- **Toutes les variantes en même temps** ; Meta répartit le budget.
- **Suivi :** rapport du lundi par campagne, et un agent « analyste » qui classe les pubs.
- **Règle de décision :**
  - couper au-delà d'un **coût par test terminé** à fixer après les premiers jours ;
  - garder les 2 ou 3 meilleures ;
  - ne pas juger avant quelques centaines de clics.
- **En option :** le test A/B pub vers Messenger contre pub vers le test.

**Étape 3 — Lancement du 1er janvier 2027, puis rythme de croisière**
- **Budget augmenté sur les pubs gagnantes.** Angle possible : « 2027, tu año para el francés » (janvier, mois des résolutions).
- **Organique :** 3 Reels par semaine (Ronda IRCC, Tip TEF, témoignage, offre), préparés par les agents.
- **Chaque semaine :** 3 nouvelles accroches, et on retire les pubs qui s'essoufflent.
- **Temps visé pour Sacha :** environ 30 min par semaine.

**Points d'attention :**
- **Se coordonner avec Ryan,** qui fait déjà des pubs (témoignages, vers Messenger). Il ne faut pas se concurrencer sur les mêmes audiences. Ses chiffres (coût par message) servent de point de comparaison.
- **Avant Noël,** les pubs coûtent plus cher et l'attention baisse. D'où un test court mi-décembre, puis la vraie poussée début janvier.
- **Toujours :** vrais élèves avec leur accord, chiffres IRCC datés, aucune promesse migratoire, pas d'étiquette « IA ».

#### Automatisation : la tâche programmée « Studio vidéo Pathway »

- **Quand :** chaque **lundi à 14 h 11, heure de Paris**, juste après le rapport du lundi. Première exécution le 23 nov. 2026.
- **Où :** une session Claude Code neuve, dans le cloud (pas besoin d'ordinateur allumé). Sacha reçoit une **notification push** sur son téléphone.
- **Déroulé :**
  1. Bilan de la semaine, par l'agent analyste.
  2. Proposition de 3 sujets, par l'agent stratège. Sacha répond avec un numéro.
  3. Production : script, animation, relecture neuve.
  4. **Planche de 18 images envoyée à Sacha pour validation.**
  5. MP4 et légende. **Sacha publie à la main.**
- **Garde-fou :** si le studio (`marketing/studio/`, `.claude/agents/studio-*.md`) n'est pas encore sur `main`, la session s'arrête et le signale.
- **Limite actuelle :** la tâche n'a **aucun connecteur** (pas d'accès Supabase), donc le bilan demande les chiffres à Sacha. Pour qu'elle lise la base elle-même, il faut recréer la tâche depuis l'écran des tâches programmées de claude.ai, en ajoutant le connecteur Supabase.
- Le texte de la tâche se modifie depuis cet écran, ou en le demandant à Claude.

#### Pour démarrer la nouvelle conversation

1. Lire `docs/marketing/studio-video.md`, cette section et **`docs/references/README.md`**. En priorité : le **studio de vidéo de lancement (13)**, le **playbook complet (11)**, le cours complet (12), le moteur automatisé (01), la campagne par agents (09) et la sélection d'outils (`outils/depots-github.md`).
2. Faire l'**étape 0** du plan ci-dessus, en posant d'abord ces 4 questions à Sacha :
   - le budget de test ;
   - les pubs actuelles de Ryan (sur quoi elles tournent, coût par message) ;
   - l'accès au compte Instagram et au compte publicitaire Meta ;
   - l'accord d'Elena et de Devon pour l'usage publicitaire de leur vidéo.

   Autre point à trancher : la **mascotte** (le phare du logo animé : Sacha est pour, Ryan et Abdrahim n'ont pas confirmé).
3. **Clé ElevenLabs :** l'enregistrer par le formulaire sécurisé de la session, **jamais dans le chat**. Les droits sont déjà définis dans le plan : plafond de crédits, expiration à 90 jours.
4. Créer `marketing/studio/` et la bible, puis produire le prototype « Ronda IRCC » : planche de 18 images, validation, MP4.
5. **Publication :**
   - pas d'automatisation par navigateur sur Instagram ou TikTok (protections anti-robots) ;
   - soit Sacha publie à la main avec la légende préparée ;
   - soit on branche plus tard les API officielles (Instagram via Meta Business, TikTok Content Posting API).
6. Mettre à jour cette section au fur et à mesure (formats validés, résultats, coûts).

### Prochaine grande étape technique : Google Calendar dans les deux sens (étape 2 de Mi agenda)

- **Envoi** des cours et des réunions vers le Google Calendar de chacun.
- **Lecture des plages occupées** : les rendez-vous personnels bloquent des créneaux automatiquement.
- **Vraie invitation Google** (Oui / Non) envoyée au prospect, dont la réponse remonte dans le Campus.
- Un agent IA (via MCP) pourrait alors **recommander un créneau** dès qu'arrivent des disponibilités.
- **Prérequis :**
  - un projet Google Cloud gratuit avec l'accès Calendar ;
  - 2 clés à coller dans Supabase ;
  - un clic « Conectar Google Calendar » par personne ;
  - l'écran « application non vérifiée » s'affiche une fois.
- **Note :** Google Calendar demande un **compte Google**, mais pas forcément une adresse Gmail. On peut créer un compte Google sur une adresse existante (`ryan@pathway-languages.com`, par exemple). En attendant, l'abonnement iCal « Añadir a mi calendario » marche déjà avec n'importe quel calendrier.

### Produit et pédagogie

- **Simulacros en ligne :** examens chronométrés, estimation NCLC par compétence.
- **Contenus A1, B1, B2** dans le Campus.
- **Productions écrites et orales** avec pré-correction IA, et statistiques (specs Campus, tâches T040–T042).
- **Test pilote** avec 3 à 5 élèves (T021).

### Acquisition

- **Vidéos publicitaires et réseaux sociaux** : voir le prochain grand chantier, en tête de cette section.
- **Test A/B pub vers Messenger contre pub vers le site**, mesuré au coût par inscrit.
- Une page d'arrivée dédiée aux pubs.
- **WhatsApp avec brouillons IA** dès que le numéro canadien est branché.
- **Brouillons IA automatiques chaque matin** pour les prospects qui ont une action du jour : proposé, en partie remplacé par Correo.
- **E-mail facultatif à mi-test**, si la mesure montre beaucoup d'abandons.
- **Modèles WhatsApp approuvés**, pour écrire hors de la fenêtre de 24 h.

### SEO et GEO

- Versions FR, EN et DE des nouveaux guides.
- Pages pays : **Paraguay, Mexique, Argentine, Bolivie**.
- Autres articles piliers, choisis d'après les requêtes de la Search Console.
- **Fiche Google Business**, annuaires latino-américains.
- Démarchage Difusión et articles invités.

### Organisation

- Rôle MCP « Secretaría ».
- Professeurs non admins (droits déjà prévus), avec leur propre Mi agenda.
- Plus d'aides « i » si un texte n'est pas clair pour Ryan ou Abdrahim.

---

## 14. Règles de travail

### Avec Sacha

- **Échanges en français.** Les documents de l'équipe sont en français. Seuls les messages destinés aux hispanophones sont en espagnol.
- **Réponses courtes et concrètes** : d'abord ce qui s'est passé, puis ce que chacun doit faire.
- **URL directes et étapes numérotées**, écran par écran : Sacha est souvent sur téléphone.
- **Autorisation durable** (16 nov.) : « à présent à chaque fois qu'il y a une nouvelle variable ou une modification de variable existante ou un SQL à injecter je veux que tu le fasse seul ».
  - L'assistant applique le SQL, déploie les fonctions et pose les variables **non secrètes** lui-même.
  - **Les secrets restent à Sacha.**
  - Certaines actions Supabase demandent une confirmation : sans réponse, elles expirent et ne sont pas appliquées.

### Textes du produit

- **Espagnol simple, tutoyé.**
- Formule d'appel avec deux-points (« Hola, equipo de X: »), paragraphes séparés par une ligne vide.
- **Pas d'étiquette « IA »** dans le parcours de vente (demande de Ryan).
- **Chiffres officiels vérifiés à la source** (IRCC) avant publication.
- **Ne rien écrire comme « gratuit » ou « garanti » sans confirmation** de l'équipe.
- Dire honnêtement ce qui n'existe pas encore (Simulacros).

### Développement

- **PR, puis squash merge sur `main`, puis vérification en ligne.**
- Ne pas forcer un push. Si la branche distante a avancé, la fusionner.
- **Tester avant de publier** : Playwright sur téléphone et ordinateur, en clair et en sombre. Dire ce qui n'a été testé qu'avec des données fictives.
- **Arrêter le serveur de test local** dès la fin des tests.
- **Vérifier l'état réel en production** (fonctions déployées, migrations, tâches) avant d'affirmer que quelque chose est en place.
- **Changer la version (`?v=…`)** de chaque CSS ou JS modifié.
- **Ne jamais committer `.claude/worktrees`.**

---

## 15. Sécurité et éthique

- **Aucun secret dans le chat, le dépôt ou ce document.** Les clés, mots de passe et jetons sont collés par un humain dans Supabase ou AppuBot.
  - Si un secret apparaît dans une capture, **le régénérer**.
  - Ne pas montrer les codes de vérification (SMS, e-mail) en capture.
- **Les assistants IA ne tapent ni mot de passe ni clé, et ne font aucun paiement.** Les achats sont faits par un humain.
- **Ne pas lier d'abonnement Claude ou ChatGPT** dans AppuBot.
- **Données personnelles :** l'adresse e-mail personnelle des membres de l'équipe reste privée.
- La loi péruvienne 29733 sur les données personnelles est citée dans la politique de confidentialité.
- **Pas d'envoi automatique sans clic humain** : WhatsApp, Correo et Difusión passent par des brouillons. Seuls les e-mails transactionnels (test, rappels) partent seuls.
- **Protéger la réputation du domaine :**
  - quotas (20 par 24 h pour Difusión, 150 par 24 h pour Correo) ;
  - ligne de désinscription ;
  - pas d'envoi en masse.
- **Ne pas contourner les protections anti-robots** (Facebook, YouTube, Reddit) : ces actions restent manuelles.
- **L'IA face aux élèves et aux prospects :**
  - ne prétend **jamais être humaine** si on le lui demande sincèrement ;
  - ne dit jamais « je transmets à ton professeur » ;
  - n'invente rien ;
  - ne fait aucune promesse migratoire ;
  - aucun brouillon ne doit se présenter comme écrit par un humain.
- **Clé Supabase :** seule la clé **publique** est dans le code. Le build refuse de publier une clé secrète.

---

## 16. Pièges connus et leçons apprises

- **Pages V4 générées.** Modifier un fichier racine (`nclc-7.html`, `index.html`, `fr/…`) ne change souvent **rien** en production : les textes sont dans `scripts/v4-pages-content.mjs` et `i18n/locale-pages.mjs`.
  - Une nouvelle page demande une route, un guide, un lien dans les ressources, un fichier racine qui porte la FAQ et une entrée dans `build.mjs`.
- **Cache d'une semaine** sur les fichiers statiques : changer `?v=`. Cloudflare peut servir l'ancien HTML quelques minutes.
- **Fonction `whatsapp` jamais déployée** jusqu'au 17 nov., alors qu'on la croyait en place. Vérifier la production.
- **Course entre la tâche programmée et le test :** un e-mail est parti 10 secondes après un test. D'où le délai de 5 min (migration 040).
- **Disponibilités envoyées avant le 1er e-mail :** le résultat promis n'était plus envoyé. Corrigé par la migration 039.
- **Fausse alerte « Urgente »** le lendemain d'un test, alors que les e-mails automatiques travaillaient encore : la tâche passe maintenant après le 3ᵉ e-mail.
- **E-mail « pas reçu » :** il était parti, mais classé en Spam ou Promotions. Un domaine qui commence à envoyer met du temps à être reconnu.
- **Mot de passe collé avec un caractère invisible :** erreurs « Invalid credentials ». Le code nettoie maintenant les valeurs.
- **Caractères invisibles dans des expressions régulières :** ils cassent les déploiements. Les écrire en échappements `\u`.
- **Valeurs TCF erronées** (celles du NCLC 8) : toujours revérifier sur IRCC.
- **Débordement sur mobile :** utiliser `minmax(0,1fr)` plutôt que `1fr`, et mesurer le vrai espace intérieur.
- **Compte WhatsApp limité à un numéro :** créer un nouveau compte pour le +1. Ne pas supprimer le +51.
- **SQL :**
  - pas de variables PL/pgSQL nommées `at` ou `out` ;
  - pas de `UPDATE … FROM LATERAL` qui référence la table cible (utiliser une CTE) ;
  - attention à `current_user` dans une fonction security definer.
- **Doublons de noms dans `app.js`** (un seul module géant) : une collision casse tout le Campus. Tester après chaque ajout.
- **Agenda rechargé à l'infini** quand une fonction renvoyait `null` : toujours prévoir le cas vide.
- **Le serveur de test laissé allumé** apparaît comme une tâche « en cours » et inquiète inutilement.
- **Ne pas deviner d'URL** (Events Manager, consoles) : passer par les menus.
- **Le Campus ouvert avant une mise à jour** garde l'ancienne version : recharger la page.

---

## 17. Questions ouvertes et dette technique

### Questions ouvertes (décisions à prendre)

1. **Statut légal de Pathway** (société péruvienne avec RUC, ou personne physique) : il compte pour Twilio, les factures et l'aviso legal.
2. **Google Calendar :** quel compte Google pour Ryan et Abdrahim (adresse Gmail, ou compte Google créé sur `@pathway-languages.com`) ?
3. **Réunions avec les prospects :**
   - durée habituelle (20, 30 ou 45 min) ;
   - les professeurs non admins en feront-ils ?
   - invitation aussi par WhatsApp une fois le numéro branché ?
   - qui les anime : Ryan et Abdrahim seulement, ou Sacha aussi ?
4. **Enregistrement Zoom :** l'animateur peut-il le mettre en pause ou l'arrêter ? C'est plus respectueux de la vie privée, mais un cours risque alors de manquer dans « Mi curso ».
5. **Canal principal** une fois le +1 branché : WhatsApp, Messenger ou les deux ? Le test A/B est à lancer.
6. **Simulacros :** quand les construire ?
7. **Cohérence des informations publiques :**
   - `llms.txt` simplifie les formules (Acelerado 4 h, Intensivo 6 h) et contient encore le +51 ;
   - les pages « Cuánto tiempo » donnent des délais, alors que le résultat du test n'en donne plus. Choix à confirmer.
8. **Octolinks :** commande abandonnée ou maintenue ?
9. **Publicité :** budget de test, pubs actuelles de Ryan et leurs coûts, accès aux comptes Instagram et publicitaire Meta, accord d'Elena et Devon, mascotte ([§13](#13-vision-et-backlog), plan de démarrage).

### Dette technique

- **Déploiement manuel** du SQL et des fonctions : aucune trace versionnée de ce qui est appliqué. Seuls l'ordre des numéros et ce document font foi.
- **`campus/app.js` monolithique** (environ 5 600 lignes, état global, HTML en chaînes), sans tests unitaires.
- **Clé publique et URL Supabase recopiées dans 9 fichiers**, numéro WhatsApp dans environ 19 fichiers. À centraliser, par exemple dans `site-config.js`.
- **Fichiers trompeurs :**
  - `fr/`, `en/`, `de/` à la racine (non lus par le build) ;
  - guides racine écrasés par la V4 ;
  - ancien code (`test.js`, `pathway-v2/v3`…) ;
  - `prototypes/`, `prototipos/`, `v3/` ;
  - ancienne chaîne de fabrication du manuel A2.
- **Documentation datée :**
  - `CONFIGURATION.md` (§2, §5, §6), `v3/README.md` ;
  - les specs du Campus (tâches faites encore marquées « à faire ») ;
  - le tableau de `campus/README.md`, qui s'arrête à la 014 ;
  - l'introduction de `SQL_A_COPIER.md`.
- **Scripts de vérification non portables** (binaire Windows). Playwright n'est pas déclaré dans `package.json`.
- **Plausible** prévu mais non configuré.
- **Node :** le projet demande Node 24 ; le build fonctionne aussi sous Node 22.

---

## 18. Comment tenir ce document à jour

**Qui le met à jour :** tout agent qui travaille sur le dépôt, dans la même PR que son changement. La règle est écrite là où les agents la lisent automatiquement :
- `AGENTS.md`, lu par Codex et les autres agents de code ;
- `CLAUDE.md`, lu par Claude Code, qui renvoie à `AGENTS.md` ;
- `.github/pull_request_template.md` : une case « MASTER.md mis à jour » dans chaque PR.

Les bots AppuBot passent par le Campus (MCP) et non par le dépôt : ils ne modifient pas ce fichier.

**Principe :** ce fichier décrit **l'état présent**. Le détail technique reste dans le code, les migrations et les autres documents ; ici, on garde la vue d'ensemble, les décisions et leurs raisons.

**À chaque PR fusionnée** qui change le produit :
1. Mettre à jour la section concernée (site, Campus, automatismes, base de données, fonctions).
2. Ajouter la PR à la **chronologie** ([§11](#11-chronologie)).
3. Mettre à jour l'en-tête : « État au … — dernière PR intégrée : #… ».

**À chaque nouvelle migration SQL ou fonction :** ajouter sa ligne aux tableaux de la [§8](#8-architecture-technique).

**À chaque décision** de Sacha, Ryan ou Abdrahim (prix, ton, règle, outil) :
1. L'écrire dans la section concernée, avec la raison si elle n'est pas évidente.
2. La retirer des questions ouvertes ([§17](#17-questions-ouvertes-et-dette-technique)) si elle y figurait.

**Quand une tâche en attente est faite** : la retirer de la [§12](#12-en-cours-en-attente-à-faire) et décrire le nouvel état à sa place.

**Chaque semaine environ**, et au moins à chaque grande étape :
- relever les chiffres de production ([§10](#10-état-actuel-en-production)) ;
- ajouter une ligne au journal ([§19](#19-journal-des-mises-à-jour)).

**À ne jamais écrire ici :** valeurs de secrets, mots de passe, codes, adresses e-mail personnelles.

---

## 19. Journal des mises à jour

| Date | Changement |
|---|---|
| 19 nov. 2026 | Création du document : état après la PR #141, historique depuis août 2026, backlog, règles, leçons. |
| 19 nov. 2026 | Ajout de `AGENTS.md`, `CLAUDE.md` et du modèle de PR : chaque agent doit tenir ce document à jour. |
| 19 nov. 2026 | Section « Prochain grand chantier : publicités vidéo et réseaux sociaux » (plan vidéo résumé, démarrage). |
| 19 nov. 2026 | Lancement du Campus fixé au 1er janvier 2027, avec la liste de ce qu'il reste à faire avant cette date (§12). |
| 19 nov. 2026 | Ajout de `docs/references/` : 10 articles (motion design, animation, réseaux sociaux, marketing, SEO) et 63 dépôts GitHub classés par thème et par utilité. |
| 19 nov. 2026 | 8 références de plus (11 à 18) : playbook et cours complets de motion design, studio de vidéo de lancement, langage du mouvement, simulateur 3D, IA et agents, rétro-ingénierie. |
| 19 nov. 2026 | Plan de démarrage des pubs validé par Sacha (§13) : décider, produire, tester à petit budget mi-décembre, accélérer au 1er janvier. |
| 19 nov. 2026 | Studio vidéo créé (`marketing/studio/`) et premier prototype « Ronda IRCC n.º 452 » rendu ; budget et accès aux comptes reportés après les premiers rendus (décision de Sacha). |
| 19 nov. 2026 | « Ronda IRCC » : bande-son fabriquée en code (cumbia, bruitages) et trois versions par pièce : muette, bruitages seuls, complète. |
| 19 nov. 2026 | Retrait de la fausse « règle d'équipe » sur les noms de modèles d'IA : l'équipe n'interdit rien de tel. |
| 19 nov. 2026 | Tâche programmée « Studio vidéo Pathway » : chaque lundi 14 h 11 (Paris), bilan, 3 sujets, puis production après le choix de Sacha (§13). |
| 19 nov. 2026 | Campus de démonstration (§6, SQL 044–045, fonction `demo`) ; constat : seule l'unité A2 1 a des exercices (§12). |
| 19 nov. 2026 | Parcours A1 → B2 visible dans Mi ruta (SQL 046) ; brouillons visibles dans la démo ; vrais exercices et vrais Simulacros décidés. |

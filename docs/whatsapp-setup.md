# Brancher WhatsApp sur le Campus — pas à pas

Ce guide s'adresse à la personne qui gère les comptes de Pathway (Meta, Supabase). Aucune ligne de code à écrire : on crée des comptes, on copie des valeurs, et on les colle dans Supabase.

**Ce que ça donne une fois branché** : chaque message WhatsApp reçu arrive dans le Campus (Prospectos → WhatsApp) avec un brouillon de réponse en espagnol. Un admin (Sacha, Ryan, Abdrahim) l'envoie, le modifie ou l'écarte. Rien ne part sans un clic d'un admin.

> **Règle d'or pour les secrets** (jetons, clés, mots de passe) : on les colle **uniquement** dans Supabase → Edge Functions → **Secrets**. Jamais dans un chat (ni avec un assistant IA), un e-mail, WhatsApp, un document partagé, le Campus ou GitHub. Si un secret a circulé par erreur : le régénérer chez Meta (ou 360dialog) et remplacer la valeur dans Supabase.

Avant de commencer, côté Supabase (une seule fois) :

1. Exécuter le SQL **027** (fichier `campus/db/SQL_A_COPIER.md`, section « 027 · WhatsApp »).
2. Déployer la fonction **`whatsapp`** (même section, « Mise en place », étape 2) et **désactiver « Verify JWT »** dans ses réglages.
3. Adresse du webhook, à garder sous la main : `https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/whatsapp`

---

## A. D'abord tester avec le numéro de test gratuit de Meta

Meta fournit gratuitement un numéro de test. On ne touche pas encore au vrai numéro de Pathway : on vérifie que tout marche avec son propre téléphone.

### A1. Créer l'app Meta

1. Aller sur **developers.facebook.com**, se connecter avec le compte Facebook qui gère la page / le Business Manager de Pathway, et accepter de devenir développeur si c'est demandé.
2. **My Apps** → **Create app**. Choisir le cas d'usage qui parle de WhatsApp (« Connect with customers through WhatsApp » ; sinon « Other » puis type **Business**). Nom : par exemple « Pathway Campus ». Relier l'app au **Business portfolio** (Business Manager) de Pathway.
3. Si WhatsApp n'est pas encore ajouté : dans l'app, **Add product** → **WhatsApp** → **Set up**.

### A2. Numéro de test et destinataire

1. Menu **WhatsApp** → **API Setup** (ou « Getting started »). Meta affiche un **numéro de test** (« From ») et, juste en dessous, son **Phone number ID**.
2. Dans **To**, cliquer **Manage phone number list** et ajouter **son propre numéro WhatsApp** (avec l'indicatif). Meta envoie un code par WhatsApp : le saisir. Avec le numéro de test, on ne peut écrire qu'aux numéros de cette liste (5 au plus).
3. Cliquer **Generate access token** : c'est un **jeton temporaire** (il expire au bout d'environ 24 h ; pour le test, ça suffit).

### A3. Les secrets dans Supabase

Supabase → **Edge Functions** → **Secrets** → **Add new secret** :

| Nom | Valeur |
|---|---|
| `WA_TOKEN` | le jeton temporaire (A2, étape 3) |
| `WA_PHONE_NUMBER_ID` | le Phone number ID du numéro de test (A2, étape 1) |
| `WA_APP_SECRET` | dans l'app Meta : **App settings** → **Basic** → **App secret** → Show |
| `WA_VERIFY_TOKEN` | un mot de passe que vous inventez (long, au hasard, par exemple généré par votre gestionnaire de mots de passe) |
| `WA_PROVIDER` | `meta` (facultatif : c'est la valeur par défaut) |

`ANTHROPIC_API_KEY` (brouillons) et `RESEND_API_KEY` (e-mails) sont déjà là depuis les étapes précédentes du Campus.

### A4. Brancher le webhook

1. Dans l'app Meta : **WhatsApp** → **Configuration** → **Webhook** → **Edit**.
2. **Callback URL** : `https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/whatsapp`
3. **Verify token** : exactement la même valeur que `WA_VERIFY_TOKEN`.
4. **Verify and save**. Si Meta affiche une erreur : vérifier que la fonction est déployée, que « Verify JWT » est désactivé, et que le verify token est identique des deux côtés (sans espace).
5. Toujours dans Webhook fields, **Manage** → cocher (**Subscribe**) le champ **messages**.

### A5. Essayer

1. Depuis son téléphone, écrire au numéro de test : « Hola, ¿cuánto cuesta el curso? ».
2. Dans le Campus (compte admin) : **Prospectos** → **WhatsApp**. La conversation apparaît en « Borrador por enviar » (rafraîchir si besoin) ; une fiche a été créée dans « Fichas » ; les admins reçoivent un e-mail.
3. Ouvrir la conversation, **Editar**, changer un mot, **Enviar**. Le message arrive sur le téléphone ; dans le Campus apparaissent ✓, puis ✓✓ (bleu une fois lu).
4. Écrire « ¿Eres un bot? » : le brouillon répond honnêtement (une personne de l'équipe lit et envoie chaque message) et la conversation affiche « Revisar la nota ».

Si rien n'arrive : Supabase → Edge Functions → `whatsapp` → **Logs**. « 401 » = `WA_APP_SECRET` ne correspond pas à l'app ; aucun appel du tout = webhook pas abonné au champ **messages**. Si l'envoi échoue avec « token… venció o no es válido » : le jeton temporaire a expiré, en générer un nouveau et remplacer `WA_TOKEN`.

---

## B. Passer au vrai numéro de Pathway

Deux possibilités. **À choisir avant de commencer**, car elles ne se combinent pas.

### Option 1 — Garder le numéro dans l'application WhatsApp Business (« coexistence », via 360dialog)

Pour continuer à utiliser l'application WhatsApp Business sur le téléphone **et** recevoir les messages dans le Campus avec le même numéro. Meta permet cette « coexistence » quand le numéro est connecté par un partenaire officiel (« Tech Provider » / BSP). Ici : **360dialog**.

- **Prix** : environ **49 € par mois et par numéro** chez 360dialog d'après des sources tierces — **à vérifier sur leur site** au moment de souscrire, ainsi que les conditions de la coexistence (certaines fonctions de l'application peuvent être limitées une fois le numéro connecté, et l'historique repris est limité : lire leurs conditions).
- **Étapes** :
  1. Créer un compte sur **360dialog** (hub 360dialog) et lancer la connexion du numéro en choisissant l'option qui garde l'application WhatsApp Business (coexistence). Il faut l'application WhatsApp Business à jour sur le téléphone : on scanne un QR code / on confirme dans l'application.
  2. Une **vérification de l'entreprise** (Business verification) par Meta peut être demandée : nom légal, documents, site web.
  3. Dans le hub 360dialog, créer la **clé API** du numéro.
  4. Supabase → **Secrets** :
     - `WA_PROVIDER` = `360dialog`
     - `WA_TOKEN` = la clé API 360dialog
     - `WA_WEBHOOK_KEY` = un mot de passe que vous inventez (long, au hasard)
     - On peut supprimer `WA_APP_SECRET`, `WA_VERIFY_TOKEN` et `WA_PHONE_NUMBER_ID` du test (360dialog ne signe pas ses webhooks : c'est la clé dans l'adresse qui les authentifie).
  5. Enregistrer chez 360dialog l'adresse du webhook **avec la clé** :
     `https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/whatsapp?key=<valeur de WA_WEBHOOK_KEY>`
     (dans le hub si l'option y est ; sinon le support de 360dialog indique comment — leur API a une route de configuration du webhook). Cette adresse contient un secret : ne la partager qu'avec 360dialog.
- Ce qui est envoyé depuis l'application du téléphone apparaît aussi dans le Campus (« Desde la app de WhatsApp ») et la conversation passe « al día » — si 360dialog transmet ces messages (« message echoes ») : à vérifier lors du premier essai.

### Option 2 — Un nouveau numéro dédié, directement sur l'API Cloud de Meta

Plateforme gratuite (on ne paie que les messages facturables, voir « Prix » plus bas), sans partenaire. Mais un numéro branché ainsi **ne peut plus être utilisé dans l'application WhatsApp** du téléphone : prendre un **nouveau numéro** (ou en libérer un en supprimant son compte WhatsApp).

1. Dans l'app Meta de la partie A : **WhatsApp** → **API Setup** → **Add phone number**. Nom affiché (« Pathway Language Solutions »), catégorie, puis vérification du numéro par SMS ou appel. Le nom affiché est relu par Meta.
2. **Vérification de l'entreprise** dans le Business Manager (Paramètres de l'entreprise → Centre de sécurité / Business verification) : souvent demandée pour sortir des limites de départ.
3. **Jeton permanent** (le jeton temporaire expire en 24 h) :
   1. **business.facebook.com** → **Paramètres de l'entreprise** → **Utilisateurs** → **Utilisateurs système** → **Ajouter** (rôle Admin), nom « Campus Pathway ».
   2. **Attribuer des éléments** : l'app « Pathway Campus » (contrôle total) et le **compte WhatsApp Business** (contrôle total).
   3. **Générer un jeton** : choisir l'app, expiration **Jamais**, permissions `whatsapp_business_messaging` et `whatsapp_business_management`.
   4. Copier le jeton **directement** dans Supabase → Secrets → `WA_TOKEN` (remplacer l'ancien).
4. Supabase → Secrets : `WA_PHONE_NUMBER_ID` = l'identifiant du **nouveau** numéro (page API Setup). Garder `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `WA_PROVIDER` = `meta`.
5. Passer l'app Meta en mode **Live** (en haut de la page de l'app ; une politique de confidentialité est demandée : `https://pathway-languages.com/privacidad.html`).
6. Le webhook de la partie A reste le même (il vaut pour toute l'app ; seuls les messages du numéro `WA_PHONE_NUMBER_ID` sont pris en compte).
7. Mettre ce numéro dans les publicités « clic vers WhatsApp » et sur le site.

### Prix (à vérifier sur la grille officielle de Meta)

- D'après les sources des fournisseurs, quand **la personne écrit en premier**, les réponses libres envoyées dans les **24 h** sont gratuites (« service »). C'est exactement ce que fait le Campus.
- Les conversations ouvertes par une publicité **clic vers WhatsApp** bénéficieraient aussi d'une période gratuite plus longue d'après Meta.
- Les messages à partir de modèles (« plantillas », marketing, relances après 24 h) sont payants par message selon le pays. Le Campus ne les envoie pas encore.
- Vérifier sur la page de tarifs WhatsApp Business de Meta (developers.facebook.com → WhatsApp → Pricing) avant de lancer des campagnes. Avec 360dialog, ajouter leur abonnement.

---

## C. Au quotidien

- **Prospectos → WhatsApp** : les conversations à traiter en haut. Ouvrir, lire la note éventuelle sous le brouillon, puis **Enviar**, **Editar** ou **Descartar**. On peut toujours écrire sa propre réponse en bas.
- « **Ventana cerrada** » : la personne n'a pas écrit depuis plus de 24 h ; WhatsApp n'autorise plus de message libre. Attendre qu'elle réécrive (ou lui écrire depuis l'application, en option 1).
- « **No enviado** » + **Reintentar** : WhatsApp a refusé l'envoi ; la raison est affichée.
- « **Marcar como resuelta** » : quand on a répondu autrement (appel, application…).
- Chaque conversation est reliée à sa fiche (« Ver la ficha ») ; depuis la fiche, « Ver la conversación ».
- Pour couper : supprimer `WA_TOKEN` dans Supabase (plus aucun envoi possible) et désabonner le webhook chez Meta / 360dialog.

# Configuration avant le domaine officiel

Le site public est hébergé sur Cloudflare Workers (voir §9). Les éléments ci-dessous ne peuvent pas être inventés et doivent être fournis par Pathway.

## 1. Domaine officiel

Fait : `pathway-languages.com` est servi par le Worker Cloudflare (DNS chez Cloudflare), et les balises canonical, Open Graph, `robots.txt`, `sitemap.xml` et les données structurées pointent vers ce domaine.

## 2. Réception automatique des formulaires

Le test de niveau et le formulaire d’inscription enregistrent leurs envois dans Supabase, sans compte et sans e-mail envoyé :

- le test : `submit_placement` (`campus/db/019_test_nivel.sql`) ; l’équipe retrouve le niveau en invitant l’élève au Campus ;
- l’inscription : `submit_enrollment` (`campus/db/021_solicitudes.sql`) ; les demandes apparaissent dans le Campus, « Cuentas » → « Solicitudes de inscripción », avec la cloche et « Inicio → Por revisar ».

- le calculateur CRS : `submit_lead` (`campus/db/023_crm.sql`) enregistre le contact facultatif laissé sous le résultat.

Les trois sont limités par adresse e-mail (ou WhatsApp) et par connexion (`campus/db/022_limite_ip.sql`, `023_crm.sql`). Un échec réseau ne bloque jamais le visiteur : WhatsApp s’ouvre quand même avec le message prérempli. Chaque envoi crée ou complète une fiche dans l’onglet admin « Prospectos » du Campus.

`campaign.js` (chargé sur toutes les pages publiques) garde 30 jours dans le navigateur la première origine du visiteur (`utm_campaign`, `utm_source`, `utm_medium`, ou le site d’où il vient) et l’envoie avec le test, l’inscription et le calculateur.

`leadWebhook` dans `site-config.js` reste facultatif : il sert seulement à envoyer aussi chaque demande vers un CRM externe (JSON, réponse HTTP 2xx attendue).

## 3. Mesure des conversions

Pour Plausible, renseigner dans `site-config.js` :

```js
analyticsProvider: 'plausible',
analyticsKey: 'votre-domaine.com'
```

Les événements prêts à être mesurés sont : `cta_click`, `whatsapp_click`, `email_click`, `phone_click`, `crs_calculated` et `lead_whatsapp_prepared`.

## 4. Preuves humaines

À fournir avant ajout : noms ou initiales approuvés, fonctions et photos des enseignants, fichiers des deux témoignages vidéo, consentement explicite de publication, transcription et sous-titres. Ne pas publier de vidéo sans ces éléments.

## 5. Maintenance des données IRCC

Les rondes et règles CRS sont chargées depuis les sources officielles avec un cache et des valeurs de secours. Vérifier les tests après toute modification d’IRCC. Le contenu ne promet jamais qu’un prochain tirage conservera le même seuil.

Le navigateur tente d’abord de lire canada.ca directement. Si c’est impossible (réseau, CORS), il utilise `v4/data/ircc-rounds.json`, une copie de la source officielle régénérée par le workflow de déploiement à chaque push et toutes les 4 heures (`node scripts/refresh-v4-ircc.mjs`). Si IRCC change le format ou renomme la catégorie francophone ou CEC, le rafraîchissement échoue : le site reste en ligne avec la dernière copie, mais l’exécution GitHub Actions passe en rouge et GitHub envoie une notification. Il faut alors ajuster `CATEGORIES` dans `v4/ircc-rounds.js`.

## 6. Bac à sable /v3

La prochaine version du site se prépare sous `/v3/`, servie sur
`https://pathway-languages.com/v3/`. Elle est isolée : ses propres `pathway-v3.css` et
`pathway-v3.js`, `noindex` actif et `Disallow: /v3/` dans `robots.txt`. Le site affiché
sur le nom de domaine reste `index-v2.html` et n'est pas affecté. Les règles détaillées
sont dans `v3/README.md`.

## 7. V4, affichage par défaut

Depuis le 13 octobre 2026, `pathway-languages.com` affiche le design V4 sans `/v4` dans l'adresse : `/`, `/fr/`, `/en/`, `/de/`, `/programas/<niveau>/`, `/condiciones.html`, `/privacidad.html`, `/inscription.html`… À la construction, `scripts/build-v4-default.mjs` publie chaque page V4 terminée à son adresse racine et réécrit les liens internes. Les styles, scripts et images restent servis depuis `/v4/`. Les anciennes adresses `/v4/…` redirigent vers l'adresse racine, avec les paramètres (UTM) et l'ancre.

Une page V4 encore « en refonte » (classe `placeholder-page`) n'est pas publiée : les liens pointent vers la page qui fonctionne sur le site actuel (test de niveau, calculateur, NCLC 7, TEF…). Dès qu'elle est refaite, elle remplace automatiquement la page actuelle à la construction suivante. La construction échoue si une page d'attente n'a aucune page de repli.

Les pages programmes V4 sont générées par `scripts/build-v4-programs.mjs` à partir de `v4/data/manuals/<niveau>.json` et des images de `assets/manual-<niveau>/`. Les textes d'interface traduits sont dans ce script.

Les pages qui étaient « en refonte » ont maintenant leur version V4, générée par `scripts/build-v4-pages.mjs` (guides NCLC 7 et TEF, conditions, confidentialité, cookies, aviso legal) et `scripts/v4-flows.mjs` (test de niveau, calculateur CRS, inscription). Le texte juridique des conditions et de la confidentialité, ainsi que le HTML et les scripts du test, du calculateur et de l'inscription, sont repris tels quels depuis les pages actuelles de chaque langue : seule la mise en page change (`v4/pages.css`, `v4/flows.css`). Les textes des guides et des nouvelles pages sont dans `scripts/v4-pages-content.mjs`.

L'aviso legal ne mentionne que des informations vérifiables (activité, contact, propriété intellectuelle). Si une raison sociale, une adresse ou un numéro d'enregistrement doivent y figurer, les ajouter dans `NEW_LEGAL.legal` de `scripts/v4-pages-content.mjs`.

## 8. Bibliothèque d'icônes

Toutes les icônes du site viennent de `v4/icons.js` : grille 24 × 24, uniquement en contour, un seul trait (1,75, réglé dans `v4/home.css`), extrémités et angles arrondis, rayon 2,5 sur les rectangles. Pour ajouter une icône, la dessiner dans `ICONS` selon ces règles, puis l'utiliser avec `<svg class="icon"><use href="#i-nom"/></svg>`.

À la construction, `scripts/apply-icons.mjs` injecte la bibliothèque dans chaque page publiée, remplace les anciennes icônes dessinées à la main et transforme en icônes les caractères → ← ↓ ↗ ‹ › ＋ ✕ ✓ écrits dans le texte. `v4/icons-runtime.js` fait la même conversion pour le texte que les scripts modifient (boutons « Suivant → », plein écran du lecteur…).

## 9. Hébergement sur Cloudflare Workers

Depuis novembre 2026, le site est servi par un Worker Cloudflare (`pathway-language`, adresse de test `pathway-language.sacha4dev.workers.dev`), connecté à ce dépôt GitHub par Workers Builds : chaque push sur `main` reconstruit et publie le site, sans passer par GitHub Actions.

- Configuration : `wrangler.jsonc`. Code du Worker : `worker/index.js`.
- Commande de build : `npm run build:cloudflare` (rafraîchit la copie IRCC, la vérifie, puis construit le site). Commande de déploiement : `npx wrangler deploy`.
- Les adresses gardent leur forme historique : `/page.html` reste tel quel, `/dossier` redirige vers `/dossier/`, `www.` redirige vers l'adresse sans `www`.
- `/v4/data/ircc-rounds.json` est servi par le Worker : lu en direct sur canada.ca, mis en cache 4 heures, et remplacé par la copie du build si IRCC est indisponible ou change ses noms de catégories (l'erreur apparaît dans les journaux du Worker, onglet Observability).
- Tester en local : `npm run build:cloudflare && npx wrangler dev`.

GitHub Pages n'est plus utilisé : le workflow et le fichier `CNAME` ont été retirés. Le dépôt peut être privé, Workers Builds y accède par l'application GitHub de Cloudflare.


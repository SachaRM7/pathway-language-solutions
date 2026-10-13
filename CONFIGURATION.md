# Configuration avant le domaine officiel

Le site public fonctionne sur GitHub Pages sans configuration supplémentaire. Les éléments ci-dessous ne peuvent pas être inventés et doivent être fournis par Pathway.

## 1. Domaine officiel

Acheter ou confirmer le domaine, puis le connecter à GitHub Pages. Après connexion, remplacer `https://sacharm7.github.io/pathway-language-solutions/` dans les balises canonical, Open Graph, `robots.txt`, `sitemap.xml` et les données structurées.

## 2. Réception automatique des formulaires

Renseigner `leadWebhook` dans `site-config.js` avec l’URL HTTPS du CRM ou de l’automatisation. Tant que cette valeur est vide, le parcours reste volontairement transparent : il prépare un message WhatsApp et le visiteur doit l’envoyer lui-même.

Le webhook doit accepter du JSON et répondre avec un statut HTTP 2xx. Il faut tester la destination avant de basculer le site public.

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

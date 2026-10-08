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

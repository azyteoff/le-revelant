# Le Révélant — site 2026

Refonte complète du site du restaurant Le Révélant (23 rue Guillaume Tell, Paris 17).
Salades composées, bar à salade, commande en ligne avec paiement intégré.

---

## Démarrer

```bash
npm install
npm run photos    # télécharge les visuels et génère les placeholders flous
npm run dev       # http://localhost:3000
```

> **Pour le restaurant :** tout ce qui change au quotidien se fait depuis le
> navigateur, sur **`/admin`** — l’ardoise, les commandes du service, les
> photos manquantes. Mode d’emploi dans
> [MODIFIER-LE-SITE.md](MODIFIER-LE-SITE.md). Aucune connaissance technique
> n’est nécessaire.
>
> Le mot de passe se met dans `.env.local` (`ADMIN_PASSWORD=…`). Sans lui,
> l’espace restaurant reste fermé.

Build de production :

```bash
npm run build && npm start
```

> Node 20 ou plus. Si Node n’est pas installé sur la machine, une copie locale a été
> déposée dans `~/.local/node` : `export PATH="$HOME/.local/node/bin:$PATH"`.

---

## Ce qui a été corrigé par rapport au site actuel

| Problème constaté | Réponse |
| --- | --- |
| Le panier est perdu quand on se connecte | Panier et session sont deux stores distincts. Se connecter **fusionne**, ne remplace jamais. Vérifié par un test automatisé. |
| Pas de paiement intégré | Tunnel complet avec Stripe Checkout (Apple Pay et Google Pay inclus), commande possible sans compte. |
| Photos peu valorisées | Une seule photo par écran, plein cadre, sous un dégradé calibré pour la lisibilité. Manifeste unique pour remplacer les visuels. |
| Beaucoup d’espace perdu | Grille asymétrique, rythme vertical constant, aucune carte flottante inutile. |
| Esthétique vieillissante | Blanc cassé, olive, beige, noir profond ; serif éditorial pour les titres. |
| Expérience mobile | Barre de commande fixe, bouton d’appel direct, menu plein écran, tout à portée de pouce. |

---

## Architecture

```
src/
  app/
    page.tsx                    Accueil
    la-carte/                   Carte complète (salades, plats, boissons, desserts)
    plats-du-jour/              L'ardoise + les 208 recettes du répertoire
    composer/                   Bar à salade
    commander/                  Tunnel de commande
      confirmation/             Écran de retrait
    le-restaurant/              Le lieu, horaires, plan
    salade-paris-17/            Page locale (SEO de proximité + FAQ balisée)
    api/checkout/route.ts       Création de commande et session Stripe
    sitemap.ts · robots.ts
  app/admin/               Back-office : ardoise, commandes, photos
  components/
    builder/    Composeur visuel (vignettes d’ingrédients)
    site/       Header, Footer, barre de commande mobile
    home/       Hero et sections de l’accueil
    menu/       Carte recette (interaction au survol), lignes produit
    builder/    Composeur de salade
    cart/       Bouton, tiroir, ajouts au panier
    checkout/   Formulaire de commande
    ui/         Boutons, image produit, logo, apparition au scroll
  lib/
    catalog.ts     Salades, bar à salade, boissons, desserts
    plats.ts       Plats chauds : ardoise du jour + répertoire
    restaurant.ts  Adresse, horaires, téléphone, remise
    cart.ts        Panier persistant (zustand + localStorage)
    account.ts     Session client et fusion de panier
    order.ts       Retarification serveur, créneaux, référence
    commandes.ts   Journal des commandes (un fichier JSON par jour)
    admin-session.ts / admin-garde.ts   Session du back-office
    pricing.ts     Remise précommande
content/
  ardoise.json           Les plats du jour — le seul fichier quotidien
  repertoire-plats.json  Les 208 recettes de la maison
  photos.json            Manifeste des visuels
scripts/              photos · verifier · e2e · vitals · shots
```

**Stack** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, zustand.

Aucune bibliothèque d’animation : toutes les transitions sont en CSS. Les apparitions au
scroll utilisent `animation-timeline: view()`, sans une ligne de JavaScript ; là où la
propriété n’est pas encore prise en charge, le contenu s’affiche simplement.

---

## Le contenu

Trois fichiers, trois rythmes de mise à jour.

| Fichier | Contenu | Fréquence |
| --- | --- | --- |
| `content/ardoise.json` | Les 4 plats du jour, leur prix, les salades proposées, un message | **tous les matins** |
| `content/repertoire-plats.json` | Les 208 recettes de plats mijotés de la maison | à l’ajout d’une recette |
| `src/lib/catalog.ts` | Salades signature, bar à salade, boissons, desserts, tarifs | rarement |

**L’ardoise** ne demande que des noms. Le restaurant recopie quatre intitulés du
répertoire ; la description, la photo et la famille (Volaille, Poisson, Végétarien…)
sont retrouvées automatiquement. Un nom mal orthographié n’empêche jamais le site de
fonctionner — le plat est ignoré, et `npm run verifier` signale la faute avec sa
correction :

```
✗ « Poulet maffé » ne figure pas au répertoire.
     Vouliez-vous dire « Poulet mafé » ?
```

**Le répertoire** a été importé depuis l’API de l’ancien site (`/api/recettes`) :
208 recettes avec leur description d’origine, classées en huit familles
(Volaille 59, Porc 37, Poisson 31, Bœuf 25, Veau 18, Agneau 16, Végétarien 16,
Lapin 6). Il est parcourable et filtrable sur `/plats-du-jour`.

**Aucun ingrédient, aucune description et aucun prix n’a été inventé.** Les
compositions de salades et les tarifs viennent de la carte réelle ; les descriptions
de plats viennent du répertoire du restaurant. Seule l’orthographe a été normalisée
(artichauts, pignons de pin, apostrophes typographiques).

### Les plats chauds et le paiement en ligne

`prixPlat` vaut `null` dans l’ardoise : le tarif des plats chauds ne figurait nulle
part sur le site existant et n’a pas été inventé. Conséquence : les plats sont mis en
avant partout, mais portent la mention « à commander au comptoir ».

Renseigner un nombre dans `content/ardoise.json` suffit à les rendre commandables :

```json
"prixPlat": 13.5
```

Le bouton d’ajout apparaît, et le serveur applique ce prix — vérifié par les tests.

---

## Le magasin : ce que le site écrit après son déploiement

Quatre choses changent en production sans passer par un déploiement :
l'ardoise du jour, le répertoire des accompagnements, les photos, et le
journal des commandes. Elles passent toutes par `src/lib/stockage.ts`, qui
expose une seule interface derrière deux implémentations.

| | En local | En ligne (Vercel) |
| --- | --- | --- |
| Support | Fichiers du projet | Vercel Blob |
| Choix | — | Automatique dès qu'un store est connecté (`BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID`) |
| Sauvegarde | Copier `content/` et `data/` | Tableau de bord Vercel |

**Pourquoi.** Le système de fichiers de Vercel est en lecture seule : une
ardoise enregistrée à 11 h disparaissait au déploiement suivant, et le
back-office renvoyait une erreur. Vercel Blob est accessible en écriture à
l'exécution, et gratuit sur le plan Hobby (5 Go, 100 Go de transfert,
10 000 écritures par mois — le restaurant en utilisera moins de 1 %).

**Règle de lecture.** Le magasin est une *surcouche*. Ce qui n'y a jamais été
écrit est lu dans les fichiers livrés avec le site : un premier déploiement
affiche donc l'ardoise et les photos du dépôt, et le magasin ne prend le pas
qu'à partir du premier enregistrement. C'est aussi ce qui permet de revenir à
la photo d'origine en ligne, alors qu'elle n'y a jamais été enregistrée.

**Le service des images.** Une photo remplacée ne vit plus dans `public/` :
Next servirait le fichier du dépôt sans jamais la voir. Les 57 emplacements
remplaçables sont donc réécrits (`beforeFiles` dans `next.config.ts`) vers
`/api/media/…`, qui rend la version enregistrée et retombe sinon sur le
fichier du dépôt. Les 208 photos de plats et les logos de transport gardent
le service statique et leur cache d'un an — ils ne changent jamais.

**Le garde-fou.** Le back-office fait un vrai aller-retour d'écriture au
chargement (`peutEcrire()`). Si l'hébergement ne permet pas d'enregistrer, un
bandeau rouge le dit en haut de l'écran, avant que le restaurant ne perde une
ardoise. `GET /api/admin/diagnostic` donne la même réponse en JSON.

### Mise en ligne sur Vercel

1. Tableau de bord Vercel › **Storage** › **Create Database** › **Blob**.
2. Onglet **Projects** du store › **Connect to Project** › choisir le projet,
   tous les environnements.
3. Redéployer. Vercel pose les variables d'environnement tout seul.
4. Se connecter à `/admin` : l'absence de bandeau rouge confirme que
   l'écriture fonctionne.

## Les photos

### Depuis le back-office — la voie normale

`/admin/photos` liste les **57 emplacements remplaçables** du site, rangés par
endroit et affichés au format de la case qu'ils occupent vraiment. On clique
sur une image ou on y fait glisser un fichier ; la route `POST /api/admin/photo`
s'occupe du reste :

- rotation d'après l'EXIF (une photo verticale de téléphone arriverait couchée) ;
- redimensionnement à la largeur utile — 2000 px en paysage, 1400 px en portrait,
  900 px recadré carré pour les vignettes ;
- réencodage JPEG qualité 85 mozjpeg : 6 Mo à l'entrée, quelques dizaines de ko
  à la sortie ;
- écriture atomique (fichier temporaire puis renommage), pour qu'aucun visiteur
  ne tombe sur une image à moitié écrite ;
- `revalidatePath("/", "layout")` : les pages pré-rendues repartent avec la
  nouvelle photo.

La photo d'origine est copiée **une seule fois** dans
`content/photos-originales/` avant la première substitution : c'est ce qui
permet le bouton « revenir à la photo d'origine ».

L'emplacement est validé contre une liste fermée (`src/lib/phototheque.ts`) :
aucun chemin arbitraire ne peut être écrit, quoi qu'on envoie.

**Cache.** `/img/plats/*` et `/img/transports/*` ne bougent jamais : cache d'un
an, `immutable`. Tout le reste est remplaçable depuis le back-office et passe en
`max-age=60, stale-while-revalidate=604800` — l'affichage reste instantané, et
une photo changée est visible au plus tard une minute après. `minimumCacheTTL`
suit, sinon l'optimiseur d'images resservirait l'ancienne version pendant un an.

### En déposant les fichiers à la main

`content/photos.json` associe un emplacement du site à un fichier.

1. déposer le fichier dans `public/img/<slot>.jpg` (2000 px de large, JPEG qualité 85) ;
2. retirer la clé `"source"` de ce slot dans `content/photos.json` ;
3. `npm run photos` — le script ne touche pas aux fichiers déjà présents et régénère
   les placeholders flous.

Next/Image sert ensuite AVIF puis WebP, aux dimensions exactes de chaque emplacement.

### Les photos de plats

Les **151 photos de plats de l’ancien site ont été rapatriées** dans
`public/img/plats/<slug>.jpg` : n’importe laquelle des 208 recettes a donc déjà son
visuel le jour où elle passe à l’ardoise. Les 57 restantes reçoivent un visuel de
repli par famille, ou une photo dédiée déclarée dans `content/photos.json`
(`plats.remplacements`).

Pour mettre votre propre photo sur un plat : déposez-la dans
`public/img/plats/<slug>.jpg`. Le slug figure dans `content/repertoire-plats.json`.

### Ce qui reste à photographier

Les visuels de salades, de boissons, de desserts et de salle sont des placeholders
sous licence Unsplash : direction artistique homogène (lumière naturelle, fond clair,
composition centrée) mais **ils ne montrent pas les produits réels**. C’est le premier
chantier avant mise en ligne — une séance sur les cinq recettes signature, le bar à
salade, le comptoir et la salle.

---

## Paiement

Sans clé Stripe, le site fonctionne de bout en bout en **mode démonstration** : la commande
est validée, tarifée, une référence de retrait est générée, mais rien n’est encaissé.

Pour activer les paiements réels :

```bash
cp .env.example .env.local
```

Renseigner ensuite `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_SITE_URL`.

Apple Pay et Google Pay apparaissent automatiquement sur les appareils compatibles —
Stripe Checkout les active seul, aucun code spécifique n’est nécessaire. En production,
le domaine doit être enregistré dans *Stripe → Settings → Payment methods → Apple Pay*.

**Les prix ne sont jamais lus depuis le navigateur.** `src/lib/order.ts` retrouve chaque
produit dans le catalogue et applique le tarif officiel ; un ingrédient qui n’existe pas au
comptoir fait échouer la commande.

### Reste à brancher avant mise en production

- Webhook Stripe (`checkout.session.completed`) pour confirmer la commande côté cuisine.
- Envoi de l’e-mail de confirmation avec la référence de retrait.
- Persistance serveur des comptes clients : `src/lib/account.ts` simule aujourd’hui le
  panier distant dans `localStorage`. La signature des fonctions ne changera pas.
- Coupon Stripe pour la remise précommande (`STRIPE_EARLYBIRD_COUPON`).

---

## Tests et mesures

```bash
npm run verifier # contrôle l'ardoise du jour, en français
npm run e2e      # 26 vérifications : survol, panier, connexion, paiement, sécurité
npm run vitals   # Web Vitals observés sur mobile émulé (CPU ×4, 1,6 Mb/s)
npm run shots    # captures desktop et mobile dans .shots/
```

`npm run e2e` couvre notamment les deux scénarios sensibles : composer une salade,
se connecter et retrouver son panier intact ; et l’impossibilité de commander un plat
chaud dont le prix n’est pas renseigné, même en forçant la requête.

### Résultats

Web Vitals observés (Pixel 7 émulé, CPU quatre fois plus lent, 1,6 Mb/s) :

| Page | FCP | LCP | CLS |
| --- | --- | --- | --- |
| Accueil | 0,8 s | 1,6 s | 0 |
| La carte | 0,8 s | 0,9 s | 0 |
| Composer | 0,8 s | 0,8 s | 0 |
| Le restaurant | 0,8 s | 1,8 s | 0 |
| Salade Paris 17 | 0,8 s | 0,8 s | 0,06 |

Toutes les pages sont dans la zone « bonne » des Core Web Vitals (LCP ≤ 2,5 s, CLS ≤ 0,1).

Lighthouse desktop : **97–100** en performance, **100** en accessibilité, bonnes pratiques
et SEO sur l’ensemble des pages. Le score Lighthouse *mobile* oscille entre 81 et 97 selon
la charge de la machine : il repose sur une simulation (Lantern) beaucoup plus pessimiste
que la mesure directe, d’où le tableau ci-dessus. À mesurer à nouveau sur l’hébergement
réel, avec un CDN devant les images.

---

## SEO

- Métadonnées et canoniques par page, Open Graph et Twitter Card.
- Données structurées `Restaurant` complètes : adresse, géolocalisation, horaires,
  moyens de paiement, action de commande, et **la carte entière** (`Menu` / `MenuSection` /
  `MenuItem` avec prix), plats chauds du jour compris.
- Les 208 recettes du répertoire sont rendues côté serveur sur `/plats-du-jour` :
  autant de requêtes longue traîne indexables (« poulet au combava », « cabri massalé »…).
- `FAQPage` et `BreadcrumbList` sur la page locale.
- `sitemap.xml` et `robots.txt` générés ; le tunnel de commande est en `noindex`.

Prochaine étape hors du site : réclamer et compléter la fiche Google Business Profile
(mêmes horaires, mêmes photos, lien vers `/la-carte`).


---

## Le back-office

`/admin`, protégé par un mot de passe unique (`ADMIN_PASSWORD` dans
`.env.local`). Sans mot de passe configuré, l’espace est fermé et affiche la
marche à suivre — jamais ouvert par défaut.

**Session** — cookie `HttpOnly`, `SameSite=Lax`, signé en HMAC-SHA256, valable
12 heures. Le cookie ne contient jamais le mot de passe. Le middleware ne
vérifie que sa présence (le runtime Edge n’a pas `node:crypto`) ; la
signature est contrôlée côté Node dans chaque page et chaque route — c’est
elle qui fait autorité.

**Trois écrans :**

| Écran | Ce qu’il fait |
| --- | --- |
| L’ardoise | Choisir les 4 plats parmi les 208 par recherche, ouvrir/fermer la vente en ligne, message du jour, salades proposées. Écrit dans `content/ardoise.json` en préservant le bloc d’aide. |
| Commandes | Les commandes du service groupées par créneau, avec le détail, la note du client et trois états : reçue, préparée, remise. |
| Photos | Les 57 images remplaçables du site, par endroit. On clique sur une case ou on y fait glisser un fichier : recadrage, compression et mise en ligne sont automatiques, avec retour possible à la photo d’origine. |

**Journal des commandes** — un fichier JSON par jour dans `data/commandes/`.
Pas de base de données : un service compte quelques dizaines de commandes, et
un fichier se sauvegarde en le copiant.

⚠️ Cela suppose un disque inscriptible : vrai en local et sur un serveur
classique (VPS, Docker), faux sur un hébergement sans état comme Vercel. Dans
ce cas l’écriture échoue en silence — le client est servi normalement, mais
la commande n’apparaît pas au journal, et l’ardoise doit être modifiée dans
le fichier puis redéployée.

---

## Composer un plat chaud

`/composer` porte deux composeurs sous un sélecteur — une salade, un plat
chaud — plutôt que l'un sous l'autre : bout à bout ils feraient une page
interminable où l'on ne saurait plus ce qu'on est en train de composer. Même
grammaire dans les deux (des cases qu'on clique, un récapitulatif collant, un
seul bouton), rien à réapprendre en changeant d'onglet.

**Le modèle vient de la carte réelle** (relevée sur
`revelant-restaurant.fr/menu`) : *1 plat + 1 garniture + 1 base au choix,
13 €*. La garniture est facultative — sans elle le plat retombe sur la
formule à 11 €. C'est exactement la grille `FORMULES` déjà en place.

**Les bases et garnitures sont du texte libre.** Contrairement aux 208
recettes, elles ne forment pas une liste close : la cuisine en invente. Le
back-office les saisit librement et `content/accompagnements.json` les
mémorise — une garniture tapée une fois se repropose d'un clic les jours
suivants. Ce qui est servi aujourd'hui vit dans `content/ardoise.json`
(`bases`, `garnitures`), à côté des plats.

**Retarification serveur.** La formule annoncée par le navigateur n'est
jamais lue quand une composition est fournie : elle se déduit de ce qui a
réellement été pris (`src/lib/order.ts`). Sont refusés : une base absente de
l'ardoise, deux bases, aucune base, plus d'une garniture, un plat hors
ardoise. Sans quoi on pourrait réclamer trois garnitures au tarif sans
garniture.

**`PUT /api/admin/ardoise` est non destructif** sur ces champs : une clé
absente conserve la valeur en place, seule une clé explicitement fournie
remplace. Un appel partiel — un script, une intégration — ne peut donc pas
vider silencieusement les bases du jour.

Le composeur de plat ne s'affiche que si l'ardoise porte au moins un plat et
une base (`platComposable`) ; sinon la page redevient ce qu'elle était, sans
onglet ni case vide.

Boissons et desserts ferment la page, via le `SimpleRow` de « La carte » —
même vignette, même bouton : un client qui les a vus une fois les reconnaît.

## Les salades enregistrées

Après avoir composé, le client peut donner un nom à sa salade et la
retrouver en tête du composeur, prête à recommander en un clic.

Trois décisions :

- **Aucun compte demandé.** Les salades vivent dans le navigateur
  (`src/lib/salades-enregistrees.ts`, localStorage), dans un store séparé de
  celui du panier — se connecter, se déconnecter ou vider son panier ne les
  efface pas, exactement comme pour le panier persistant.
- **Aucun prix enregistré.** Seuls le format et les ingrédients le sont. Le
  tarif se recalcule à chaque ajout, majoration de 11h48 comprise, puis une
  dernière fois côté serveur : une salade enregistrée en mars reste juste en
  septembre.
- **Le geste reste secondaire.** « Enregistrer cette salade » est un lien,
  pas un bouton : l’action principale de la page demeure « ajouter au
  panier ». Le champ ne s’ouvre que sur demande, avec un nom déjà proposé
  (« Quinoa & tofu miel sésame »), pour que l’enregistrement ne coûte qu’une
  frappe.

Huit salades au maximum, quarante caractères par nom. Réenregistrer sous un
nom existant met la salade à jour au lieu d’en créer une homonyme. À la
relecture, un ingrédient disparu de la carte est écarté silencieusement,
plutôt que de laisser le composeur proposer ce qui n’existe plus.

Sur chaque carte : **Ajouter** (l’action évidente), **Modifier** — qui
recharge la sélection dans le composeur — un clic sur le nom pour le
renommer, et une croix pour supprimer.

## Le composeur visuel

Chaque ingrédient du bar à salade est une vignette carrée : photo si elle
existe (`public/img/ingredients/<slug>.jpg`), sinon un aplat à la couleur de
son groupe. Le nom est toujours écrit au même endroit, la sélection se lit de
la même façon — la grille reste régulière quel que soit le nombre de photos.

**Les vignettes se remplissent depuis le back-office.** Les banques d’images ne
proposent rien de crédible pour un taboulé ou un tzatziki, et j’ai préféré
retirer les visuels approximatifs plutôt que d’afficher un burger à la place
de carottes râpées. L’écran « Photos » du back-office montre lesquels
restent à faire, et une photo envoyée depuis cet écran apparaît immédiatement
dans le composeur — la présence d’une vignette est décidée à l’exécution, pas
au build.

# Le Révélant — visite guidée du code

Site en ligne : **https://le-revelant-v1b.vercel.app**
Back-office : **/admin**

Ce document est écrit pour quelqu'un qui va lire le code, pas pour un
utilisateur. Il dit ce qui a été fait, pourquoi, et où regarder — y compris
ce qui n'est pas fini.

---

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseignez ADMIN_PASSWORD
npm run dev
```

Le site est sur `http://localhost:3000`, le back-office sur `/admin`.
Aucune base de données à installer, aucun service à lancer.

> `next-env.d.ts` n'est pas versionné (convention Next). Lancez `npm run dev`
> ou `npm run build` **avant** un `npx tsc --noEmit`, sinon les types générés
> par Next manquent et vous verrez un faux `Cannot find name 'LayoutProps'`.

### Sur Windows

Rien dans le projet n'est spécifique à macOS : les scripts npm n'appellent
que `next` et `node`, jamais un shell. Il faut simplement :

- **Node.js 20.9 ou plus** (`next`, `sharp` et `playwright` l'exigent) —
  Node 22 LTS fait très bien l'affaire ;
- rien d'autre. `sharp` est livré avec des binaires précompilés pour
  Windows x64, ia32 et ARM64 : ni Visual Studio Build Tools, ni Python.

Deux différences de syntaxe seulement, dans PowerShell :

```powershell
# Copier le fichier d'exemple (« cp » fonctionne, « copy » aussi)
Copy-Item .env.example .env.local

# Les variables en préfixe de commande n'existent pas : il faut les poser
$env:ADMIN_PASSWORD = "votre-mot-de-passe"
$env:BASE = "http://localhost:3000"
npm run e2e
```

Pour `npm run e2e`, `vitals` et `shots`, il faut aussi télécharger les
navigateurs de Playwright une fois :

```powershell
npx playwright install chromium
```

WSL fonctionne également, sans aucun ajustement — c'est même le plus simple
si vous l'avez déjà.

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm run dev` | Développement |
| `npm run build` | Build de production |
| `npm run verifier` | Contrôle de cohérence du catalogue et de l'ardoise |
| `npm run e2e` | 72 vérifications de bout en bout (Playwright) |
| `npm run vitals` | Web Vitals mesurés sur Pixel 7 émulé |
| `npm run photos` | Télécharge les visuels manquants, génère les LQIP |

Pour `e2e` : lancez `npm run build && npm start` dans un autre terminal, puis
`ADMIN_PASSWORD=… BASE=http://localhost:3000 npm run e2e`.

---

## En chiffres

| | |
| --- | --- |
| Fichiers TypeScript | 76 (~9 400 lignes) |
| Composants | 27 |
| Pages | 12 |
| Routes serveur | 7 |
| Dépendances de production | **8** |
| Recettes au répertoire | 208, toutes illustrées |
| Vérifications automatisées | 72 |

Les 8 dépendances : `next`, `react`, `react-dom`, `zustand`,
`@vercel/blob`, `clsx`, `tailwind-merge`, `server-only`. Pas d'ORM, pas de
framework backend, pas de bibliothèque d'animation, pas de librairie de
composants.

---

## Architecture

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4.
**Il n'y a pas de backend séparé** : les pages sont des composants serveur,
et sept route handlers font le reste.

```
src/
  app/
    (site)/          pages publiques — leur propre layout
    admin/           back-office — layout distinct, sans le décor du site
    api/             7 routes serveur
  components/        27 composants
  lib/               catalogue, panier, tarification, stockage
content/             JSON éditables (ardoise, 208 recettes, accompagnements)
scripts/             e2e, vitals, vérifications, pipeline photo
```

Le découpage en groupe de routes `(site)` / `admin` est volontaire : le
back-office n'hérite d'aucun élément du site public. Un outil qu'on ouvre à
9 h du matin doit être calme et dense, pas décoré.

### Les décisions qui méritent un regard

**1. Aucune base de données.** Un service compte quelques dizaines de
commandes et quatre plats par jour. Tout est en JSON : `content/ardoise.json`
pour le jour, `data/commandes/AAAA-MM-JJ.json` pour le journal. Ça se
sauvegarde en copiant un dossier et ça se lit sans outil.

**2. `src/lib/stockage.ts` — la couche qui rend ça déployable.** Vercel a un
système de fichiers en lecture seule : une ardoise enregistrée à 11 h
disparaissait au déploiement suivant. Le magasin expose une interface unique
avec deux implémentations — fichiers du projet en local, Vercel Blob en
ligne — choisies à l'exécution selon l'environnement.

La règle de lecture compte : le magasin est une **surcouche**. Ce qui n'y a
jamais été écrit est lu dans les fichiers du dépôt. Un premier déploiement
affiche donc le contenu versionné, et le magasin ne prend le pas qu'au
premier enregistrement. C'est aussi ce qui permet le « revenir à la photo
d'origine » en ligne, alors que cette photo n'a jamais été enregistrée.

**3. Rien n'est importé au build.** `src/lib/ardoise.ts` porte un
avertissement explicite : un `import ardoise from "content/ardoise.json"` est
résolu par le bundler, et le site continuerait de servir une version figée.
Ça a été un vrai bug. Tout se lit à l'exécution, et l'écriture déclenche
`revalidatePath`.

**4. Le prix client n'est jamais lu.** `src/lib/order.ts` retarifie chaque
commande depuis le catalogue et l'ardoise du jour. Pour un plat composé, la
formule annoncée par le navigateur est ignorée : elle se **déduit** de ce qui
a réellement été pris. Sont refusés une base hors ardoise, deux bases, aucune
base, plus d'une garniture, un plat hors ardoise.

**5. Trois grilles tarifaires séparées** (`src/lib/catalog.ts`). Salade
signature, salade composée et plat mijoté ne se facturent pas pareil.
Modifier l'une ne doit jamais déplacer les autres — d'où la duplication
apparente, qui est intentionnelle et commentée.

**6. Panier et session dans deux stores distincts** (`cart.ts` /
`account.ts`). C'est la correction du bug principal de l'ancien site : se
connecter ne doit pas vider le panier. À la connexion, un panier distant est
*fusionné*, jamais substitué.

**7. Le service des images.** Une photo remplacée depuis le back-office ne
vit plus dans `public/` ; Next servirait le fichier du dépôt sans jamais la
voir. Les 57 emplacements remplaçables sont réécrits (`beforeFiles` dans
`next.config.ts`) vers `/api/media/…`. Les 208 photos de plats gardent le
service statique et un cache d'un an — elles ne changent jamais.

**8. Aucune animation en JavaScript.** Les révélations au défilement passent
par `animation-timeline: view()` en CSS. Sans support, le contenu est
simplement visible. `motion` avait été introduit puis retiré.

---

## Le back-office

Trois écrans, pensés pour être tenus par quelqu'un qui n'est pas
informaticien.

**L'ardoise** — on cherche parmi 208 recettes, on clique, le plat entre à
l'ardoise ; la description, la photo et la famille suivent automatiquement.
Les bases et garnitures sont en texte libre, et le répertoire
(`content/accompagnements.json`) s'enrichit tout seul : ce qui a été saisi
une fois se repropose d'un clic.

**Les photos** — 57 emplacements, cliquer ou glisser-déposer. Rotation EXIF,
recadrage, redimensionnement, réencodage JPEG mozjpeg : 6 Mo à l'entrée,
quelques dizaines de ko à la sortie. La photo d'origine est mise de côté
avant la première substitution, ce qui rend l'annulation possible.

**Les commandes** — groupées par créneau, trois états.

**Le garde-fou** : au chargement, `peutEcrire()` fait un vrai aller-retour
d'écriture. Si l'hébergement ne permet pas d'enregistrer, un bandeau rouge le
dit avant que le restaurant ne perde une ardoise.
`GET /api/admin/diagnostic` donne la même réponse en JSON.

**Authentification** : cookie signé HMAC-SHA256, 12 h, comparaisons en temps
constant, aucune dépendance. `secure` est calé sur le protocole réel de la
requête et non sur `NODE_ENV` — sinon le cookie est refusé quand on teste
depuis un téléphone en HTTP sur le réseau local.

---

## Performance

Mesures réelles (`npm run vitals`), Pixel 7 émulé, CPU ×4, 1,6 Mb/s :

| Route | FCP | LCP | CLS |
| --- | --- | --- | --- |
| `/` | 884 ms | 1 572 ms | 0 |
| `/la-carte` | 880 ms | 888 ms | 0 |
| `/composer` | 872 ms | 872 ms | 0 |
| `/le-restaurant` | 820 ms | 1 212 ms | 0 |

AVIF puis WebP, paliers de tailles resserrés sur les largeurs réellement
utilisées, LQIP générés hors ligne (`src/lib/*.generated.json`), polices
`next/font` avec graisses épinglées — la variable Fraunces coûtait 118 ko et
retardait le LCP.

---

## Les données du restaurant

Les 208 recettes viennent d'un endpoint non documenté de l'ancien site
(`/api/recettes`), et **151 photos ont été rapatriées** depuis ce même site —
il fallait des en-têtes `Referer` et `User-Agent` de navigateur, sinon 403.
Les descriptions sont celles du restaurant, pas des reformulations.

Règle tenue partout : **aucun ingrédient, aucun prix inventé.** Quand les
tarifs des plats mijotés étaient inconnus, la vente en ligne est restée
derrière un drapeau de configuration plutôt que d'afficher un prix plausible.

---

## Ce qui n'est pas fini

Autant le dire franchement.

- **Le paiement est en mode démonstration.** Le code Stripe Checkout est
  écrit (REST, sans SDK) ; sans `STRIPE_SECRET_KEY`, la commande est validée,
  tarifée et journalisée mais rien n'est encaissé. Voir
  `src/app/api/checkout/route.ts`.
- **Pas de tests unitaires.** La couverture est entièrement end-to-end
  (`scripts/e2e.mjs`, 72 vérifications). C'est un choix assumé pour un projet
  de cette taille, pas un oubli — mais c'en est un si le projet grossit.
- **Le compte client est simulé** (`src/lib/account.ts`) : le panier
  « distant » est un `localStorage` sous une autre clé. La signature des
  fonctions est prête pour un vrai backend, l'implémentation non.
- **La remise de 5 % (compte caisse) n'est pas appliquée automatiquement**,
  le site ne pouvant pas vérifier l'existence du compte. Elle est annoncée au
  paiement.
- **Le répertoire des accompagnements ne sait qu'ajouter** : pas de moyen de
  retirer une entrée depuis l'interface.
- **21 des 31 bacs du bar à salade n'ont pas encore de photo** — les cases
  affichent un aplat coloré, c'est prévu.
- **Les logos métro 3 / RER C** ne sont pas déposés
  (`public/img/transports/` ne contient qu'un LISEZ-MOI).

---

## Où regarder en premier

Si vous ne devez ouvrir que cinq fichiers :

1. `src/lib/stockage.ts` — la couche qui rend le back-office déployable
2. `src/lib/order.ts` — la retarification serveur
3. `src/lib/catalog.ts` — le modèle produit et les trois grilles
4. `src/app/admin/photos/Televerseur.tsx` — l'envoi de photo
5. `scripts/e2e.mjs` — ce qui est réellement vérifié

`README.md` détaille l'architecture ; `MODIFIER-LE-SITE.md` est le guide
destiné au restaurant.

Les commentaires du code expliquent les *pourquoi*, pas les *quoi* — en
particulier les pièges rencontrés, pour éviter qu'on y retombe.

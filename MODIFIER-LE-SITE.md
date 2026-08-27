# Modifier le site — guide du restaurant

Depuis cette version, **tout se fait depuis le navigateur**, sans ouvrir un
seul fichier. Rendez-vous sur :

```
votre-site.fr/admin
```

Entrez le mot de passe, et vous y êtes. Trois onglets, pas un de plus.

> Sur téléphone aussi : l'écran est prévu pour être utilisé debout, au
> comptoir. Ajoutez la page à votre écran d'accueil, elle s'ouvre comme une
> application.

---

## 1. L'ardoise — tous les matins

C'est l'onglet qui s'ouvre en premier.

**Pour changer un plat :** cliquez sur la croix à droite du plat à retirer,
puis cherchez le nouveau dans la liste du dessous et cliquez dessus. Vous
pouvez chercher par nom (« mafé »), par ingrédient (« vanille ») ou filtrer
par famille (Volaille, Poisson, Végétarien…).

La photo, la description et la famille suivent automatiquement : elles
viennent de votre répertoire de 208 recettes.

**Vente en ligne :** l'interrupteur ouvre ou ferme le paiement des plats sur
le site. Fermé, les plats restent affichés avec la mention « à commander au
comptoir ». Pratique un jour de forte affluence.

**Message sur la carte :** une phrase affichée en haut de la page « La
carte » — une fermeture, une nouveauté. Laissez vide pour ne rien afficher.

**Salades :** ne cochez rien pour proposer les cinq recettes, c'est le
réglage habituel.

Rien n'est enregistré tant que vous n'avez pas cliqué sur **Enregistrer
l'ardoise**, en bas de l'écran. La barre vous rappelle en permanence s'il
reste des modifications.

---

## 2. Commandes — pendant le service

Les commandes passées sur le site, groupées par heure de retrait.

Chaque commande affiche sa référence (celle que le client présente au
comptoir), le prénom, le téléphone — cliquable pour appeler — le détail avec
les formules, et **la note du client en rouge** s'il y en a une.

Trois boutons par commande : **Reçue → Préparée → Remise**. Une commande
remise s'estompe mais reste consultable ; la case « Masquer les commandes
remises » nettoie l'écran en plein coup de feu.

L'écran ne se rafraîchit pas tout seul : touchez **Actualiser**.

> Les commandes sont enregistrées dans `data/commandes/` , un fichier par
> jour. Pour les archiver, copiez ce dossier.

---

### Les bases et les garnitures

Sous « Les plats du jour », deux petites listes : **les bases** (le féculent —
riz, fusili, semoule) et **les garnitures** (l'accompagnement de légumes).

Tapez ce que vous servez aujourd'hui, appuyez sur Ajouter. Ce que vous avez
déjà proposé un jour se repropose juste en dessous, sous « Déjà proposé » :
un clic suffit. Au bout de quelques jours, vous ne tapez plus rien.

C'est avec ces deux listes que le client compose son plat chaud sur le site :
un plat, une base, et une garniture s'il en veut une. **Sans garniture le plat
est à 11 €, avec garniture à 13 €.**

> Si vous ne mettez aucune base, l'onglet « Un plat chaud » disparaît du site.
> Les plats restent commandables en formule, comme avant.


## 3. Photos — cliquer, choisir, c'est en ligne

Toutes les images du site sont là, rangées par endroit : la page d'accueil,
les salades signature, le restaurant, les bacs du bar à salade, les desserts
et boissons.

**Pour changer une photo :** cliquez sur l'image, choisissez un fichier dans
vos dossiers. Ou faites glisser la photo directement sur la case. C'est tout —
elle est recadrée, allégée et publiée aussitôt.

Vous vous êtes trompé de photo ? Un lien « Revenir à la photo d'origine »
apparaît sous chaque image remplacée.

**Ce qui marche bien :**

- une photo prise au téléphone convient très bien ;
- près d'une fenêtre, sans flash ;
- les bacs et les bols se photographient de haut ;
- JPEG, PNG ou WebP, 15 Mo maximum.

> Sur iPhone, si l'envoi est refusé : Réglages › Appareil photo › Formats ›
> « Le plus compatible ». L'iPhone enregistre sinon dans un format que les
> navigateurs ne savent pas lire.

Les ingrédients sans photo s'affichent en pastille de couleur sur le site :
c'est propre, mais une photo de votre bac vaut toujours mieux qu'une image
de banque. Comptez vingt minutes pour les faire tous.

---

## Si un bandeau rouge apparaît en haut de l'écran

« Vos modifications ne seront pas conservées. » Cela veut dire que le site est
hébergé à un endroit qui ne permet pas d'enregistrer. Ne saisissez rien tant
qu'il est là : vos changements seraient perdus. Prévenez-nous, c'est un
réglage à faire côté hébergement, pas une erreur de votre part.

---

## Ce qui reste dans les fichiers

Quelques réglages sortent du quotidien et vivent encore dans le code. Ils ne
changent qu'une ou deux fois par an.

### Les prix

`src/lib/catalog.ts`. **Trois grilles séparées**, pour qu'en modifier une ne
déplace jamais les autres :

| Grille | Nom dans le fichier | Aujourd'hui |
| --- | --- | --- |
| Salades signature | `SIZES` | 10 € / 12 € |
| Salades composées | `SIZES_COMPOSEE` | 10 € / 12 € + majoration |
| Plats mijotés | `FORMULES` | 11 € / 13 € |

La majoration de l'après-midi :

```ts
export const MAJORATION_COMPOSEE = { heure: "11:48", montant: 2 };
```

Passé cette heure, une salade **composée** coûte 2 € de plus. Le site
l'affiche, l'ajoute au panier et la recalcule au paiement. Les salades
signature ne sont pas concernées.

### Ajouter une recette au répertoire

`content/repertoire-plats.json`. Copiez un bloc existant :

```json
{
  "nom": "Poulet au citron confit",
  "description": "Blanc de poulet mijoté aux citrons confits et olives.",
  "famille": "Volaille",
  "slug": "poulet-au-citron-confit",
  "sourcePhoto": null
}
```

Famille : Volaille, Poisson, Bœuf, Veau, Agneau, Porc, Lapin ou Végétarien.
Le slug donne le nom du fichier photo. Pour les plats du répertoire, à déposer dans
`public/img/plats/`. La recette apparaît aussitôt dans la recherche du
back-office.

### Composition d'une salade, horaires, adresse, téléphone

- Salades, boissons, desserts : `src/lib/catalog.ts`
- Adresse, horaires, téléphones, remise : `src/lib/restaurant.ts`

La remise de précommande :

```ts
earlyBird: { cutoff: "11:45", rate: 0.1 },   // 0.1 = 10 %
```

Elle s'applique dans deux cas : commande avant 11h45 pour le jour même, ou
commande pour le lendemain, à n'importe quelle heure.

**La remise de 5 % du compte client n'est pas appliquée par le site** : elle
dépend de votre caisse, et le site n'a aucun moyen de vérifier qu'un visiteur
a bien un compte. Elle est annoncée au paiement comme un avantage à demander
au comptoir.

### Les logos de lignes de transport

Le site dessine des pastilles aux couleurs officielles. Pour les vrais logos :
déposez `metro-3.svg` et `rer-c.svg` dans `public/img/transports/`, puis
passez `logo: true` dans `src/lib/restaurant.ts`. Ces logos sont des marques
déposées : leur usage commercial demande l'accord d'Île-de-France Mobilités.

---

## Le mot de passe du back-office

Il est dans le fichier `.env.local`, à la racine du projet :

```
ADMIN_PASSWORD=votre-mot-de-passe
```

Changez-le quand vous voulez, puis redémarrez le site. Toutes les sessions
ouvertes sont alors fermées.

Sans ce fichier, l'espace restaurant reste **fermé** et affiche la marche à
suivre — jamais accessible par défaut.

---

## Publier les modifications

Les changements faits dans le back-office sont **immédiats** sur le site.

Si vous avez modifié un fichier à la main :

```bash
npm run verifier   # contrôle en français
npm run build      # fabrication du site
```

---

## En cas de doute

- Dans les fichiers, ne supprimez jamais une **virgule** ni une **accolade**
  `{ }` : modifiez uniquement le texte entre guillemets.
- Une faute d'orthographe dans un nom de plat ne casse jamais le site : le
  back-office refuse le nom et vous le dit.
- En dernier recours, `git checkout content/` annule vos modifications de
  contenu.

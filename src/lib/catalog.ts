/**
 * Catalogue produits — Le Révélant.
 *
 * ⚠️ Règle absolue : aucun ingrédient inventé. Toutes les compositions,
 * catégories et tarifs ci-dessous proviennent de la carte réelle du
 * restaurant. Seule l’orthographe a été normalisée (artichauts, pignons de pin).
 */

export type SizeKey = "petite" | "grande";

export type Size = {
  key: SizeKey;
  label: string;
  price: number;
  hint: string;
};

/* ------------------------------------------------------------------ */
/*  Les trois grilles tarifaires                                       */
/*                                                                     */
/*  Elles sont volontairement séparées : une salade signature, une      */
/*  salade composée au comptoir et un plat mijoté ne se facturent pas   */
/*  de la même façon. Modifier l'une ne doit jamais déplacer les autres.*/
/* ------------------------------------------------------------------ */

/** Salades signature, préparées à l'avance. */
export const SIZES: Size[] = [
  { key: "petite", label: "Petite", price: 10, hint: "Faim normale" },
  { key: "grande", label: "Grande", price: 12, hint: "Bien faim" },
];

/**
 * Salades composées au comptoir. Même tarif de base que les signatures,
 * mais elles subissent une majoration passé l'heure de pointe : c'est là
 * que les deux grilles divergent.
 */
export const SIZES_COMPOSEE: Size[] = [
  { key: "petite", label: "Petite", price: 10, hint: "Faim normale" },
  { key: "grande", label: "Grande", price: 12, hint: "Bien faim" },
];

/** +2 € sur les salades composées commandées après cette heure. */
export const MAJORATION_COMPOSEE = { heure: "11:48", montant: 2 } as const;

export type Salad = {
  slug: string;
  name: string;
  /** Phrase courte affichée sous le nom, dérivée de la composition. */
  kicker: string;
  /** Composition exacte, dans l’ordre de la carte. */
  ingredients: string[];
  image: string;
  tags: ("végétarien" | "vegan" | "poisson" | "riche en protéines")[];
};

export const salads: Salad[] = [
  {
    slug: "la-gourmande",
    name: "La Gourmande",
    kicker: "Taboulé, poulet tempura, ratatouille",
    ingredients: [
      "Taboulé",
      "Poulet tempura",
      "Mozzarella",
      "Tomate",
      "Carottes râpées",
      "Ratatouille",
      "Tzatziki",
      "Tomates séchées",
    ],
    image: "salade-gourmande",
    tags: [],
  },
  {
    slug: "poulet-pesto",
    name: "Poulet pesto",
    kicker: "Pâtes, pesto, mozzarella",
    ingredients: [
      "Poulet au pesto",
      "Pâtes",
      "Tomates",
      "Concombre",
      "Artichauts grillés",
      "Tomates séchées",
      "Mozzarella",
      "Olives",
    ],
    image: "salade-poulet-pesto",
    tags: [],
  },
  {
    slug: "oceane",
    name: "Océane",
    kicker: "Quinoa, ceviche de saumon, tzatziki",
    ingredients: [
      "Quinoa",
      "Concombre",
      "Radis",
      "Patate douce",
      "Tzatziki",
      "Pois chiches",
      "Ceviche de saumon",
    ],
    image: "salade-oceane",
    tags: ["poisson"],
  },
  {
    slug: "la-sportive",
    name: "La Sportive",
    kicker: "Poulet, œuf dur, houmous",
    ingredients: [
      "Pâtes",
      "Poulet",
      "Œuf dur",
      "Houmous",
      "Concombre",
      "Brocolis",
      "Sésame",
    ],
    image: "salade-sportive",
    tags: ["riche en protéines"],
  },
  {
    slug: "la-vegetalienne",
    name: "La VégétaLienne",
    kicker: "Lentilles, tofu, guacamole",
    ingredients: [
      "Lentilles",
      "Tofu",
      "Pois chiches aux épices",
      "Guacamole",
      "Tomate",
      "Patate douce",
      "Brocolis",
      "Sésame",
    ],
    image: "salade-vegetalienne",
    tags: ["vegan", "végétarien"],
  },
];

/* ------------------------------------------------------------------ */
/*  Bar à salade — salade à composer                                   */
/* ------------------------------------------------------------------ */

export type IngredientGroup = {
  key: string;
  title: string;
  helper: string;
  /** Nombre de choix conseillé ; 0 = libre. */
  suggested: number;
  items: string[];
};

export const builderGroups: IngredientGroup[] = [
  {
    key: "base",
    title: "La base",
    helper: "Une base au choix",
    suggested: 1,
    items: ["Batavia", "Lentilles blondes", "Pâtes", "Taboulé", "Quinoa"],
  },
  {
    key: "legumes",
    title: "Les légumes",
    helper: "Servez-vous, sans limite",
    suggested: 0,
    items: [
      "Carottes râpées",
      "Champignons de Paris",
      "Oignons rouges",
      "Tomate fraîche",
      "Concombre",
      "Radis",
      "Brocolis",
      "Patate douce rôtie",
      "Légumes du soleil confits",
      "Artichauts séchés",
      "Olives noires",
      "Tomates séchées",
    ],
  },
  {
    key: "proteines",
    title: "Les protéines",
    helper: "Autant que vous voulez",
    suggested: 0,
    items: [
      "Blanc de poulet au citron",
      "Blanc de poulet au pesto",
      "Poulet pané",
      "Œufs durs",
      "Ceviche",
      "Pois chiches aux épices",
      "Tofu miel sésame",
    ],
  },
  {
    key: "cremeux",
    title: "Fromages & crémeux",
    helper: "Ce qui lie le tout",
    suggested: 0,
    items: ["Mozzarella", "Feta", "Hummus", "Guacamole", "Tzatziki"],
  },
  {
    key: "finitions",
    title: "Les finitions",
    helper: "Le croquant final",
    suggested: 0,
    items: ["Pignons de pin", "Sésame"],
  },
];

/* ------------------------------------------------------------------ */
/*  Boissons & desserts                                                */
/* ------------------------------------------------------------------ */

export type SimpleProduct = {
  slug: string;
  name: string;
  note?: string;
  price: number;
  image: string;
};

export const drinks: SimpleProduct[] = [
  { slug: "eau", name: "Eau", note: "Bouteille 50 cl", price: 2, image: "boisson-eau" },
  { slug: "san-pellegrino", name: "San Pellegrino", note: "Eau pétillante", price: 2, image: "boisson-pellegrino" },
  { slug: "coca-cola", name: "Coca-Cola", price: 2, image: "boisson-coca" },
  { slug: "coca-cola-zero", name: "Coca-Cola Zero", price: 2, image: "boisson-coca-zero" },
  { slug: "minute-maid-orange", name: "Minute Maid Orange", price: 2, image: "boisson-orange" },
  { slug: "minute-maid-pomme", name: "Minute Maid Pomme", price: 2, image: "boisson-pomme" },
  { slug: "ice-tea", name: "Ice Tea", price: 2, image: "boisson-ice-tea" },
];

export const desserts: SimpleProduct[] = [
  { slug: "fromage-blanc", name: "Fromage blanc", price: 2, image: "dessert-fromage-blanc" },
  { slug: "mousse-au-chocolat", name: "Mousse au chocolat", price: 2, image: "dessert-mousse-chocolat" },
  { slug: "compote-de-pomme", name: "Compote de pomme", price: 2, image: "dessert-compote" },
  { slug: "panna-cotta", name: "Panna cotta", price: 2, image: "dessert-panna-cotta" },
  { slug: "tiramisu-cafe", name: "Tiramisu café", price: 2, image: "dessert-tiramisu-cafe" },
  { slug: "tiramisu-speculoos", name: "Tiramisu spéculoos", price: 2, image: "dessert-tiramisu-speculoos" },
  { slug: "salade-de-fruits", name: "Salade de fruits mix", price: 2, image: "dessert-salade-fruits" },
];

/* ------------------------------------------------------------------ */
/*  Les plats mijotés                                                  */
/* ------------------------------------------------------------------ */

export type FormuleKey = "plat" | "complet";

export type Formule = {
  key: FormuleKey;
  label: string;
  /** Libellé court, pour les boutons. */
  court: string;
  price: number;
  hint: string;
};

/**
 * Un plat mijoté se commande en deux formules. Grille propre aux plats :
 * elle n'a rien à voir avec celle des salades.
 */
export const FORMULES: Formule[] = [
  {
    key: "plat",
    label: "Base + plat",
    court: "Base + plat",
    price: 11,
    hint: "Féculents et viande ou poisson",
  },
  {
    key: "complet",
    label: "Base + plat + garnitures",
    court: "+ garnitures",
    price: 13,
    hint: "Avec les légumes du jour",
  },
];

/**
 * Le contenu de l'ardoise vit dans `src/lib/plats.ts` : il change tous les
 * jours et se pilote depuis `content/ardoise.json`.
 */
export const platsIntro =
  "Quatre plats mijotés différents chaque jour : une base de féculents, une garniture de légumes, une viande ou un poisson longuement cuisiné.";

export const getSalad = (slug: string) => salads.find((s) => s.slug === slug);

export const allBuilderItems = builderGroups.flatMap((g) => g.items);

/**
 * Identifiant de fichier d'un ingrédient : « Œufs durs » → « oeufs-durs ».
 *
 * Les ligatures œ et æ sont remplacées avant la normalisation Unicode, sinon
 * elles disparaissent purement et simplement au lieu de devenir « oe » / « ae ».
 * C'est ce slug qui nomme la photo dans public/img/ingredients/.
 */
export const slugIngredient = (nom: string) =>
  nom
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "Ae")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Le groupe auquel appartient un ingrédient, pour la couleur de repli. */
export const groupeDe = (nom: string) =>
  builderGroups.find((g) => g.items.includes(nom))?.key ?? "legumes";

import repertoire from "@/../content/repertoire-plats.json";
import platPhotos from "./plat-photos.generated.json";

/**
 * Le répertoire des plats de la maison — 208 recettes, stable.
 *
 * Ce module est importable partout, client compris : il ne contient que des
 * données figées et des fonctions pures. Le contenu du jour, lui, change en
 * cours de service et se lit à l'exécution — voir `ardoise.ts`.
 */

export type Plat = {
  nom: string;
  description: string;
  famille: string;
  slug: string;
  /** Chemin de la photo d'origine sur l'ancien site, à titre de trace. */
  sourcePhoto: string | null;
};

export const repertoirePlats = repertoire as Plat[];

/** Clé de comparaison : sans accents, sans casse, sans ponctuation parasite. */
export const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parNom = new Map(repertoirePlats.map((p) => [normaliser(p.nom), p]));

export function trouverPlat(nom: string): Plat | null {
  return parNom.get(normaliser(nom)) ?? null;
}

/**
 * Nom affiché. Le répertoire préfixe les recettes végétariennes par
 * « Végétarien - » ; la pastille de famille le dit déjà, et le titre gagne
 * une ligne. Le nom d'origine reste intact dans les données et la commande.
 */
export const nomAffiche = (plat: Plat) =>
  plat.nom.replace(/^V[ée]g[ée]tarien\s*[-–—]\s*/i, "");

/** Le plat du répertoire dont le nom ressemble le plus — pour les messages d'aide. */
export function platLePlusProche(nom: string): Plat | null {
  const cible = normaliser(nom);
  let meilleur: Plat | null = null;
  let score = Infinity;
  for (const p of repertoirePlats) {
    const d = distance(cible, normaliser(p.nom));
    if (d < score) {
      score = d;
      meilleur = p;
    }
  }
  // Au-delà d'un tiers de différence, la suggestion n'aurait aucun sens.
  return score <= Math.max(3, cible.length / 3) ? meilleur : null;
}

/** Distance de Levenshtein, suffisante pour rattraper une faute de frappe. */
function distance(a: string, b: string): number {
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i, ...Array(a.length).fill(0)]);
  for (let j = 1; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
    }
  }
  return m[b.length][a.length];
}

/* ------------------------------------------------------------------ */
/*  Photos                                                             */
/* ------------------------------------------------------------------ */

const photos = platPhotos as Record<string, string>;

/** Le plat a-t-il une photo dans public/img/plats/ ? */
export const platADesPhotos = (slug: string) => Boolean(photos[slug]);

export const platBlur = (slug: string) => photos[slug];

/** Les familles présentes au répertoire, avec leur effectif. */
export const famillesPlats = (() => {
  const compte = new Map<string, number>();
  for (const p of repertoirePlats) compte.set(p.famille, (compte.get(p.famille) ?? 0) + 1);
  return [...compte.entries()]
    .map(([famille, total]) => ({ famille, total }))
    .sort((a, b) => b.total - a.total);
})();

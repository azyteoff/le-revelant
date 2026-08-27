import "server-only";
import { metaEnregistrees, meta as metaCle } from "./stockage";
import { salads, drinks, desserts, builderGroups, slugIngredient } from "./catalog";

/**
 * La photothèque : tout ce que le restaurant peut remplacer lui-même.
 *
 * Une photo = un emplacement. L'emplacement ne change jamais de nom ni de
 * chemin ; seul son contenu est remplacé. C'est ce qui permet de téléverser
 * depuis le back-office sans toucher une ligne de code : le site demande
 * toujours `/img/hero.jpg`, on se contente de réécrire ce fichier.
 *
 * ⚠️ Comme pour l'ardoise, rien n'est importé au build : les fichiers sont
 * inspectés à chaque rendu serveur, sinon une photo envoyée à 11 h
 * n'apparaîtrait qu'au prochain déploiement.
 */

export type Forme = "paysage" | "carre" | "portrait";

export type Emplacement = {
  /** Identifiant stable, et chemin relatif dans public/img sans extension. */
  slot: string;
  titre: string;
  /** Où cette photo apparaît sur le site, en clair. */
  ou: string;
  forme: Forme;
};

export type Rubrique = {
  cle: string;
  titre: string;
  intro: string;
  emplacements: Emplacement[];
};

/** Largeur de sortie selon la forme : au-delà, on ne gagne rien à l'écran. */
export const LARGEURS: Record<Forme, number> = {
  paysage: 2000,
  portrait: 1400,
  carre: 900,
};

export const RUBRIQUES: Rubrique[] = [
  {
    cle: "accueil",
    titre: "La page d’accueil",
    intro:
      "Les quatre images qui donnent le ton. Ce sont elles qu’un client voit avant tout le reste.",
    emplacements: [
      { slot: "hero", titre: "Grande image d’ouverture", ou: "Tout en haut de l’accueil", forme: "paysage" },
      { slot: "composer-home", titre: "« Composez exactement la vôtre »", ou: "Bloc du bar à salade sur l’accueil", forme: "paysage" },
      { slot: "ingredients", titre: "Ingrédients frais", ou: "Bandeau de la page Composer", forme: "paysage" },
      { slot: "salade-composee", titre: "Salade composée", ou: "Aperçu du panier et page Composer", forme: "carre" },
    ],
  },
  {
    cle: "salades",
    titre: "Les salades signature",
    intro:
      "Une photo par recette de la carte. Cadrez de haut, le bol bien centré, à la lumière du jour.",
    emplacements: salads.map((s) => ({
      slot: s.image,
      titre: s.name,
      ou: "La carte, l’accueil et le panier",
      forme: "carre" as Forme,
    })),
  },
  {
    cle: "lieu",
    titre: "Le restaurant",
    intro: "La salle, le comptoir, la devanture. Trois images sur la page « Le restaurant ».",
    emplacements: [
      { slot: "salle-1", titre: "Photo du lieu nº 1", ou: "Page Le restaurant — grande image", forme: "paysage" },
      { slot: "salle-2", titre: "Photo du lieu nº 2", ou: "Page Le restaurant", forme: "portrait" },
      { slot: "salle-3", titre: "Photo du lieu nº 3", ou: "Page Le restaurant", forme: "portrait" },
    ],
  },
  {
    cle: "ingredients",
    titre: "Le bar à salade",
    intro:
      "Une vignette par bac. Photographiez le bac de haut, cadré carré, sans flash. Sans photo, la case affiche un aplat de couleur — le composeur reste propre.",
    emplacements: builderGroups.flatMap((g) =>
      g.items.map((nom) => ({
        slot: `ingredients/${slugIngredient(nom)}`,
        titre: nom,
        ou: g.title,
        forme: "carre" as Forme,
      }))
    ),
  },
  {
    cle: "desserts",
    titre: "Desserts et boissons",
    intro: "Les vignettes de la carte. Utiles surtout pour les desserts faits maison.",
    emplacements: [
      ...desserts.map((d) => ({
        slot: d.image,
        titre: d.name,
        ou: "Desserts, sur la carte et au panier",
        forme: "carre" as Forme,
      })),
      ...drinks.map((d) => ({
        slot: d.image,
        titre: d.name,
        ou: "Boissons, sur la carte et au panier",
        forme: "carre" as Forme,
      })),
    ],
  },
];

const TOUS = new Map(RUBRIQUES.flatMap((r) => r.emplacements).map((e) => [e.slot, e]));

/** Un slot connu, ou `null`. Sert de garde-fou côté API : jamais de chemin libre. */
export function emplacement(slot: string): Emplacement | null {
  return TOUS.get(slot) ?? null;
}

export const DOSSIER_IMG = "public/img";
/** Copie de la photo d'origine, pour pouvoir revenir en arrière. */
export const DOSSIER_ORIGINAUX = "content/photos-originales";

/** Clé de la photo dans le magasin. Les deux implémentations la partagent. */
export const clephoto = (slot: string) => `${DOSSIER_IMG}/${slot}.jpg`;
export const cleOriginal = (slot: string) =>
  `${DOSSIER_ORIGINAUX}/${slot.replace(/\//g, "__")}.jpg`;

export type EtatPhoto = {
  /** Le fichier existe-t-il ? */
  presente: boolean;
  /**
   * Empreinte de la version en place (date de modification). Ajoutée en
   * `?v=` derrière l'URL : sans elle, le navigateur ressert la photo
   * précédente depuis son cache.
   */
  version: string;
  /** Une photo d'origine est-elle mise de côté ? Alors on peut la restaurer. */
  restaurable: boolean;
};

async function etat(slot: string): Promise<EtatPhoto> {
  const [fichier, original] = await Promise.all([
    metaCle(clephoto(slot)),
    metaCle(cleOriginal(slot)),
  ]);
  return {
    presente: Boolean(fichier),
    version: fichier ? String(fichier.modifieLe) : "0",
    restaurable: Boolean(original),
  };
}

/**
 * L'état de tous les emplacements, en deux listings au lieu de 114 appels.
 *
 * L'écran Photos affiche 57 cases ; interroger chacune séparément rendait la
 * page lente en ligne, où chaque interrogation part sur le réseau.
 */
export async function etatPhotos(): Promise<Record<string, EtatPhoto>> {
  const [photos, originaux] = await Promise.all([
    metaEnregistrees(DOSSIER_IMG),
    metaEnregistrees(DOSSIER_ORIGINAUX),
  ]);

  const slots = [...TOUS.keys()];
  // Un emplacement jamais remplacé n'est pas dans le magasin : sa photo est
  // celle livrée avec le site, et c'est le disque qui répond.
  const manquants = slots.filter((s) => !photos.has(clephoto(s)));
  const surDisque = await Promise.all(manquants.map((s) => metaCle(clephoto(s))));
  manquants.forEach((s, i) => {
    const m = surDisque[i];
    if (m) photos.set(clephoto(s), m);
  });

  return Object.fromEntries(
    slots.map((s) => {
      const p = photos.get(clephoto(s));
      return [
        s,
        {
          presente: Boolean(p),
          version: p ? String(p.modifieLe) : "0",
          restaurable: originaux.has(cleOriginal(s)),
        },
      ];
    })
  );
}

export { etat as etatPhoto };

/**
 * Les vignettes du bar à salade réellement disponibles, sous la forme
 * `slug → version`. Le composeur s'en sert pour savoir quelles cases
 * afficher en photo ; c'est lu à l'exécution, donc une vignette envoyée
 * depuis le back-office apparaît immédiatement.
 */
export async function vignettesIngredients(): Promise<Record<string, string>> {
  const etats = await etatPhotos();
  const carte: Record<string, string> = {};
  for (const [slot, e] of Object.entries(etats)) {
    if (!slot.startsWith("ingredients/") || !e.presente) continue;
    carte[slot.slice("ingredients/".length)] = e.version;
  }
  return carte;
}

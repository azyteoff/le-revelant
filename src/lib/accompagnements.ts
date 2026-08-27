import "server-only";
import { lireTexte, ecrireTexte } from "./stockage";

/**
 * Le répertoire des bases et des garnitures.
 *
 * Contrairement aux 208 recettes, cette liste n'a pas été relevée une fois
 * pour toutes : la cuisine invente des garnitures au fil des saisons. Le
 * répertoire s'enrichit donc tout seul — une garniture saisie pour la
 * première fois dans le back-office y est ajoutée, et se propose ensuite
 * d'un clic les jours suivants.
 *
 * ⚠️ Lu à l'exécution, jamais importé au build : voir la note de
 * `src/lib/ardoise.ts`.
 */

export const CLE_ACCOMPAGNEMENTS = "content/accompagnements.json";

export type Accompagnement = {
  nom: string;
  description?: string;
};

export type Repertoire = {
  bases: Accompagnement[];
  garnitures: Accompagnement[];
};

/** Comparaison souple : « Pois cassés » et « pois casses » sont le même. */
export const normaliserAccompagnement = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const VIDE: Repertoire = { bases: [], garnitures: [] };

function assainir(liste: unknown): Accompagnement[] {
  if (!Array.isArray(liste)) return [];
  const vus = new Set<string>();
  const propre: Accompagnement[] = [];
  for (const brut of liste) {
    const nom = String((brut as Accompagnement)?.nom ?? "").trim().slice(0, 60);
    if (!nom) continue;
    const cle = normaliserAccompagnement(nom);
    if (vus.has(cle)) continue;
    vus.add(cle);
    const description = String((brut as Accompagnement)?.description ?? "")
      .trim()
      .slice(0, 200);
    propre.push(description ? { nom, description } : { nom });
  }
  return propre;
}

export async function lireAccompagnements(): Promise<Repertoire> {
  try {
    const texte = await lireTexte(CLE_ACCOMPAGNEMENTS);
    if (texte === null) return VIDE;
    const brut = JSON.parse(texte);
    return { bases: assainir(brut.bases), garnitures: assainir(brut.garnitures) };
  } catch (err) {
    // Fichier absent ou illisible : le composeur de plat se masque, le reste
    // du site continue de fonctionner normalement.
    console.error("Répertoire des accompagnements illisible :", err);
    return VIDE;
  }
}

/**
 * Ajoute au répertoire ce qui n'y figure pas encore. Renvoie les noms
 * réellement ajoutés, pour pouvoir le dire au restaurant.
 */
export async function enrichirRepertoire(
  bases: string[],
  garnitures: string[]
): Promise<string[]> {
  const actuel = await lireAccompagnements();
  const ajoutes: string[] = [];

  const fusionner = (existants: Accompagnement[], nouveaux: string[]) => {
    const connus = new Set(existants.map((a) => normaliserAccompagnement(a.nom)));
    const sortie = [...existants];
    for (const nom of nouveaux) {
      const propre = nom.trim().slice(0, 60);
      if (!propre) continue;
      const cle = normaliserAccompagnement(propre);
      if (connus.has(cle)) continue;
      connus.add(cle);
      sortie.push({ nom: propre });
      ajoutes.push(propre);
    }
    // Ordre alphabétique : dans le back-office, on cherche à l'œil.
    return sortie.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  };

  const suivant = {
    bases: fusionner(actuel.bases, bases),
    garnitures: fusionner(actuel.garnitures, garnitures),
  };

  if (ajoutes.length === 0) return [];

  try {
    // Le bloc d'aide est relu depuis le disque plutôt que reconstruit :
    // quelqu'un a pu le compléter à la main.
    const brut = JSON.parse((await lireTexte(CLE_ACCOMPAGNEMENTS)) ?? "{}");
    await ecrireTexte(
      CLE_ACCOMPAGNEMENTS,
      JSON.stringify({ ...brut, ...suivant }, null, 2) + "\n"
    );
  } catch (err) {
    // Disque en lecture seule : l'ardoise du jour reste enregistrée, seule
    // la mémorisation pour les jours suivants est perdue. Rien de bloquant.
    console.error("Répertoire des accompagnements non enrichi :", err);
    return [];
  }

  return ajoutes;
}

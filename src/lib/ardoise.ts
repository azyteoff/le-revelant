import "server-only";
import { lireTexte } from "./stockage";
import { salads, type Salad } from "./catalog";
import { repertoirePlats, normaliser, type Plat } from "./plats";
import {
  lireAccompagnements,
  normaliserAccompagnement,
  type Accompagnement,
} from "./accompagnements";

/**
 * L'ardoise du jour, lue à l'exécution.
 *
 * ⚠️ Ne jamais revenir à `import ardoise from "content/ardoise.json"` : un
 * import JSON est résolu par le bundler **au build**. Le fichier aurait beau
 * changer sur le disque, le site continuerait de servir la version figée —
 * c'est exactement ce qui se passait avant, et ce qui rendait le back-office
 * sans effet sur les pages publiques.
 *
 * On lit donc l'ardoise à chaque rendu serveur, via le magasin
 * (`src/lib/stockage.ts`) : le fichier du projet en local, Vercel Blob en
 * ligne. Les pages restent pré-rendues pour la vitesse, et l'écriture depuis
 * le back-office déclenche leur régénération (`revalidatePath`).
 */

export const CLE_ARDOISE = "content/ardoise.json";

export type ArdoiseBrute = {
  plats: string[];
  bases: string[];
  garnitures: string[];
  platsCommandables: boolean;
  salades: string[];
  message: string | null;
};

export type Ardoise = {
  /** Les plats du jour résolus ; les noms inconnus sont ignorés. */
  platsDuJour: Plat[];
  /** Les bases proposées avec les plats mijotés aujourd'hui. */
  basesDuJour: Accompagnement[];
  /** Les garnitures proposées avec les plats mijotés aujourd'hui. */
  garnituresDuJour: Accompagnement[];
  /**
   * Peut-on composer son plat chaud ? Il y faut au moins un plat et une
   * base ; sans cela le composeur de plat ne s'affiche pas.
   */
  platComposable: boolean;
  /** Les plats sont-ils vendus en ligne aujourd'hui ? */
  platsCommandables: boolean;
  /** Liste vide dans le fichier = les cinq recettes signature. */
  saladesDuJour: Salad[];
  /** Les noms tels que saisis, pour l'écran d'administration. */
  saladesChoisies: string[];
  messageDuJour: string | null;
};

const PAR_DEFAUT: Ardoise = {
  platsDuJour: [],
  basesDuJour: [],
  garnituresDuJour: [],
  platComposable: false,
  platsCommandables: true,
  saladesDuJour: salads,
  saladesChoisies: [],
  messageDuJour: null,
};

export async function lireArdoise(): Promise<Ardoise> {
  let brute: Partial<ArdoiseBrute>;
  try {
    const texte = await lireTexte(CLE_ARDOISE);
    if (texte === null) return PAR_DEFAUT;
    brute = JSON.parse(texte);
  } catch (err) {
    // Fichier absent ou illisible : le site doit rester debout.
    console.error("Ardoise illisible, valeurs par défaut :", err);
    return PAR_DEFAUT;
  }

  const platsDuJour = (brute.plats ?? [])
    .map((nom) => repertoirePlats.find((p) => normaliser(p.nom) === normaliser(nom)) ?? null)
    .filter((p): p is Plat => p !== null);

  // Les bases et garnitures sont enrichies de leur description quand le
  // répertoire en connaît une ; sinon le nom seul suffit.
  const repertoire = await lireAccompagnements();
  const resoudre = (noms: string[] | undefined, connus: Accompagnement[]) =>
    (noms ?? [])
      .map((nom) => String(nom).trim())
      .filter(Boolean)
      .map(
        (nom) =>
          connus.find(
            (a) => normaliserAccompagnement(a.nom) === normaliserAccompagnement(nom)
          ) ?? { nom }
      );

  const basesDuJour = resoudre(brute.bases, repertoire.bases);
  const garnituresDuJour = resoudre(brute.garnitures, repertoire.garnitures);

  const saladesChoisies = brute.salades ?? [];
  const choisies = saladesChoisies
    .map((nom) => salads.find((s) => normaliser(s.name) === normaliser(nom)))
    .filter((s): s is Salad => Boolean(s));

  return {
    platsDuJour,
    basesDuJour,
    garnituresDuJour,
    // Sans base, « composez votre plat » n'aurait aucun sens : on masque.
    platComposable: platsDuJour.length > 0 && basesDuJour.length > 0,
    platsCommandables: brute.platsCommandables !== false,
    saladesDuJour: choisies.length ? choisies : salads,
    saladesChoisies,
    messageDuJour: brute.message?.trim() || null,
  };
}

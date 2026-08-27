import { lireTexte, ecrireTexte, listerEnregistre } from "./stockage";

/**
 * Journal des commandes.
 *
 * Un fichier JSON par jour dans `data/commandes/AAAA-MM-JJ.json`. Pas de base
 * de données : un service compte quelques dizaines de commandes, un fichier
 * fait très bien l'affaire, se sauvegarde en le copiant et se lit sans outil.
 *
 * Le fichier passe par le magasin (`src/lib/stockage.ts`) : le disque du
 * projet en local, Vercel Blob en ligne. Le journal survit donc aux
 * déploiements, y compris sur un hébergement sans disque inscriptible.
 *
 * L'écriture n'interrompt jamais une commande : si elle échoue, le client
 * est servi normalement et l'incident part dans les journaux du serveur.
 */

export type LigneCommande = {
  nom: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
};

export type Commande = {
  reference: string;
  recuLe: string; // ISO
  jourRetrait: "aujourdhui" | "demain";
  creneau: string;
  client: { prenom: string; email: string; telephone: string };
  notes: string;
  lignes: LigneCommande[];
  sousTotal: number;
  remise: number;
  total: number;
  paiement: "en ligne" | "démonstration";
  etat: "recue" | "preparee" | "remise";
};

const RACINE = "data/commandes";

/** Clé du jour, au fuseau de Paris. */
export function jourParis(date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const fichierDu = (jour: string) => `${RACINE}/${jour}.json`;

export async function lireCommandes(jour = jourParis()): Promise<Commande[]> {
  try {
    const brut = await lireTexte(fichierDu(jour));
    if (brut === null) return [];
    const liste = JSON.parse(brut) as Commande[];
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

/**
 * Ajoute une commande au journal du jour de retrait.
 *
 * N'échoue jamais bruyamment : si le disque est en lecture seule, on trace et
 * on continue. Le paiement du client ne doit pas dépendre de ce journal.
 */
export async function enregistrerCommande(commande: Commande): Promise<void> {
  const jour =
    commande.jourRetrait === "demain" ? prochainJourCle() : jourParis();
  try {
    const existantes = await lireCommandes(jour);
    existantes.push(commande);
    await ecrireTexte(fichierDu(jour), JSON.stringify(existantes, null, 2) + "\n");
  } catch (err) {
    console.error(
      "Journal des commandes non écrit (disque en lecture seule ?) :",
      err instanceof Error ? err.message : err
    );
  }
}

export async function changerEtat(
  jour: string,
  reference: string,
  etat: Commande["etat"]
): Promise<boolean> {
  const liste = await lireCommandes(jour);
  const cible = liste.find((c) => c.reference === reference);
  if (!cible) return false;
  cible.etat = etat;
  try {
    await ecrireTexte(fichierDu(jour), JSON.stringify(liste, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

/** Les jours pour lesquels un journal existe, du plus récent au plus ancien. */
export async function joursDisponibles(): Promise<string[]> {
  try {
    const fichiers = (await listerEnregistre(RACINE)).map((c) => c.split("/").pop()!);
    return fichiers
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/** Clé du prochain jour ouvré, pour les commandes de la veille. */
function prochainJourCle(): string {
  const paris = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  do {
    paris.setDate(paris.getDate() + 1);
  } while (paris.getDay() === 0 || paris.getDay() === 6);
  return jourParis(paris);
}

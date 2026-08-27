import {
  SIZES,
  SIZES_COMPOSEE,
  FORMULES,
  salads,
  drinks,
  desserts,
  allBuilderItems,
} from "./catalog";
import { normaliser } from "./plats";
import { lireArdoise } from "./ardoise";
import { restaurant } from "./restaurant";
import { isEarlyBird, majorationComposee, type Retrait } from "./pricing";

/** Ligne telle qu’elle arrive du client. Rien n’y est digne de confiance. */
export type IncomingLine = {
  kind?: unknown;
  name?: unknown;
  detail?: unknown;
  size?: unknown;
  formule?: unknown;
  qty?: unknown;
};

export type PricedLine = {
  name: string;
  description: string;
  unitPrice: number;
  qty: number;
};

export class OrderError extends Error {}

const MAX_QTY = 20;

/**
 * Retarifie la commande côté serveur à partir du catalogue.
 *
 * Le prix envoyé par le navigateur n’est jamais lu : on retrouve chaque
 * produit par son nom dans le catalogue et on applique le tarif officiel.
 * Sans cela, un client peut se fabriquer une salade à 0 €.
 */
export async function priceOrder(
  lines: unknown,
  retrait: Retrait = "aujourdhui",
  now = new Date()
) {
  // L'ardoise est relue à chaque commande : elle a pu changer depuis le
  // démarrage du serveur, et c'est elle qui dit ce qui est vendable.
  const { platsDuJour, basesDuJour, garnituresDuJour, platsCommandables } =
    await lireArdoise();

  // La majoration des salades composées dépend de l'heure de commande, pas de
  // ce que le navigateur prétend : elle est recalculée ici.
  const majoration = majorationComposee(now);

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new OrderError("Panier vide.");
  }
  if (lines.length > 40) throw new OrderError("Panier trop volumineux.");

  const priced: PricedLine[] = lines.map((raw: IncomingLine) => {
    const qty = Math.floor(Number(raw?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      throw new OrderError("Quantité invalide.");
    }

    const kind = String(raw?.kind ?? "");
    const name = String(raw?.name ?? "").trim();
    if (!name) throw new OrderError("Produit inconnu.");

    // Salade signature : grille SIZES.
    if (kind === "salade") {
      const size = SIZES.find((s) => s.key === raw?.size);
      if (!size) throw new OrderError(`Format inconnu pour « ${name} ».`);
      const salad = salads.find((s) => name.startsWith(s.name));
      if (!salad) throw new OrderError(`Recette inconnue : « ${name} ».`);
      return {
        name: `${salad.name} — ${size.label}`,
        description: salad.ingredients.join(", "),
        unitPrice: size.price,
        qty,
      };
    }

    // Salade composée : grille propre, plus la majoration horaire.
    if (kind === "composee") {
      const size = SIZES_COMPOSEE.find((s) => s.key === raw?.size);
      if (!size) throw new OrderError(`Format inconnu pour « ${name} ».`);

      const detail = Array.isArray(raw?.detail) ? raw.detail.map(String) : [];
      const unknown = detail.filter((i) => !allBuilderItems.includes(i));
      if (unknown.length) {
        throw new OrderError(`Ingrédient indisponible : ${unknown[0]}.`);
      }
      return {
        name: `Salade composée — ${size.label}`,
        description: detail.join(", ") || "Composition libre",
        unitPrice: size.price + majoration,
        qty,
      };
    }

    // Plat mijoté : grille FORMULES, et seulement s'il est à l'ardoise du jour.
    if (kind === "plat") {
      if (!platsCommandables) {
        throw new OrderError(
          "Les plats mijotés se commandent au comptoir. Appelez-nous pour les réserver."
        );
      }
      const plat = platsDuJour.find((p) => normaliser(name).startsWith(normaliser(p.nom)));
      if (!plat) throw new OrderError(`« ${name} » n’est pas à l’ardoise aujourd’hui.`);

      const detail = Array.isArray(raw?.detail) ? raw.detail.map(String) : [];

      // Plat composé : le client a choisi lui-même sa base et ses
      // garnitures. On ne lit pas la formule qu'il annonce — elle se déduit
      // de ce qu'il a réellement pris, sinon on pourrait réclamer trois
      // garnitures au tarif sans garniture.
      if (detail.length) {
        const estBase = (n: string) =>
          basesDuJour.some((b) => normaliser(b.nom) === normaliser(n));
        const estGarniture = (n: string) =>
          garnituresDuJour.some((g) => normaliser(g.nom) === normaliser(n));

        const inconnu = detail.find((n) => !estBase(n) && !estGarniture(n));
        if (inconnu) {
          throw new OrderError(`« ${inconnu} » n’est pas proposé aujourd’hui.`);
        }

        const bases = detail.filter(estBase);
        if (bases.length !== 1) {
          throw new OrderError("Choisissez une base, et une seule.");
        }
        const garnitures = detail.filter(estGarniture);
        if (garnitures.length > 1) {
          throw new OrderError("Une seule garniture par plat.");
        }

        const formuleReelle = FORMULES.find(
          (f) => f.key === (garnitures.length ? "complet" : "plat")
        )!;
        return {
          name: `${plat.nom} — ${formuleReelle.label}`,
          description: [bases[0], ...garnitures].join(", "),
          unitPrice: formuleReelle.price,
          qty,
        };
      }

      // Plat sans composition : le restaurant choisit la base et la
      // garniture, le client ne choisit que la formule.
      const formule = FORMULES.find((f) => f.key === raw?.formule);
      if (!formule) throw new OrderError(`Formule inconnue pour « ${name} ».`);
      return {
        name: `${plat.nom} — ${formule.label}`,
        description: plat.description,
        unitPrice: formule.price,
        qty,
      };
    }

    const catalogue = kind === "boisson" ? drinks : kind === "dessert" ? desserts : null;
    if (!catalogue) throw new OrderError(`Catégorie inconnue : « ${kind} ».`);

    const product = catalogue.find((p) => p.name === name);
    if (!product) throw new OrderError(`Produit inconnu : « ${name} ».`);
    return { name: product.name, description: "", unitPrice: product.price, qty };
  });

  const subtotal = priced.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const earlyBird = isEarlyBird(retrait, now);
  const discount = earlyBird
    ? Math.round(subtotal * restaurant.earlyBird.rate * 100) / 100
    : 0;

  return {
    lines: priced,
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
    earlyBird,
  };
}

/** Référence lisible pour le comptoir : LR-4X8K2. */
export function orderReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  for (const b of bytes) ref += alphabet[b % alphabet.length];
  return `LR-${ref}`;
}

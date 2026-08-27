import { restaurant } from "./restaurant";
import { MAJORATION_COMPOSEE } from "./catalog";
import type { CartLine } from "./cart";

export type Retrait = "aujourdhui" | "demain";

export type Totals = {
  subtotal: number;
  /** Majoration des salades composées passé 11h48, incluse dans le sous-total. */
  majoration: number;
  discount: number;
  total: number;
  earlyBird: boolean;
};

/** Heure de Paris, quel que soit le fuseau de la machine. */
const heureParis = (now: Date) =>
  new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));

const enMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Majoration des salades composées.
 *
 * Passé 11h48, une salade assemblée au comptoir coûte 2 € de plus : c'est
 * l'heure à laquelle le comptoir bascule en plein service. Elle ne s'applique
 * qu'aux compositions — jamais aux recettes signature, déjà préparées.
 */
export function majorationComposee(now = new Date()): number {
  const paris = heureParis(now);
  const minutes = paris.getHours() * 60 + paris.getMinutes();
  return minutes >= enMinutes(MAJORATION_COMPOSEE.heure) ? MAJORATION_COMPOSEE.montant : 0;
}

/**
 * Remise précommande : −10 %.
 *
 * Deux façons d'y avoir droit, comme au restaurant :
 *  · commander avant 11h45 pour un retrait le jour même ;
 *  · commander pour le lendemain, à n'importe quelle heure — c'est la
 *    « commande de la veille ».
 *
 * `now` est injectable pour rester testable et déterministe côté serveur.
 */
export function isEarlyBird(retrait: Retrait = "aujourdhui", now = new Date()): boolean {
  if (retrait === "demain") return true;

  const paris = heureParis(now);
  const jour = paris.getDay(); // 0 = dimanche
  if (jour === 0 || jour === 6) return false;

  const minutes = paris.getHours() * 60 + paris.getMinutes();
  return minutes < enMinutes(restaurant.earlyBird.cutoff);
}

export function computeTotals(
  lines: CartLine[],
  retrait: Retrait = "aujourdhui",
  now?: Date
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  // La majoration est déjà comprise dans le prix unitaire des lignes
  // composées : on l'isole uniquement pour pouvoir l'expliquer au client.
  const majoration = lines
    .filter((l) => l.kind === "composee")
    .reduce((sum, l) => sum + (l.majoration ?? 0) * l.qty, 0);

  const earlyBird = subtotal > 0 && isEarlyBird(retrait, now);
  const discount = earlyBird
    ? Math.round(subtotal * restaurant.earlyBird.rate * 100) / 100
    : 0;

  return {
    subtotal,
    majoration,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
    earlyBird,
  };
}

/** Minutes restantes avant la fin de la remise du jour, ou null. */
export function minutesUntilCutoff(now = new Date()): number | null {
  const paris = heureParis(now);
  const jour = paris.getDay();
  if (jour === 0 || jour === 6) return null;
  const diff =
    enMinutes(restaurant.earlyBird.cutoff) - (paris.getHours() * 60 + paris.getMinutes());
  return diff > 0 ? diff : null;
}

/** Le prochain jour de service ouvert, pour l'option « demain ». */
export function prochainJourOuvre(now = new Date()): string {
  const paris = heureParis(now);
  const suivant = new Date(paris);
  do {
    suivant.setDate(suivant.getDate() + 1);
  } while (suivant.getDay() === 0 || suivant.getDay() === 6);

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(suivant);
}

/** Créneaux de retrait, par tranches de 15 min sur le service. */
export function pickupSlots(now = new Date()): string[] {
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const nowMin = paris.getHours() * 60 + paris.getMinutes();
  const slots: string[] = [];
  for (let m = 12 * 60; m <= 14 * 60 + 45; m += 15) {
    // 15 min de préparation minimum.
    if (m >= nowMin + 15) {
      slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}`);
    }
  }
  return slots.length ? slots : ["Dès l’ouverture, 12h00"];
}

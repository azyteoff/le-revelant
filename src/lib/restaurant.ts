/**
 * Source unique de vérité pour les informations du restaurant.
 * Toutes les données proviennent du site actuel (revelant-restaurant.fr).
 */

export const restaurant = {
  name: "Le Révélant",
  tagline: "Le déjeuner frais et gourmand à Paris",
  description:
    "Salades composées, préparées chaque matin rue Guillaume Tell dans le 17e arrondissement de Paris. Recettes du jour, bar à salade, commande en ligne.",
  street: "23 rue Guillaume Tell",
  postalCode: "75017",
  city: "Paris",
  district: "17e arrondissement",
  country: "FR",
  phone: "01 47 63 07 01",
  phoneHref: "+33147630701",
  mobile: "06 21 96 88 98",
  mobileHref: "+33621968898",
  email: "contact@revelant-restaurant.fr",
  geo: { lat: 48.8846, lng: 2.2952 },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=23+rue+Guillaume+Tell+75017+Paris",
  mapsEmbed:
    "https://www.google.com/maps?q=23+rue+Guillaume+Tell,+75017+Paris&output=embed",
  instagram: "https://www.instagram.com/",
  /** Horaires réels : du lundi au vendredi, 12h – 15h. */
  hours: [
    { day: "Lundi", open: "12:00", close: "15:00" },
    { day: "Mardi", open: "12:00", close: "15:00" },
    { day: "Mercredi", open: "12:00", close: "15:00" },
    { day: "Jeudi", open: "12:00", close: "15:00" },
    { day: "Vendredi", open: "12:00", close: "15:00" },
    { day: "Samedi", open: null, close: null },
    { day: "Dimanche", open: null, close: null },
  ],
  /** Précommande avant 11h45 → 10 % de remise. */
  earlyBird: { cutoff: "11:45", rate: 0.1 },
  /**
   * Accès transports. `logo: true` bascule sur le vrai logo officiel, à
   * déposer dans public/img/transports/ (metro-3.svg, rer-c.svg). Tant qu'il
   * vaut false, la pastille est dessinée aux couleurs de la ligne.
   */
  metro: [
    { reseau: "metro" as const, ligne: "3", station: "Pereire", logo: false },
    { reseau: "rer" as const, ligne: "C", station: "Pereire — Levallois", logo: false },
  ],
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://revelant-restaurant.fr";

const SCHEMA_DAY: Record<string, string> = {
  Lundi: "Monday",
  Mardi: "Tuesday",
  Mercredi: "Wednesday",
  Jeudi: "Thursday",
  Vendredi: "Friday",
  Samedi: "Saturday",
  Dimanche: "Sunday",
};

/** Horaires au format Schema.org (openingHoursSpecification). */
export const openingHoursSpec = restaurant.hours
  .filter((h) => h.open !== null)
  .map((h) => ({
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: `https://schema.org/${SCHEMA_DAY[h.day]}`,
    opens: h.open,
    closes: h.close,
  }));

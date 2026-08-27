import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileOrderBar } from "@/components/site/MobileOrderBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { restaurant, SITE_URL, openingHoursSpec } from "@/lib/restaurant";
import { salads, drinks, desserts, SIZES, FORMULES } from "@/lib/catalog";
import { lireArdoise } from "@/lib/ardoise";

/** Données structurées : fiche restaurant + carte complète. */
async function StructuredData() {
  const { platsDuJour, platsCommandables } = await lireArdoise();
  const menuSection = (
    name: string,
    items: { name: string; description?: string; price: number }[]
  ) => ({
    "@type": "MenuSection",
    name,
    hasMenuItem: items.map((i) => ({
      "@type": "MenuItem",
      name: i.name,
      ...(i.description ? { description: i.description } : {}),
      offers: { "@type": "Offer", price: i.price.toFixed(2), priceCurrency: "EUR" },
    })),
  });

  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE_URL}/#restaurant`,
    name: restaurant.name,
    description: restaurant.description,
    url: SITE_URL,
    telephone: restaurant.phoneHref,
    image: [`${SITE_URL}/img/hero.jpg`, `${SITE_URL}/img/salle-1.jpg`],
    servesCuisine: ["Salades", "Cuisine française", "Healthy"],
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Carte bancaire, Apple Pay, Google Pay",
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.street,
      addressLocality: restaurant.city,
      postalCode: restaurant.postalCode,
      addressCountry: restaurant.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: restaurant.geo.lat,
      longitude: restaurant.geo.lng,
    },
    openingHoursSpecification: openingHoursSpec,
    acceptsReservations: false,
    hasMap: restaurant.mapsUrl,
    sameAs: [restaurant.instagram],
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/la-carte`,
        inLanguage: "fr-FR",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/IOSPlatform",
          "https://schema.org/AndroidPlatform",
        ],
      },
      deliveryMethod: "https://schema.org/OnSitePickup",
    },
    hasMenu: {
      "@type": "Menu",
      name: "La carte du Révélant",
      inLanguage: "fr-FR",
      hasMenuSection: [
        menuSection(
          "Salades signature",
          salads.map((s) => ({
            name: s.name,
            description: s.ingredients.join(", "),
            price: SIZES[0].price,
          }))
        ),
        // Les plats chauds changent tous les jours : on déclare ceux qui sont
        // effectivement à l'ardoise, avec leurs deux formules.
        ...(platsDuJour.length
          ? [
              {
                "@type": "MenuSection",
                name: "Plats mijotés du jour",
                hasMenuItem: platsDuJour.map((p) => ({
                  "@type": "MenuItem",
                  name: p.nom,
                  description: p.description,
                  ...(platsCommandables
                    ? {
                        offers: FORMULES.map((f) => ({
                          "@type": "Offer",
                          name: f.label,
                          price: f.price.toFixed(2),
                          priceCurrency: "EUR",
                        })),
                      }
                    : {}),
                })),
              },
            ]
          : []),
        menuSection("Boissons", drinks),
        menuSection("Desserts", desserts),
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      // Données statiques issues du catalogue, aucune entrée utilisateur.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Habillage du site public : en-tête, pied de page, panier, barre mobile.
 *
 * Le back-office vit hors de ce groupe : il n'a que faire d'un panier ni
 * d'une navigation client, et l'ouvrir sur l'en-tête du site prêterait à
 * confusion entre « ce que voit le client » et « ce que je modifie ».
 */
// Le contenu du jour est relu à chaque rendu : les pages restent
// pré-rendues, mais le back-office déclenche leur régénération.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-cream"
      >
        Aller au contenu
      </a>

      <Header />
      <main id="contenu">{children}</main>
      <Footer />

      <CartDrawer />
      <MobileOrderBar />
      <StructuredData />
    </>
  );
}

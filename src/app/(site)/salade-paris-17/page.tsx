import type { Metadata } from "next";
import Link from "next/link";
import { RecipeCard } from "@/components/menu/RecipeCard";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { salads, SIZES, allBuilderItems } from "@/lib/catalog";
import { restaurant, SITE_URL } from "@/lib/restaurant";
import { euro } from "@/lib/utils";

/**
 * Page locale. Cible les recherches « salade Paris 17 », « déjeuner
 * Guillaume Tell », « bar à salade Pereire » — c’est-à-dire l’intention
 * d’un actif du quartier à 11h30. Contenu réel, pas de bourrage de
 * mots-clés : quartiers desservis, temps de trajet, FAQ balisée.
 */

export const metadata: Metadata = {
  title: "Salade à emporter Paris 17 — Pereire, Wagram, Ternes",
  description:
    "Salades composées à emporter dans le 17e : 5 recettes signature, bar à salade de 31 ingrédients, dès 10 €. 23 rue Guillaume Tell, métro Pereire. Commande en ligne, −10 % avant 11h45.",
  alternates: { canonical: "/salade-paris-17" },
};

const areas = [
  { name: "Pereire", walk: "2 min à pied" },
  { name: "Wagram", walk: "8 min à pied" },
  { name: "Ternes", walk: "12 min à pied" },
  { name: "Porte de Champerret", walk: "9 min à pied" },
  { name: "Villiers", walk: "14 min à pied" },
  { name: "Levallois-Perret", walk: "10 min à pied" },
];

const faq = [
  {
    q: "Où manger une salade composée dans le 17e arrondissement ?",
    a: `Le Révélant se trouve au ${restaurant.street}, ${restaurant.postalCode} ${restaurant.city}, à deux minutes du métro Pereire. Le service court de 12h à 15h du lundi au vendredi.`,
  },
  {
    q: "Combien coûte une salade ?",
    a: `${euro(SIZES[0].price)} en petite portion, ${euro(SIZES[1].price)} en grande — le même prix pour les recettes signature et pour les salades composées au bar. Boissons et desserts sont à ${euro(2)}.`,
  },
  {
    q: "Peut-on commander à l’avance et récupérer sur place ?",
    a: `Oui. La commande se fait en ligne, vous choisissez votre créneau de retrait et vous passez au comptoir. Toute commande passée avant ${restaurant.earlyBird.cutoff.replace(":", "h")} bénéficie de 10 % de remise.`,
  },
  {
    q: "Y a-t-il des options végétariennes et véganes ?",
    a: "Oui. La VégétaLienne est entièrement végétale (lentilles, tofu, pois chiches aux épices, guacamole, tomate, patate douce, brocolis, sésame). Le bar à salade permet aussi de composer une salade sans produit animal.",
  },
  {
    q: "Faut-il créer un compte pour commander ?",
    a: "Non, aucun compte ni mot de passe. On vous demande seulement un prénom, un e-mail et un téléphone pour vous prévenir quand la commande est prête. Le paiement se fait par Apple Pay, Google Pay ou carte bancaire.",
  },
];

export default function LocalPage() {
  return (
    <>
      <header className="border-b border-ink/8 bg-cream-2/40 pb-14 pt-32 md:pb-16 md:pt-40">
        <div className="shell">
          <p className="eyebrow">Paris 17e · Pereire</p>
          <h1 className="fluid-section mt-4 max-w-[18ch]">
            Une salade à emporter dans le 17e, préparée le matin même.
          </h1>
          <p className="mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-3">
            Le Révélant sert le déjeuner {restaurant.street.toLowerCase()}, entre
            Pereire et Porte de Champerret. Cinq recettes signature, un bar à salade
            de {allBuilderItems.length} ingrédients, et quatre plats mijotés qui changent
            chaque jour. Commande en ligne, retrait au comptoir entre 12h et 15h.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/la-carte" size="lg">
              Commander maintenant
            </ButtonLink>
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-ink/15 px-8 text-[0.9375rem] font-medium transition-colors hover:border-ink/35 hover:bg-ink/[0.04]"
            >
              Itinéraire
            </a>
          </div>
        </div>
      </header>

      <section className="bg-cream py-16 md:py-20">
        <div className="shell">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Les quartiers qu’on nourrit
            </h2>
            <p className="mt-4 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-3">
              Le restaurant est au cœur du 17e nord. Voici le temps de marche depuis
              les principaux points du quartier.
            </p>
          </Reveal>

          <ul className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {areas.map((a, i) => (
              <li key={a.name}>
                <Reveal
                  delay={(i % 3) * 0.05}
                  className="h-full rounded-lg border border-ink/8 bg-cream-2/50 px-5 py-4"
                >
                  <p className="text-[0.9375rem] font-medium">{a.name}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-ink-3">{a.walk}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-ink/8 bg-cream-2/40 py-16 md:py-20">
        <div className="shell">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Les recettes du moment
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
            {salads.slice(0, 3).map((salad, i) => (
              <Reveal key={salad.slug} delay={i * 0.06}>
                <RecipeCard salad={salad} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <Link
              href="/la-carte"
              className="text-[0.9375rem] font-medium underline underline-offset-[6px] hover:text-olive-deep"
            >
              Voir les cinq recettes et le bar à salade
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-16 md:py-20">
        <div className="shell max-w-3xl">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Questions fréquentes
            </h2>
          </Reveal>

          <dl className="mt-9 divide-y divide-ink/8 border-y border-ink/8">
            {/* `dl > div > (dt, dd)` : un seul niveau de div, sinon la liste
                de définitions n’est plus valide. */}
            {faq.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.04} className="py-6">
                <dt className="font-[family-name:var(--font-display)] text-[1.25rem] leading-snug">
                  {item.q}
                </dt>
                <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-3">
                  {item.a}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "FAQPage",
                mainEntity: faq.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Salade à Paris 17",
                    item: `${SITE_URL}/salade-paris-17`,
                  },
                ],
              },
            ],
          }),
        }}
      />
    </>
  );
}

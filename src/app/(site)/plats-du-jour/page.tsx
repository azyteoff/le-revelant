import type { Metadata } from "next";
import { PlatCard } from "@/components/menu/PlatCard";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { RepertoireListe } from "@/components/menu/RepertoireListe";
import { repertoirePlats, famillesPlats } from "@/lib/plats";
import { lireArdoise } from "@/lib/ardoise";
import { platsIntro } from "@/lib/catalog";
import { restaurant, SITE_URL } from "@/lib/restaurant";

export const metadata: Metadata = {
  title: `Les plats chauds du jour — ${repertoirePlats.length} recettes au répertoire`,
  description: `Quatre plats mijotés différents chaque midi au Révélant, Paris 17 : viandes, poissons et recettes végétariennes longuement cuisinés. ${repertoirePlats.length} recettes au répertoire.`,
  alternates: { canonical: "/plats-du-jour" },
};

export default async function PlatsPage() {
  const { platsDuJour, platsCommandables } = await lireArdoise();

  const aujourdhui = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <header className="border-b border-ink/8 bg-cream-2/40 pb-14 pt-32 md:pb-16 md:pt-40">
        <div className="shell">
          <p className="eyebrow">Les plats chauds</p>
          <h1 className="fluid-section mt-4 max-w-[16ch]">
            Mijotés le matin, servis le midi.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-3">
            {platsIntro} La sélection change tous les jours et se choisit parmi les{" "}
            {repertoirePlats.length} recettes du répertoire de la maison.
          </p>
        </div>
      </header>

      {platsDuJour.length > 0 && (
        <section className="bg-cream py-16 md:py-20">
          <div className="shell">
            <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
                À l’ardoise {aujourdhui}
              </h2>
              {!platsCommandables && (
                <p className="text-sm text-ink-3 md:pb-2">
                  À commander au comptoir ou au{" "}
                  <a
                    href={`tel:${restaurant.phoneHref}`}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    {restaurant.phone}
                  </a>
                </p>
              )}
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:grid-cols-4 md:gap-5">
              {platsDuJour.map((plat, i) => (
                <Reveal key={plat.slug} delay={(i % 4) * 0.05}>
                  <PlatCard plat={plat} commandable={platsCommandables} priority={i < 4} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-ink/8 bg-cream-2/40 py-16 md:py-20">
        <div className="shell">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Tout le répertoire
            </h2>
            <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-3">
              {repertoirePlats.length} recettes mises au point depuis l’ouverture.
              Aucune n’est servie tous les jours — c’est le principe de la maison.
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-8">
            <RepertoireListe plats={repertoirePlats} familles={famillesPlats} />
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-14">
        <div className="shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[1.5rem]">
              Une salade en plus ?
            </p>
            <p className="mt-1.5 text-sm text-ink-3">
              Cinq recettes signature et un bar à salade de 31 ingrédients.
            </p>
          </div>
          <ButtonLink href="/la-carte" size="lg">
            Voir la carte
          </ButtonLink>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Les plats du jour",
                item: `${SITE_URL}/plats-du-jour`,
              },
            ],
          }),
        }}
      />
    </>
  );
}

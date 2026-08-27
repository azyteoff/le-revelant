import type { Metadata } from "next";
import Link from "next/link";
import { Dish } from "@/components/ui/Dish";
import { RecipeCard } from "@/components/menu/RecipeCard";
import { SimpleRow } from "@/components/menu/SimpleRow";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { PlatCard } from "@/components/menu/PlatCard";
import { drinks, desserts, SIZES, platsIntro } from "@/lib/catalog";
import { repertoirePlats } from "@/lib/plats";
import { lireArdoise } from "@/lib/ardoise";
import { restaurant } from "@/lib/restaurant";
import { euro } from "@/lib/utils";

export const metadata: Metadata = {
  title: "La carte — salades, boissons et desserts",
  description:
    "Cinq salades signature, un bar à salade de 31 ingrédients, boissons et desserts à 2 €. Petite 10 €, grande 12 €. Commande en ligne, retrait 23 rue Guillaume Tell, Paris 17.",
  alternates: { canonical: "/la-carte" },
};

const sections = [
  { id: "salades", label: "Salades" },
  { id: "plats", label: "Plats chauds" },
  { id: "composer", label: "À composer" },
  { id: "boissons", label: "Boissons" },
  { id: "desserts", label: "Desserts" },
];

export default async function CartePage() {
  const { platsDuJour, platsCommandables, messageDuJour, saladesDuJour } = await lireArdoise();

  return (
    <>
      <header className="border-b border-ink/8 bg-cream-2/40 pb-14 pt-32 md:pb-16 md:pt-40">
        <div className="shell">
          <p className="eyebrow">La carte du jour</p>
          <h1 className="fluid-section mt-4 max-w-[16ch]">
            Tout ce qu’on sert aujourd’hui.
          </h1>
          <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-3">
            Deux formats pour chaque salade — {SIZES[0].label.toLowerCase()} à{" "}
            {euro(SIZES[0].price)}, {SIZES[1].label.toLowerCase()} à {euro(SIZES[1].price)}.
            Boissons et desserts à {euro(2)}. Quatre plats chauds différents chaque jour.
            Vous récupérez votre commande au comptoir, entre 12h et 15h.
          </p>
          {messageDuJour && (
            <p className="mt-6 inline-block rounded-full bg-olive-wash px-5 py-2.5 text-[0.875rem] font-medium text-olive-deep">
              {messageDuJour}
            </p>
          )}
        </div>
      </header>

      <CategoryNav sections={sections} />

      {/* ---------------------------------------------------------------- */}
      <section id="salades" className="scroll-mt-32 bg-cream py-16 md:py-20">
        <div className="shell">
          <Reveal className="flex items-end justify-between gap-6">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Salades signature
            </h2>
            <p className="hidden text-sm text-ink-3 md:block">
              Survolez pour voir la composition
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:grid-cols-3 md:gap-5">
            {saladesDuJour.map((salad, i) => (
              <Reveal key={salad.slug} delay={(i % 3) * 0.06}>
                <RecipeCard salad={salad} priority={i < 3} />
              </Reveal>
            ))}

            {/* Passerelle vers le bar à salade, au même niveau visuel */}
            <Reveal delay={0.12}>
              <Link
                href="/composer"
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg bg-olive-wash p-6 ring-1 ring-inset ring-ink/8"
              >
                <div className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-45">
                  <Dish slot="ingredients" alt="" fill sizes="33vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-olive-wash via-olive-wash/80 to-olive-wash/40" />
                <div className="relative">
                  <p className="eyebrow !text-olive-deep/70">Bar à salade</p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-olive-deep">
                    Composez la vôtre
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    31 ingrédients, même prix.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-olive-deep">
                    Commencer
                    <svg viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section id="plats" className="scroll-mt-32 border-y border-ink/8 bg-cream-2/40 py-16 md:py-20">
        <div className="shell">
          <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
                Plats chauds du jour
              </h2>
              <p className="mt-4 max-w-[54ch] text-[0.9375rem] leading-relaxed text-ink-3">
                {platsIntro}
              </p>
            </div>
            <Link
              href="/plats-du-jour"
              className="shrink-0 text-[0.875rem] underline underline-offset-4 hover:text-olive-deep md:pb-2"
            >
              Le répertoire ({repertoirePlats.length})
            </Link>
          </Reveal>

          {platsDuJour.length > 0 ? (
            <>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:grid-cols-4 md:gap-5">
                {platsDuJour.map((plat) => (
                  <Reveal key={plat.slug}>
                    <PlatCard plat={plat} commandable={platsCommandables} />
                  </Reveal>
                ))}
              </div>
              {!platsCommandables && (
                <Reveal className="mt-6">
                  <p className="text-[0.875rem] text-ink-3">
                    Les plats chauds se règlent au comptoir. Pour les réserver, appelez le{" "}
                    <a
                      href={`tel:${restaurant.phoneHref}`}
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {restaurant.phone}
                    </a>
                    .
                  </p>
                </Reveal>
              )}
            </>
          ) : (
            <Reveal className="mt-8">
              <p className="text-[0.9375rem] text-ink-3">
                L’ardoise du jour n’est pas encore affichée. Appelez le{" "}
                <a href={`tel:${restaurant.phoneHref}`} className="underline underline-offset-4">
                  {restaurant.phone}
                </a>{" "}
                pour connaître les plats.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section id="composer" className="scroll-mt-32 bg-cream py-16 md:py-20">
        <div className="shell grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Salade à composer
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-3">
              Une base, les légumes que vous voulez, autant de protéines que vous
              voulez, un crémeux, une finition. {euro(SIZES[0].price)} en petite,{" "}
              {euro(SIZES[1].price)} en grande — le même prix que nos recettes signature.
            </p>
            <p className="mt-4 text-sm text-ink-3">
              Majoration de {euro(2)} sur les salades composées l’après-midi.
            </p>
            <ButtonLink href="/composer" size="lg" className="mt-8">
              Composer ma salade
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-cream">
              <Dish
                slot="ingredients"
                alt="Ingrédients frais du bar à salade disposés sur fond clair"
                fill
                sizes="(min-width: 768px) 45vw, 92vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="bg-cream py-16 md:py-20">
        <div className="shell grid gap-12 md:grid-cols-2 md:gap-16">
          <Reveal id="boissons" className="scroll-mt-32">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Boissons
            </h2>
            <p className="mt-3 text-sm text-ink-3">Toutes à {euro(2)}.</p>
            <ul className="mt-7">
              {drinks.map((d) => (
                <SimpleRow key={d.slug} product={d} kind="boisson" />
              ))}
            </ul>
          </Reveal>

          <Reveal id="desserts" delay={0.06} className="scroll-mt-32">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Desserts
            </h2>
            <p className="mt-3 text-sm text-ink-3">Tous à {euro(2)}.</p>
            <ul className="mt-7">
              {desserts.map((d) => (
                <SimpleRow key={d.slug} product={d} kind="dessert" />
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-ink/8 bg-olive-wash/60 py-14">
        <div className="shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-olive-deep">
              Jusqu’à −15 % sur votre déjeuner
            </p>
            <p className="mt-1.5 text-sm text-ink-3">
              −10 % en précommandant la veille ou avant{" "}
              {restaurant.earlyBird.cutoff.replace(":", "h")} le jour même, et 5 % de plus
              avec un compte client créé au comptoir.
            </p>
          </div>
          <ButtonLink href="/commander" size="lg">
            Voir mon panier
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

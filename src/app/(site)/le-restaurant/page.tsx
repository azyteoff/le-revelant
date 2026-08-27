import type { Metadata } from "next";
import { Dish } from "@/components/ui/Dish";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PastilleLigne } from "@/components/ui/Ligne";
import { restaurant, SITE_URL } from "@/lib/restaurant";

export const metadata: Metadata = {
  title: "Le restaurant — 23 rue Guillaume Tell, Paris 17",
  description:
    "Le Révélant, 23 rue Guillaume Tell, 75017 Paris. Ouvert du lundi au vendredi de 12h à 15h. Salades composées, bar à salade, plats mijotés. Métro Pereire.",
  alternates: { canonical: "/le-restaurant" },
  openGraph: { images: ["/img/salle-1.jpg"] },
};

export default function RestaurantPage() {
  return (
    <>
      <header className="relative flex min-h-[62svh] items-end overflow-hidden bg-ink">
        <Dish
          slot="salle-1"
          alt="Salle claire du Révélant, avec plantes vertes et grandes fenêtres"
          fill
          priority
          sizes="100vw"
          // Bandeau décoratif sous un dégradé sombre : la compression peut
          // être poussée sans perte visible, et c’est lui qui porte le LCP.
          quality={50}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/40" />
        <div className="shell relative z-10 pb-14 pt-32">
          <p className="eyebrow !text-cream/60">Le lieu</p>
          <h1 className="fluid-section mt-4 max-w-[15ch] text-cream">
            Une salle claire, à deux pas de Pereire.
          </h1>
        </div>
      </header>

      <section className="bg-cream py-20 md:py-28">
        <div className="shell grid gap-14 md:grid-cols-[1.1fr_1fr] md:gap-20">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Ce qu’on fait ici
            </h2>
            <div className="mt-6 flex flex-col gap-5 text-[1.0625rem] leading-relaxed text-ink-2">
              <p>
                Le Révélant est une petite maison du 17e qui ne fait qu’une chose :
                le déjeuner. Les légumes sont taillés le matin, les protéines cuites
                sur place, les sauces montées à la main.
              </p>
              <p>
                Cinq salades signature, un bar à salade où vous composez la vôtre parmi
                trente et un ingrédients, et quatre plats mijotés qui changent tous les
                jours. À emporter, ou sur place si vous avez le temps de vous asseoir.
              </p>
              <p>
                Le service court de 12h à 15h, du lundi au vendredi. Précommandez la
                veille, ou le jour même avant 11h45 : vous économisez 10 % et vous ne
                faites pas la queue. Demandez-nous au comptoir la création de votre
                compte client sur notre caisse, et c’est 5 % de plus à chaque passage.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/la-carte" size="lg">
                Voir la carte
              </ButtonLink>
              <a
                href={`tel:${restaurant.phoneHref}`}
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full border border-ink/15 px-8 text-[0.9375rem] font-medium transition-colors hover:border-ink/35 hover:bg-ink/[0.04]"
              >
                Appeler le restaurant
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.08} id="horaires" className="scroll-mt-32">
            <div className="rounded-lg border border-ink/10 bg-cream-2/50 p-7">
              <h3 className="eyebrow">Horaires</h3>
              <dl className="mt-4 flex flex-col gap-2.5 text-[0.9375rem]">
                {restaurant.hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4">
                    <dt className={h.open ? "" : "text-ink-3"}>{h.day}</dt>
                    <dd className={h.open ? "tabular-nums" : "text-ink-3"}>
                      {h.open ? `${h.open.replace(":", "h")} — ${h.close?.replace(":", "h")}` : "Fermé"}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="eyebrow mt-8">Adresse</h3>
              <address className="mt-3 text-[0.9375rem] not-italic leading-relaxed">
                {restaurant.street}
                <br />
                {restaurant.postalCode} {restaurant.city}
              </address>

              <h3 className="eyebrow mt-8">Accès transports</h3>
              <ul className="mt-3 flex flex-col gap-2.5 text-[0.9375rem] text-ink-2">
                {restaurant.metro.map((m) => (
                  <li key={m.station} className="flex items-center gap-2.5">
                    <PastilleLigne {...m} />
                    {m.station}
                  </li>
                ))}
              </ul>

              <h3 className="eyebrow mt-8">Téléphone</h3>
              <p className="mt-3 flex flex-col gap-1 text-[0.9375rem]">
                <a href={`tel:${restaurant.phoneHref}`} className="underline-offset-4 hover:underline">
                  {restaurant.phone}
                </a>
                <a href={`tel:${restaurant.mobileHref}`} className="text-ink-3 underline-offset-4 hover:underline">
                  {restaurant.mobile}
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-ink/8 bg-cream-2/40 py-20 md:py-24">
        <div className="shell">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] md:text-[2.5rem]">
              Nous trouver
            </h2>
          </Reveal>

          <Reveal delay={0.06} className="mt-8 overflow-hidden rounded-lg border border-ink/10">
            <iframe
              title={`Plan d’accès — ${restaurant.name}, ${restaurant.street}`}
              src={restaurant.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[22rem] w-full md:h-[26rem]"
            />
          </Reveal>

          <Reveal delay={0.1} className="mt-4 flex justify-center">
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[0.9375rem] underline underline-offset-4 hover:text-olive-deep"
            >
              Ouvrir l’itinéraire dans Google Maps
            </a>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-20 md:py-24">
        <div className="shell grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {["salle-3", "ingredients", "salle-2"].map((slot, i) => (
            <Reveal key={slot} delay={i * 0.07}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-cream-2">
                <Dish slot={slot} alt="" fill sizes="(min-width: 768px) 33vw, 46vw" />
              </div>
            </Reveal>
          ))}
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
              { "@type": "ListItem", position: 2, name: "Le restaurant", item: `${SITE_URL}/le-restaurant` },
            ],
          }),
        }}
      />
    </>
  );
}

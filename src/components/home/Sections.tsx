import Link from "next/link";
import { Dish } from "@/components/ui/Dish";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Leaf } from "@/components/ui/Logo";
import { PastilleLigne } from "@/components/ui/Ligne";
import { builderGroups } from "@/lib/catalog";
import { repertoirePlats, famillesPlats } from "@/lib/plats";
import { restaurant } from "@/lib/restaurant";

/* ------------------------------------------------------------------ */
/*  Manifeste — pourquoi c’est différent, en trois phrases             */
/* ------------------------------------------------------------------ */

const pillars = [
  {
    title: "Cuisiné le matin même",
    body: "Tout est découpé, cuit et assemblé sur place avant le service. Rien n’attend au frigo depuis la veille.",
  },
  {
    title: "La carte change chaque jour",
    body: "Quatre plats mijotés et des salades qui suivent la saison. On revient le lendemain, ce n’est pas la même chose.",
  },
  {
    title: "Servi en deux minutes",
    body: "Vous commandez en ligne, vous passez, c’est prêt. La pause déjeuner reste une pause.",
  },
];

export function Manifesto() {
  return (
    <section aria-labelledby="manifeste" className="border-y border-ink/8 bg-cream-2/50">
      <h2 id="manifeste" className="sr-only">
        Ce qui distingue Le Révélant
      </h2>
      <div className="shell grid gap-10 py-20 md:grid-cols-3 md:gap-12 md:py-24">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <Leaf className="size-5 text-olive" />
            <h3 className="mt-5 font-[family-name:var(--font-display)] text-[1.5rem] leading-tight">
              {p.title}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-3">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar à salade                                                       */
/* ------------------------------------------------------------------ */

export function SaladBar() {
  const total = builderGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="shell grid items-center gap-12 md:grid-cols-2 md:gap-20">
        <Reveal className="order-2 md:order-1">
          <p className="eyebrow">Le bar à salade</p>
          <h2 className="fluid-section mt-4 max-w-[13ch]">
            Ou composez exactement la vôtre.
          </h2>
          <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-3">
            Une base, des légumes à volonté, autant de protéines que vous voulez, un crémeux, une finition.
            {" "}
            {total} ingrédients disponibles au comptoir — le même prix que nos
            recettes signature.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {builderGroups.map((g) => (
              <li
                key={g.key}
                className="rounded-full border border-ink/12 px-3.5 py-1.5 text-[0.8125rem] text-ink-2"
              >
                {g.title}
                <span className="ml-1.5 text-ink-3 tabular-nums">{g.items.length}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/composer" size="lg">
              Composer ma salade
            </ButtonLink>
            <ButtonLink href="/la-carte" size="lg" variant="secondary">
              Voir la carte
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="order-1 md:order-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-cream-2 md:aspect-[5/6]">
            <Dish
              slot="composer-home"
              alt="Bacs d’ingrédients frais alignés au comptoir du bar à salade"
              fill
              sizes="(min-width: 768px) 45vw, 92vw"
            />
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ink/8" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Le répertoire                                                      */
/* ------------------------------------------------------------------ */

/**
 * La profondeur de la maison, en un écran : 208 recettes au répertoire,
 * quatre à l'ardoise chaque jour. C'est ce qui justifie qu'on revienne.
 */
export function Repertoire() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-cream md:py-32">
      <div className="shell relative grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-20">
        <Reveal>
          <p className="eyebrow !text-cream/60">Le répertoire</p>
          <h2 className="fluid-section mt-4 max-w-[13ch] text-cream">
            {repertoirePlats.length} recettes. Jamais deux midis pareils.
          </h2>
          <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-cream/70">
            Depuis l’ouverture, la maison a mis au point {repertoirePlats.length} plats
            mijotés. Quatre passent à l’ardoise chaque matin — vous pouvez venir tous
            les jours d’un mois sans manger deux fois la même chose.
          </p>
          <Link
            href="/plats-du-jour"
            className="mt-8 inline-flex items-center gap-2 text-[0.9375rem] text-cream underline-offset-[6px] transition-colors hover:text-olive-soft hover:underline"
          >
            Parcourir le répertoire
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
              <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="divide-y divide-cream/10 border-y border-cream/10">
            {famillesPlats.map((f) => (
              <li
                key={f.famille}
                className="flex items-baseline justify-between gap-6 py-4 font-[family-name:var(--font-display)] text-[1.25rem] tracking-[-0.02em] md:text-[1.5rem]"
              >
                {f.famille}
                <span className="font-[family-name:var(--font-sans)] text-xs tabular-nums tracking-normal text-cream/60">
                  {f.total} recettes
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Comment ça marche                                                  */
/* ------------------------------------------------------------------ */

const steps = [
  { n: "01", title: "Vous choisissez", body: "Une recette signature ou votre propre composition." },
  { n: "02", title: "Vous payez en ligne", body: "Apple Pay, Google Pay ou carte. Prénom, e-mail et téléphone suffisent." },
  { n: "03", title: "Vous passez la prendre", body: `${restaurant.street}, entre 12h et 15h. C’est prêt.` },
];

export function HowItWorks() {
  return (
    <section className="border-y border-ink/8 bg-olive-wash/60 py-20 md:py-24">
      <div className="shell">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Commander</p>
            <h2 className="fluid-section mt-4 max-w-[16ch]">
              Trois étapes, deux minutes.
            </h2>
          </div>
          <div className="flex flex-col gap-2 md:mb-2 md:items-end">
            <p className="rounded-full bg-cream px-5 py-2.5 text-[0.8125rem] font-medium text-olive-deep">
              −10 % en précommandant la veille ou avant{" "}
              {restaurant.earlyBird.cutoff.replace(":", "h")}
            </p>
            <p className="rounded-full bg-cream px-5 py-2.5 text-[0.8125rem] font-medium text-olive-deep">
              −5 % de plus avec un compte client créé au comptoir
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
          {steps.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.08}>
                <span className="font-[family-name:var(--font-display)] text-[0.9375rem] text-olive-deep">
                  {s.n}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.5rem]">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-3">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Avis                                                               */
/* ------------------------------------------------------------------ */

const reviews = [
  {
    quote:
      "La seule adresse du quartier où je sais que la salade a été faite le matin. Et ça se sent.",
    author: "Camille",
    context: "Habituée du midi",
  },
  {
    quote:
      "Je commande à 11h30 depuis le bureau, je passe à 12h15, je repars avec. Zéro attente.",
    author: "Yanis",
    context: "Bureau rue Guillaume Tell",
  },
  {
    quote: "Le bar à salade est une bénédiction quand on est difficile. On compose vraiment tout.",
    author: "Léa",
    context: "Cliente depuis 2023",
  },
];

export function Reviews() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">On en dit</p>
          <h2 className="fluid-section mt-4 max-w-[15ch]">
            Le quartier a ses habitudes.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:gap-5">
          {reviews.map((r, i) => (
            <Reveal key={r.author} delay={i * 0.08}>
              <figure className="flex h-full flex-col justify-between rounded-lg border border-ink/8 bg-cream-2/50 p-7">
                <blockquote className="font-[family-name:var(--font-display)] text-[1.3125rem] leading-[1.35] tracking-[-0.015em]">
                  « {r.quote} »
                </blockquote>
                <figcaption className="mt-8 text-[0.8125rem] text-ink-3">
                  <span className="font-medium text-ink">{r.author}</span> · {r.context}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Le lieu                                                            */
/* ------------------------------------------------------------------ */

export function Place() {
  return (
    <section className="bg-cream-2/50 py-24 md:py-32">
      <div className="shell">
        <Reveal className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-end md:gap-20">
          <div>
            <p className="eyebrow">Le lieu</p>
            <h2 className="fluid-section mt-4 max-w-[13ch]">
              23 rue Guillaume Tell.
            </h2>
            <p className="mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink-3">
              Une salle claire à deux pas de Pereire, ouverte du lundi au vendredi,
              de 12h à 15h. À emporter ou sur place.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 text-[0.9375rem]">
            <div>
              <dt className="eyebrow">Horaires</dt>
              <dd className="mt-2 leading-relaxed">
                Lundi — vendredi
                <br />
                12h — 15h
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Téléphone</dt>
              <dd className="mt-2 leading-relaxed">
                <a href={`tel:${restaurant.phoneHref}`} className="underline-offset-4 hover:underline">
                  {restaurant.phone}
                </a>
                <br />
                <a href={`tel:${restaurant.mobileHref}`} className="text-ink-3 underline-offset-4 hover:underline">
                  {restaurant.mobile}
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Accès transports</dt>
              <dd className="mt-2 flex flex-col gap-2">
                {restaurant.metro.map((m) => (
                  <span key={m.station} className="flex items-center gap-2 text-ink-2">
                    <PastilleLigne {...m} className="size-5 text-[0.6875rem]" />
                    {m.station}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Y aller</dt>
              <dd className="mt-2">
                <a
                  href={restaurant.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-olive-deep"
                >
                  Ouvrir dans Maps
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {["salle-1", "ingredients", "salle-3", "salle-2"].map((slot, i) => (
              <div
                key={slot}
                className={`relative overflow-hidden rounded-md bg-cream-2 ${
                  i === 0 ? "col-span-2 aspect-[16/11]" : "aspect-square"
                }`}
              >
                <Dish
                  slot={slot}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 46vw"
                  className="transition-transform duration-700 [transition-timing-function:var(--ease-soft)] hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 flex justify-center">
          <Link
            href="/le-restaurant"
            className="group inline-flex items-center gap-2.5 text-[0.9375rem] font-medium underline-offset-[6px] transition-colors hover:text-olive-deep hover:underline"
          >
            Voir le restaurant, le plan et les horaires
            <svg viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
              <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

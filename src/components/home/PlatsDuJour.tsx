import Link from "next/link";
import { PlatCard } from "@/components/menu/PlatCard";
import { Reveal } from "@/components/ui/Reveal";
import { repertoirePlats } from "@/lib/plats";
import { lireArdoise } from "@/lib/ardoise";
import { platsIntro } from "@/lib/catalog";
import { restaurant } from "@/lib/restaurant";

/**
 * Les quatre plats chauds du jour.
 *
 * Traitement volontairement identique à celui des salades : même grille, même
 * interaction au survol, même poids visuel. C'est la moitié de l'offre du
 * midi, elle ne peut pas être reléguée en bas de page.
 *
 * Le contenu vient de content/ardoise.json — le restaurant y recopie quatre
 * noms, et rien d'autre.
 */
export async function PlatsDuJour() {
  const { platsDuJour, platsCommandables } = await lireArdoise();

  if (platsDuJour.length === 0) return null;

  const aujourdhui = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <section id="plats" className="scroll-mt-28 bg-cream-2/40 py-24 md:py-32">
      <div className="shell">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">L’ardoise · {aujourdhui}</p>
            <h2 className="fluid-section mt-4 max-w-[13ch]">
              Quatre plats chauds, cuisinés ce matin.
            </h2>
          </div>
          <p className="max-w-[36ch] text-[0.9375rem] leading-relaxed text-ink-3 md:pb-2 md:text-right">
            {platsIntro} Demain, ce sera quatre autres.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 md:grid-cols-4 md:gap-5">
          {platsDuJour.map((plat, i) => (
            <Reveal key={plat.slug} delay={(i % 4) * 0.05}>
              <PlatCard plat={plat} commandable={platsCommandables} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/plats-du-jour"
            className="group inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-ink underline-offset-[6px] transition-colors hover:text-olive-deep hover:underline"
          >
            Voir les {repertoirePlats.length} recettes du répertoire
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            >
              <path
                d="M2 8h11M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </Link>
          {!platsCommandables && (
            <p className="text-[0.8125rem] text-ink-3">
              Les plats chauds se commandent au comptoir ou par téléphone au{" "}
              <a
                href={`tel:${restaurant.phoneHref}`}
                className="underline underline-offset-4 hover:text-ink"
              >
                {restaurant.phone}
              </a>
              .
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

import Link from "next/link";
import { salads } from "@/lib/catalog";
import { RecipeCard } from "@/components/menu/RecipeCard";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Grille recettes. Pas de cartes classiques : la photo occupe tout,
 * la typographie vit dessus, et la composition n’apparaît qu’à l’intention.
 * Rythme asymétrique — la première recette occupe deux colonnes.
 */
export function Recipes() {
  const [lead, ...rest] = salads;

  return (
    <section id="recettes" className="bg-cream py-24 md:py-32">
      <div className="shell">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Nos recettes</p>
            <h2 className="fluid-section mt-4 max-w-[14ch]">
              Cinq salades, une par envie.
            </h2>
          </div>
          <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink-3 md:pb-2 md:text-right">
            Survolez une recette pour voir sa composition complète.
          </p>
        </Reveal>

        {/* Première rangée asymétrique : la carte étroite s’étire à la hauteur
            de la grande, sinon la grille laisse un vide sous elle. */}
        {/* Aucune carte n’est en `priority` : sur la home, le seul visuel du
            premier écran est le hero, et lui préempter la bande passante
            retardait son affichage sur réseau mobile. */}
        <div className="mt-14 grid grid-cols-1 items-stretch gap-4 md:mt-16 md:grid-cols-6 md:gap-5">
          <Reveal className="md:col-span-4">
            <RecipeCard salad={lead} aspect="aspect-[4/5] md:aspect-[16/11]" />
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-2">
            <RecipeCard salad={rest[0]} aspect="aspect-[4/5] md:aspect-auto md:h-full" />
          </Reveal>

          {rest.slice(1).map((salad, i) => (
            <Reveal key={salad.slug} delay={0.05 * i} className="md:col-span-2">
              <RecipeCard salad={salad} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex justify-center">
          <Link
            href="/la-carte"
            className="group inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-ink underline-offset-[6px] transition-colors hover:text-olive-deep hover:underline"
          >
            Voir toute la carte — boissons et desserts
            <svg viewBox="0 0 16 16" className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
              <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

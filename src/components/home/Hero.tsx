import { Dish } from "@/components/ui/Dish";
import { ButtonLink } from "@/components/ui/Button";
import { restaurant } from "@/lib/restaurant";

/**
 * Hero. Une seule photo, plein cadre.
 *
 * Composant serveur : zéro JavaScript. L’entrée est jouée en CSS, ce qui
 * garde le LCP propre et laisse le contenu lisible même si le bundle
 * n’arrive jamais.
 *
 * L’essentiel — ce qu’on mange, pourquoi c’est différent, comment commander —
 * tient dans le premier écran, sans scroll.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink">
      <div className="settle absolute inset-0">
        <Dish
          slot="hero"
          alt="Salade composée du Révélant : avocat, tomates cerises, pois chiches et patate douce dans un bol clair"
          fill
          priority
          sizes="100vw"
          // Photo plein cadre sous un dégradé : 68 en AVIF est indiscernable
          // de 75 à l’œil et allège nettement le LCP.
          quality={68}
          className="object-cover"
        />
      </div>

      {/* Lecture du texte garantie sans écraser la photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent" />
      <div className="absolute inset-0 grain" />


      {/* pb généreux sur mobile : la barre de commande fixe occupe le bas. */}
      <div className="shell relative z-10 pb-36 pt-32 md:pb-20">
        <p className="rise eyebrow !text-cream/65" style={{ "--d": "0.15s" } as React.CSSProperties}>
          Paris 17 · {restaurant.street}
        </p>

        <h1
          className="rise fluid-display mt-5 max-w-[16ch] text-cream"
          style={{ "--d": "0.25s" } as React.CSSProperties}
        >
          Le déjeuner frais et gourmand à Paris
        </h1>

        <p
          className="rise mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-cream/80 md:text-[1.1875rem]"
          style={{ "--d": "0.4s" } as React.CSSProperties}
        >
          Des recettes créées chaque jour avec des ingrédients sélectionnés.
        </p>

        <div
          className="rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ "--d": "0.5s" } as React.CSSProperties}
        >
          <ButtonLink
            href="/la-carte"
            size="lg"
            className="bg-cream text-ink hover:bg-cream hover:text-olive-deep"
          >
            Commander maintenant
          </ButtonLink>
          <ButtonLink
            href="#recettes"
            size="lg"
            variant="secondary"
            className="border-cream/30 text-cream hover:border-cream/60 hover:bg-cream/10"
          >
            Découvrir nos recettes
          </ButtonLink>
        </div>

        <div
          className="rise mt-12 flex flex-wrap items-center gap-x-7 gap-y-2 text-[0.8125rem] text-cream/70"
          style={{ "--d": "0.7s" } as React.CSSProperties}
        >
          <span>Préparé le matin même</span>
          <span aria-hidden className="hidden size-1 rounded-full bg-cream/30 sm:block" />
          <span>Prêt à emporter en 2 minutes</span>
          <span aria-hidden className="hidden size-1 rounded-full bg-cream/30 sm:block" />
          <span className="text-tomato-soft">−10 % avant 11h45</span>
        </div>
      </div>
    </section>
  );
}

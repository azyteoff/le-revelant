"use client";

import { useState } from "react";
import { Dish } from "@/components/ui/Dish";
import { AddSalad } from "@/components/cart/AddSalad";
import type { Salad } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Carte recette.
 *
 * Au repos : photo + nom, rien d’autre.
 * Au survol : la photo passe en flou léger, un voile sombre monte, la
 * composition et les deux formats apparaissent. 300 à 450 ms, aucun zoom de
 * mise en page — le mouvement reste dans la lumière.
 *
 * Au tactile il n’y a pas de survol : un premier appui révèle la composition,
 * un second la referme. Les deux états sont rendus en permanence et ne font
 * que changer d’opacité, ce qui évite tout moteur d’animation.
 */
export function RecipeCard({
  salad,
  priority = false,
  className,
  aspect = "aspect-[4/5]",
}: {
  salad: Salad;
  priority?: boolean;
  className?: string;
  aspect?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  // Sur un écran tactile, un tap déclenche aussi `mouseenter` : sans ce garde-fou,
  // l’ouverture par survol et la bascule au clic s’annulent l’une l’autre.
  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <article
      className={cn("group relative h-full", className)}
      onMouseEnter={() => canHover() && setRevealed(true)}
      onMouseLeave={() => canHover() && setRevealed(false)}
      // Uniquement au clavier : un tap donne aussi le focus, et l’ouverture
      // par focus annulerait la bascule du clic juste après.
      onFocus={(e) => e.target.matches(":focus-visible") && setRevealed(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setRevealed(false);
      }}
    >
      <div className={cn("relative w-full overflow-hidden rounded-lg bg-cream-2", aspect)}>
        <Dish
          slot={salad.image}
          alt={salad.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 34vw, (min-width: 768px) 46vw, 92vw"
          className={cn(
            "transition-[filter,transform] duration-[420ms] [transition-timing-function:var(--ease-soft)]",
            revealed && "scale-[1.03] blur-[7px] motion-reduce:scale-100 motion-reduce:blur-0"
          )}
        />

        {/* Scrim permanent : garantit la lisibilité du nom sur les photos
            claires comme sur les photos sombres. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/72 via-ink/28 to-transparent" />

        {/* Voile de survol */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/55 to-ink/25",
            "transition-opacity duration-[380ms] [transition-timing-function:var(--ease-soft)]",
            revealed ? "opacity-100" : "opacity-0"
          )}
        />

        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ink/8" />

        {/* État de repos : nom + accroche */}
        <div
          aria-hidden={revealed}
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 p-5 transition-opacity duration-200 md:p-6",
            revealed ? "opacity-0" : "opacity-100"
          )}
        >
          <h3 className="font-[family-name:var(--font-display)] text-[1.6rem] leading-none text-cream md:text-[1.85rem]">
            {salad.name}
          </h3>
          <p className="mt-1.5 text-[0.8125rem] text-cream/80">{salad.kicker}</p>
        </div>

        {/* État révélé : composition + ajout */}
        <div
          inert={!revealed}
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-5 md:p-6",
            // `visibility` est incluse dans la transition : elle bascule à la
            // fin du fondu, donc le bloc disparaît vraiment au repos au lieu
            // de rester un calque transparent au-dessus de la photo.
            "transition-[opacity,visibility] duration-300 [transition-timing-function:var(--ease-soft)]",
            revealed ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
          )}
        >
          <h3
            className={cn(
              "font-[family-name:var(--font-display)] text-[1.6rem] leading-none text-cream md:text-[1.85rem]",
              "transition-transform duration-[400ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            {salad.name}
          </h3>

          <p
            style={{ transitionDelay: revealed ? "0.05s" : "0s" }}
            className={cn(
              "mt-3 text-[0.8125rem] leading-[1.6] text-cream/90 md:text-sm",
              "transition-transform duration-[450ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            {salad.ingredients.join(", ")}.
          </p>

          <div
            style={{ transitionDelay: revealed ? "0.1s" : "0s" }}
            className={cn(
              "mt-5 transition-transform duration-[450ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            <AddSalad salad={salad} tone="light" />
          </div>
        </div>

        {/* Déclencheur tactile : n’existe que sans survol disponible */}
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={
            revealed
              ? `Masquer la composition de ${salad.name}`
              : `Voir la composition de ${salad.name}`
          }
          className={cn(
            "absolute inset-0 [@media(hover:hover)]:hidden",
            revealed && "bottom-24"
          )}
        />
      </div>
    </article>
  );
}

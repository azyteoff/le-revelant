"use client";

import { useState } from "react";
import Image from "next/image";
import platPhotos from "@/lib/plat-photos.generated.json";
import { nomAffiche, type Plat } from "@/lib/plats";
import { AddPlat } from "@/components/cart/AddSalad";
import { FORMULES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const blurs = platPhotos as Record<string, string>;

/**
 * Carte d'un plat chaud du jour.
 *
 * Même traitement que les salades signature — photo plein cadre, nom sur la
 * photo, composition au survol — parce que les plats mijotés pèsent autant
 * dans le déjeuner. La différence : la famille (Volaille, Poisson…) est
 * affichée en permanence, elle est la première chose qu'on cherche.
 *
 * Le bouton de commande n'apparaît que si le prix est renseigné dans
 * content/ardoise.json ; sinon on invite à commander au comptoir.
 */
export function PlatCard({
  plat,
  commandable,
  priority = false,
  className,
  aspect = "aspect-[4/5]",
}: {
  plat: Plat;
  /** Les plats sont-ils vendus en ligne aujourd'hui ? */
  commandable: boolean;
  priority?: boolean;
  className?: string;
  aspect?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  const canHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const blurDataURL = blurs[plat.slug];

  return (
    <article
      className={cn("group relative h-full", className)}
      onMouseEnter={() => canHover() && setRevealed(true)}
      onMouseLeave={() => canHover() && setRevealed(false)}
      onFocus={(e) => e.target.matches(":focus-visible") && setRevealed(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setRevealed(false);
      }}
    >
      <div className={cn("relative w-full overflow-hidden rounded-lg bg-cream-2", aspect)}>
        <Image
          src={`/img/plats/${plat.slug}.jpg`}
          alt={plat.nom}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 34vw, (min-width: 768px) 46vw, 92vw"
          {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
          className={cn(
            "object-cover transition-[filter,transform] duration-[420ms] [transition-timing-function:var(--ease-soft)]",
            revealed && "scale-[1.03] blur-[7px] motion-reduce:scale-100 motion-reduce:blur-0"
          )}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/72 via-ink/28 to-transparent" />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/55 to-ink/25",
            "transition-opacity duration-[380ms] [transition-timing-function:var(--ease-soft)]",
            revealed ? "opacity-100" : "opacity-0"
          )}
        />

        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ink/8" />

        {/* Famille : toujours lisible, en haut à gauche */}
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-ink">
          {plat.famille}
        </span>

        {/* Repos */}
        <div
          aria-hidden={revealed}
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 p-5 transition-opacity duration-200 md:p-6",
            revealed ? "opacity-0" : "opacity-100"
          )}
        >
          <h3 className="font-[family-name:var(--font-display)] text-[1.5rem] leading-tight text-cream md:text-[1.75rem]">
            {nomAffiche(plat)}
          </h3>
        </div>

        {/* Révélé */}
        <div
          inert={!revealed}
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-5 md:p-6",
            "transition-[opacity,visibility] duration-300 [transition-timing-function:var(--ease-soft)]",
            revealed ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
          )}
        >
          <h3
            className={cn(
              "font-[family-name:var(--font-display)] text-[1.5rem] leading-tight text-cream md:text-[1.75rem]",
              "transition-transform duration-[400ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            {nomAffiche(plat)}
          </h3>

          <p
            style={{ transitionDelay: revealed ? "0.05s" : "0s" }}
            className={cn(
              "mt-3 text-[0.8125rem] leading-[1.6] text-cream/90 md:text-sm",
              "transition-transform duration-[450ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            {plat.description}
          </p>

          <div
            style={{ transitionDelay: revealed ? "0.1s" : "0s" }}
            className={cn(
              "mt-5 transition-transform duration-[450ms] [transition-timing-function:var(--ease-soft)]",
              revealed ? "translate-y-0" : "translate-y-2.5"
            )}
          >
            {commandable ? (
              <AddPlat nom={plat.nom} slug={plat.slug} formules={FORMULES} tone="light" />
            ) : (
              <p className="rounded-full bg-cream/15 px-4 py-2.5 text-center text-[0.75rem] text-cream/85">
                À commander au comptoir
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={
            revealed
              ? `Masquer la description de ${plat.nom}`
              : `Voir la description de ${plat.nom}`
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

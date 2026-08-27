"use client";

import Image from "next/image";
import blurs from "@/lib/ingredient-photos.generated.json";
import { slugIngredient } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const flous = blurs as Record<string, string>;

/**
 * Vignette d'un ingrédient du bar à salade.
 *
 * Deux états de fond, un seul traitement : soit la photo de l'ingrédient,
 * soit un aplat à la couleur de son groupe. Dans les deux cas le carré fait
 * la même taille, le nom est écrit au même endroit et la sélection se lit de
 * la même façon — la grille reste régulière même quand toutes les photos ne
 * sont pas encore là.
 *
 * Pour ajouter une photo : back-office › Photos › Le bar à salade. La
 * présence de la vignette est décidée par le serveur (`version`), jamais par
 * un manifeste figé au build — sinon une photo envoyée à midi n'apparaîtrait
 * qu'au prochain déploiement.
 */

/** Un aplat par groupe : on reste dans la palette, sans jamais crier. */
const FONDS: Record<string, string> = {
  base: "bg-olive-wash",
  legumes: "bg-[#e8ecdd]",
  proteines: "bg-sand/70",
  cremeux: "bg-cream-2",
  finitions: "bg-[#ece6da]",
};

export function Vignette({
  nom,
  groupe,
  version,
  choisi,
  onToggle,
}: {
  nom: string;
  groupe: string;
  /** Empreinte du fichier en place ; absente = pas de photo pour ce bac. */
  version?: string;
  choisi: boolean;
  onToggle: () => void;
}) {
  const slug = slugIngredient(nom);
  const flou = flous[slug];
  const aPhoto = Boolean(version);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={choisi}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg text-left",
        "transition-[box-shadow,transform] duration-300 [transition-timing-function:var(--ease-soft)]",
        "active:scale-[0.98]",
        choisi
          ? "ring-2 ring-olive-deep ring-offset-2 ring-offset-cream"
          : "ring-1 ring-inset ring-ink/12 hover:ring-ink/30"
      )}
    >
      <span className={cn("relative block aspect-square w-full", !aPhoto && FONDS[groupe])}>
        {aPhoto ? (
          <Image
            src={`/img/ingredients/${slug}.jpg?v=${version}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 12vw, (min-width: 640px) 20vw, 30vw"
            {...(flou ? { placeholder: "blur" as const, blurDataURL: flou } : {})}
            className={cn(
              "object-cover transition-transform duration-500 [transition-timing-function:var(--ease-soft)]",
              "group-hover:scale-[1.05]"
            )}
          />
        ) : (
          // Sans photo : un aplat calme, avec l'initiale en filigrane pour que
          // la case ne soit pas vide sans pour autant attirer l'œil.
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-[family-name:var(--font-display)] text-[2.5rem] text-ink/12"
          >
            {nom.charAt(0)}
          </span>
        )}

        {/* Coche de sélection */}
        <span
          className={cn(
            "absolute right-2 top-2 grid size-6 place-items-center rounded-full transition-all duration-300",
            "[transition-timing-function:var(--ease-soft)]",
            choisi
              ? "scale-100 bg-olive-deep text-cream opacity-100"
              : "scale-75 bg-cream/85 text-ink/45 opacity-0 group-hover:opacity-100"
          )}
        >
          <svg viewBox="0 0 14 14" className="size-3" aria-hidden>
            {choisi ? (
              <path
                d="M2.5 7.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : (
              <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </span>
      </span>

      <span
        className={cn(
          // Hauteur fixe : un nom sur deux lignes ne doit pas décaler la
          // vignette voisine, sinon la grille perd son alignement.
          "flex h-[3rem] items-center px-2.5 text-[0.75rem] leading-tight transition-colors duration-300",
          choisi ? "bg-olive-deep text-cream" : "bg-cream text-ink-2"
        )}
      >
        <span className="line-clamp-2">{nom}</span>
      </span>
    </button>
  );
}

"use client";

import { useState } from "react";
import { SIZES_COMPOSEE } from "@/lib/catalog";
import { useSalades, type SaladeEnregistree } from "@/lib/salades-enregistrees";
import { useCart } from "@/lib/cart";
import { cn, euro } from "@/lib/utils";

/**
 * Les salades enregistrées, en tête du composeur.
 *
 * Une carte par salade, et une seule action évidente : la remettre au
 * panier. Le reste — la reprendre pour la modifier, la renommer, la
 * supprimer — reste discret, à sa portée sans jamais encombrer.
 *
 * Le bloc n'existe pas tant qu'aucune salade n'a été enregistrée : personne
 * ne voit une liste vide en arrivant pour la première fois.
 */
export function MesSalades({
  majoration,
  onReprendre,
}: {
  majoration: number;
  onReprendre: (salade: SaladeEnregistree) => void;
}) {
  const salades = useSalades((s) => s.salades);
  const hydrated = useSalades((s) => s.hydrated);
  const supprimer = useSalades((s) => s.supprimer);
  const renommer = useSalades((s) => s.renommer);
  const add = useCart((s) => s.add);

  const [ajoutee, setAjoutee] = useState<string | null>(null);
  const [renomme, setRenomme] = useState<string | null>(null);

  if (!hydrated || salades.length === 0) return null;

  const prixDe = (s: SaladeEnregistree) =>
    SIZES_COMPOSEE.find((t) => t.key === s.size)!.price + majoration;

  return (
    <section aria-labelledby="mes-salades">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
        <h2
          id="mes-salades"
          className="font-[family-name:var(--font-display)] text-[1.625rem] md:text-[1.875rem]"
        >
          Mes salades
        </h2>
        <p className="shrink-0 text-[0.8125rem] text-ink-3">
          Enregistrées sur cet appareil
        </p>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {salades.map((s) => {
          const format = SIZES_COMPOSEE.find((t) => t.key === s.size)!.label;
          return (
            <li
              key={s.id}
              className="flex flex-col rounded-lg border border-ink/12 bg-cream p-4 transition-colors duration-300 hover:border-ink/25"
            >
              <div className="flex items-start justify-between gap-3">
                {renomme === s.id ? (
                  <form
                    className="min-w-0 flex-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const champ = e.currentTarget.elements.namedItem("nom");
                      if (champ instanceof HTMLInputElement) renommer(s.id, champ.value);
                      setRenomme(null);
                    }}
                  >
                    <label htmlFor={`nom-${s.id}`} className="sr-only">
                      Nouveau nom
                    </label>
                    <input
                      id={`nom-${s.id}`}
                      name="nom"
                      defaultValue={s.nom}
                      autoFocus
                      maxLength={40}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={(e) => {
                        renommer(s.id, e.currentTarget.value);
                        setRenomme(null);
                      }}
                      onKeyDown={(e) => e.key === "Escape" && setRenomme(null)}
                      className="w-full rounded-md border border-ink/25 bg-cream px-2 py-1 text-[0.9375rem] outline-none focus:border-ink"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRenomme(s.id)}
                    title="Renommer"
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[0.9375rem] font-medium underline decoration-transparent decoration-dotted underline-offset-4 transition-colors hover:decoration-ink/40">
                      {s.nom}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => supprimer(s.id)}
                  aria-label={`Supprimer ${s.nom}`}
                  className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-ink-3 transition-colors hover:bg-ink/6 hover:text-ink"
                >
                  <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
                    <path
                      d="M2.5 2.5l9 9m0-9l-9 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-3">
                {format} · {s.ingredients.join(", ")}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    add({
                      kind: "composee",
                      name: `${s.nom} · ${format}`,
                      detail: s.ingredients,
                      size: s.size,
                      majoration,
                      unitPrice: prixDe(s),
                      image: "salade-composee",
                    });
                    setAjoutee(s.id);
                    setTimeout(
                      () => setAjoutee((c) => (c === s.id ? null : c)),
                      1800
                    );
                  }}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center rounded-full text-[0.875rem] font-medium",
                    "transition-colors duration-300 [transition-timing-function:var(--ease-soft)]",
                    ajoutee === s.id
                      ? "bg-olive-deep text-cream"
                      : "bg-ink text-cream hover:bg-olive-deep"
                  )}
                >
                  {ajoutee === s.id ? "Ajoutée ✓" : `Ajouter — ${euro(prixDe(s))}`}
                </button>

                <button
                  type="button"
                  onClick={() => onReprendre(s)}
                  className="shrink-0 text-[0.8125rem] text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Modifier
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

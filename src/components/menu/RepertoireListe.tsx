"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { normaliser, nomAffiche, type Plat } from "@/lib/plats";
import { cn } from "@/lib/utils";

/**
 * Le répertoire complet, filtrable.
 *
 * 208 recettes ne se parcourent pas : elles se cherchent. Un champ de
 * recherche insensible aux accents et un filtre par famille suffisent —
 * pas de pagination, la liste entière est déjà dans le HTML (bon pour le
 * référencement, et instantané au filtrage).
 */
export function RepertoireListe({
  plats,
  familles,
}: {
  plats: Plat[];
  familles: { famille: string; total: number }[];
}) {
  const [recherche, setRecherche] = useState("");
  const [famille, setFamille] = useState<string | null>(null);
  const requete = useDeferredValue(recherche);

  const resultats = useMemo(() => {
    const q = normaliser(requete);
    return plats.filter(
      (p) =>
        (!famille || p.famille === famille) &&
        (!q || normaliser(p.nom).includes(q) || normaliser(p.description).includes(q))
    );
  }, [plats, requete, famille]);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <label className="relative block max-w-md">
          <span className="sr-only">Chercher une recette</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3"
          >
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M13.2 13.2 17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher : poulet, vanille, végétarien…"
            className="h-12 w-full rounded-full border border-ink/14 bg-cream pl-11 pr-4 text-[0.9375rem] placeholder:text-ink-3/80 focus:border-olive focus:outline-none"
          />
        </label>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setFamille(null)}
            aria-pressed={famille === null}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-300",
              famille === null
                ? "border-ink bg-ink text-cream"
                : "border-ink/14 text-ink-2 hover:border-ink/35"
            )}
          >
            Tout · {plats.length}
          </button>
          {familles.map((f) => (
            <button
              key={f.famille}
              type="button"
              onClick={() => setFamille(famille === f.famille ? null : f.famille)}
              aria-pressed={famille === f.famille}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-300",
                famille === f.famille
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/14 text-ink-2 hover:border-ink/35"
              )}
            >
              {f.famille} · {f.total}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mt-6 text-[0.8125rem] text-ink-3">
        {resultats.length === 0
          ? "Aucune recette ne correspond."
          : `${resultats.length} recette${resultats.length > 1 ? "s" : ""}`}
      </p>

      <ul className="mt-4 grid gap-x-10 gap-y-0 border-t border-ink/8 md:grid-cols-2">
        {resultats.map((p) => (
          <li key={p.slug} className="border-b border-ink/8 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-[family-name:var(--font-display)] text-[1.125rem] leading-snug">
                {nomAffiche(p)}
              </h3>
              <span className="shrink-0 text-[0.6875rem] uppercase tracking-[0.1em] text-ink-3">
                {p.famille}
              </span>
            </div>
            {p.description && (
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-3">{p.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

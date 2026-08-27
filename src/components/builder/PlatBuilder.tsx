"use client";

import { useState } from "react";
import Image from "next/image";
import platPhotos from "@/lib/plat-photos.generated.json";
import { FORMULES } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { cn, euro } from "@/lib/utils";

const flous = platPhotos as Record<string, string>;

/** « Végétarien - Cary d’aubergines » se lit mieux sans son préfixe. */
const nomAffiche = (nom: string) => nom.replace(/^V[ée]g[ée]tarien\s*[-–—]\s*/i, "");

export type PlatDuJour = {
  nom: string;
  slug: string;
  famille: string;
  description: string;
};

export type Accompagnement = { nom: string; description?: string };

/**
 * Composeur de plat chaud : un plat, une base, une garniture.
 *
 * Même grammaire que le bar à salade — des cases qu'on clique, un
 * récapitulatif collant, un seul bouton — pour qu'on n'ait rien à
 * réapprendre en passant d'un onglet à l'autre.
 *
 * La garniture est facultative, et c'est elle qui fait le prix : sans elle
 * le plat est à 11 €, avec elle à 13 €. On l'écrit noir sur blanc plutôt
 * que de laisser le total changer sans explication.
 */
export function PlatBuilder({
  plats,
  bases,
  garnitures,
  commandable,
}: {
  plats: PlatDuJour[];
  bases: Accompagnement[];
  garnitures: Accompagnement[];
  commandable: boolean;
}) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);

  const [plat, setPlat] = useState<string | null>(plats.length === 1 ? plats[0].nom : null);
  const [base, setBase] = useState<string | null>(bases.length === 1 ? bases[0].nom : null);
  const [garniture, setGarniture] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const formule = FORMULES.find((f) => f.key === (garniture ? "complet" : "plat"))!;
  const ready = Boolean(plat && base);
  const choisi = plats.find((p) => p.nom === plat);

  return (
    <div className="shell grid gap-10 pb-24 pt-10 md:grid-cols-[1fr_20rem] md:gap-14 md:pb-28">
      <div className="flex flex-col gap-12">
        {/* ------------------------------- Le plat */}
        <section id="premier-groupe-plat">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-[1.625rem] md:text-[1.875rem]">
              Le plat
            </h2>
            <p className="shrink-0 text-[0.8125rem] text-ink-3">Un seul choix</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {plats.map((p) => {
              const actif = plat === p.nom;
              return (
                <button
                  key={p.nom}
                  type="button"
                  onClick={() => setPlat(actif ? null : p.nom)}
                  aria-pressed={actif}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-3 text-left transition-colors duration-300",
                    actif
                      ? "border-olive-deep bg-olive-wash"
                      : "border-ink/12 hover:border-ink/35 hover:bg-cream-2/50"
                  )}
                >
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-cream-2">
                    <Image
                      src={`/img/plats/${p.slug}.jpg`}
                      alt=""
                      fill
                      sizes="64px"
                      {...(flous[p.slug]
                        ? { placeholder: "blur" as const, blurDataURL: flous[p.slug] }
                        : {})}
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-medium">
                      {nomAffiche(p.nom)}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[0.8125rem] leading-snug text-ink-3">
                      {p.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------- La base */}
        <section>
          <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-[1.625rem] md:text-[1.875rem]">
              La base
            </h2>
            <p className="shrink-0 text-[0.8125rem] text-ink-3">Un seul choix</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {bases.map((b) => {
              const actif = base === b.nom;
              return (
                <button
                  key={b.nom}
                  type="button"
                  onClick={() => setBase(actif ? null : b.nom)}
                  aria-pressed={actif}
                  className={cn(
                    "rounded-full border px-5 py-3 text-[0.9375rem] transition-colors duration-300",
                    actif
                      ? "border-olive-deep bg-olive-deep text-cream"
                      : "border-ink/14 text-ink-2 hover:border-ink/35 hover:bg-cream-2/60"
                  )}
                >
                  {b.nom}
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------- La garniture */}
        {garnitures.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
              <h2 className="font-[family-name:var(--font-display)] text-[1.625rem] md:text-[1.875rem]">
                La garniture
              </h2>
              <p className="shrink-0 text-[0.8125rem] text-ink-3">
                Facultative · +{euro(FORMULES[1].price - FORMULES[0].price)}
              </p>
            </div>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {garnitures.map((g) => {
                const actif = garniture === g.nom;
                return (
                  <li key={g.nom}>
                    <button
                      type="button"
                      onClick={() => setGarniture(actif ? null : g.nom)}
                      aria-pressed={actif}
                      className={cn(
                        "flex h-full w-full flex-col rounded-lg border p-4 text-left transition-colors duration-300",
                        actif
                          ? "border-olive-deep bg-olive-wash"
                          : "border-ink/12 hover:border-ink/35 hover:bg-cream-2/50"
                      )}
                    >
                      <span className="text-[0.9375rem] font-medium">{g.nom}</span>
                      {g.description && (
                        <span className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
                          {g.description}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {garniture && (
              <button
                type="button"
                onClick={() => setGarniture(null)}
                className="mt-3 text-[0.8125rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
              >
                Finalement, sans garniture ({euro(FORMULES[0].price)})
              </button>
            )}
          </section>
        )}
      </div>

      {/* ------------------------------- Récapitulatif */}
      <aside className="md:sticky md:top-28 md:self-start">
        <div className="rounded-lg border border-ink/10 bg-cream-2/50 p-6">
          <p className="eyebrow">Votre plat</p>

          <div className="mt-4 min-h-24 border-t border-ink/10 pt-4">
            {!ready ? (
              <p className="text-[0.875rem] leading-relaxed text-ink-3">
                Choisissez un plat et une base. La garniture est libre — c’est elle qui fait
                passer le plat de {euro(FORMULES[0].price)} à {euro(FORMULES[1].price)}.
              </p>
            ) : (
              <dl className="flex flex-col gap-2.5 text-[0.875rem]">
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-wide text-ink-3">Plat</dt>
                  <dd className="mt-0.5">{nomAffiche(plat!)}</dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-wide text-ink-3">Base</dt>
                  <dd className="mt-0.5">{base}</dd>
                </div>
                <div>
                  <dt className="text-[0.75rem] uppercase tracking-wide text-ink-3">
                    Garniture
                  </dt>
                  <dd className={cn("mt-0.5", !garniture && "text-ink-3")}>
                    {garniture ?? "Sans garniture"}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {ready && !commandable ? (
            <p className="mt-6 rounded-md border border-dashed border-ink/25 px-4 py-4 text-center text-[0.875rem] leading-relaxed text-ink-3">
              Les plats se commandent au comptoir aujourd’hui. Notez votre composition, on
              vous la prépare sur place.
            </p>
          ) : (
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                add({
                  kind: "plat",
                  name: `${plat} — ${formule.court}`,
                  detail: [base!, ...(garniture ? [garniture] : [])],
                  formule: formule.key,
                  unitPrice: formule.price,
                  image: choisi ? `plats/${choisi.slug}` : "hero",
                });
                setAdded(true);
                setTimeout(() => setAdded(false), 1800);
              }}
              className={cn(
                "mt-6 flex h-[3.25rem] w-full items-center justify-center rounded-full text-[0.9375rem] font-medium",
                "transition-colors duration-300 [transition-timing-function:var(--ease-soft)]",
                "disabled:cursor-not-allowed disabled:bg-ink/12 disabled:text-ink-3",
                added ? "bg-olive-deep text-cream" : "bg-ink text-cream hover:bg-olive-deep"
              )}
            >
              {added ? "Ajouté au panier ✓" : `Ajouter — ${euro(formule.price)}`}
            </button>
          )}

          {added && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 w-full text-center text-[0.8125rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
            >
              Voir mon panier
            </button>
          )}

          <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-3">
            {FORMULES[0].court} {euro(FORMULES[0].price)} · {FORMULES[1].court}{" "}
            {euro(FORMULES[1].price)}. Les plats changent chaque jour.
          </p>
        </div>
      </aside>
    </div>
  );
}

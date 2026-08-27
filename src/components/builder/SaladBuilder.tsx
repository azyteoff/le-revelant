"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Vignette } from "./Vignette";
import {
  builderGroups,
  slugIngredient,
  SIZES_COMPOSEE,
  MAJORATION_COMPOSEE,
  type SizeKey,
} from "@/lib/catalog";
import { majorationComposee } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { MesSalades } from "./MesSalades";
import {
  useSalades,
  regrouper,
  nomPropose,
  MAX_NOM,
  MAX_SALADES,
} from "@/lib/salades-enregistrees";
import { cn, euro } from "@/lib/utils";

/**
 * La majoration dépend de l'heure courante, donc du client : on la lit via
 * `useSyncExternalStore` avec un instantané serveur à 0, ce qui évite toute
 * divergence d'hydratation. Le serveur la recalcule de toute façon à la
 * commande — l'affichage n'est qu'une information.
 */
const sansAbonnement = () => () => {};
let majCache: number | null = null;
const lireMajoration = () => (majCache ??= majorationComposee());

/**
 * Bar à salade.
 *
 * Choix structurants du tunnel :
 *  — tout tient sur un seul écran, pas d’assistant multi-étapes ;
 *  — la sélection est visible en permanence (récapitulatif collant) ;
 *  — rien n’est bloquant : on peut ajouter au panier dès qu’une base et au
 *    moins une protéine sont choisies, le reste est optionnel ;
 *  — la composition survit au rechargement puisqu’elle finit dans le panier
 *    persistant, jamais dans un état local perdu à la navigation.
 */
export function SaladBuilder({ vignettes }: { vignettes: Record<string, string> }) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);

  const [size, setSize] = useState<SizeKey>("petite");
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [added, setAdded] = useState(false);

  const enregistrer = useSalades((s) => s.enregistrer);
  const nbSalades = useSalades((s) => s.salades.length);
  // `null` = le champ n'est pas ouvert. Une chaîne = le nom en cours de
  // saisie. On n'ouvre le champ que sur demande : la plupart des clients
  // veulent juste commander, pas gérer une bibliothèque.
  const [nomEnCours, setNomEnCours] = useState<string | null>(null);
  const [enregistree, setEnregistree] = useState<string | null>(null);

  const toggle = (groupKey: string, item: string, single: boolean) =>
    setPicked((prev) => {
      const current = prev[groupKey] ?? [];
      if (current.includes(item)) {
        return { ...prev, [groupKey]: current.filter((i) => i !== item) };
      }
      return { ...prev, [groupKey]: single ? [item] : [...current, item] };
    });

  const selection = useMemo(
    () => builderGroups.flatMap((g) => picked[g.key] ?? []),
    [picked]
  );

  const hasBase = (picked.base ?? []).length > 0;
  const hasProtein = (picked.proteines ?? []).length > 0;
  const ready = hasBase && hasProtein;

  const majoration = useSyncExternalStore(sansAbonnement, lireMajoration, () => 0);
  const base = SIZES_COMPOSEE.find((s) => s.key === size)!.price;
  const price = base + majoration;

  return (
    <div className="shell grid gap-10 pb-24 pt-10 md:grid-cols-[1fr_20rem] md:gap-14 md:pb-28">
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-12">
        <MesSalades
          majoration={majoration}
          onReprendre={(s) => {
            setSize(s.size);
            setPicked(regrouper(s.ingredients));
            setNomEnCours(null);
            setEnregistree(null);
            // La sélection reprise doit être visible : on remonte au premier
            // groupe, sinon on reste devant une liste qui a changé sans
            // qu'on voie quoi.
            document
              .getElementById("premier-groupe")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        {builderGroups.map((group, index) => {
          const single = group.suggested === 1;
          const chosen = picked[group.key] ?? [];

          return (
            <section key={group.key} id={index === 0 ? "premier-groupe" : undefined}>
              <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
                <h2 className="font-[family-name:var(--font-display)] text-[1.625rem] md:text-[1.875rem]">
                  {group.title}
                </h2>
                <p className="shrink-0 text-[0.8125rem] text-ink-3">
                  {single ? "Un seul choix" : group.helper}
                </p>
              </div>

              {/* Grille de vignettes : trois colonnes au pouce sur mobile,
                  six sur grand écran. Le pas est constant d'un groupe à
                  l'autre pour qu'on parcoure la page d'un seul regard. */}
              <div className="mt-5 grid auto-rows-fr grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 md:gap-3">
                {group.items.map((item) => (
                  <Vignette
                    key={item}
                    nom={item}
                    groupe={group.key}
                    version={vignettes[slugIngredient(item)]}
                    choisi={chosen.includes(item)}
                    onToggle={() => toggle(group.key, item, single)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      <aside className="md:sticky md:top-28 md:self-start">
        <div className="rounded-lg border border-ink/10 bg-cream-2/50 p-6">
          <p className="eyebrow">Votre salade</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {SIZES_COMPOSEE.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSize(s.key)}
                aria-pressed={size === s.key}
                className={cn(
                  "rounded-md border px-3 py-3 text-left transition-colors duration-300",
                  size === s.key
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/14 hover:border-ink/35"
                )}
              >
                <span className="block text-[0.875rem] font-medium">{s.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs tabular-nums",
                    size === s.key ? "text-cream/60" : "text-ink-3"
                  )}
                >
                  {euro(s.price + majoration)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 min-h-24 border-t border-ink/10 pt-4">
            {selection.length === 0 ? (
              <p className="text-[0.875rem] leading-relaxed text-ink-3">
                Choisissez une base et au moins une protéine pour commencer.
                Les légumes et les protéines sont à volonté.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {selection.map((item) => (
                  <li
                    key={item}
                    className="chip-in rounded-full bg-cream px-2.5 py-1 text-xs text-ink-2 ring-1 ring-inset ring-ink/8"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!ready && selection.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-tomato">
              {!hasBase && "Il manque une base."}
              {!hasBase && !hasProtein && " "}
              {!hasProtein && "Il manque au moins une protéine."}
            </p>
          )}

          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              add({
                kind: "composee",
                name: `Salade composée · ${SIZES_COMPOSEE.find((s) => s.key === size)!.label}`,
                detail: selection,
                size,
                majoration,
                unitPrice: price,
                image: "salade-composee",
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
            {added ? "Ajouté au panier ✓" : `Ajouter — ${euro(price)}`}
          </button>

          {added && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 w-full text-center text-[0.8125rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
            >
              Voir mon panier
            </button>
          )}

          {/* ----------------------------------------------------------
              Enregistrer la composition.

              Volontairement au second plan : un lien, pas un bouton. Le
              geste principal de cette page reste « ajouter au panier ».
              Le champ ne s'ouvre que si on le demande, avec un nom déjà
              proposé — enregistrer ne coûte alors qu'une frappe.
             ---------------------------------------------------------- */}
          {ready && (
            <div className="mt-4 border-t border-ink/10 pt-4">
              {nomEnCours === null ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setNomEnCours(nomPropose(picked));
                      setEnregistree(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 text-[0.8125rem] text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden fill="none">
                      <path
                        d="M4 2h8v12l-4-3-4 3V2z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Enregistrer cette salade
                  </button>
                  {enregistree && (
                    <p className="mt-2 text-center text-[0.75rem] text-olive-deep">
                      « {enregistree} » enregistrée — retrouvez-la en haut de cette page.
                    </p>
                  )}
                </>
              ) : nbSalades >= MAX_SALADES ? (
                <div className="text-[0.75rem] leading-relaxed text-ink-3">
                  <p>
                    {MAX_SALADES} salades enregistrées, c’est le maximum. Supprimez-en une
                    en haut de la page pour faire de la place.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNomEnCours(null)}
                    className="mt-1 underline underline-offset-4 hover:text-ink"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const nom = nomEnCours.trim() || nomPropose(picked);
                    const id = enregistrer({ nom, size, ingredients: selection });
                    if (id) {
                      setEnregistree(nom);
                      setNomEnCours(null);
                    }
                  }}
                >
                  <label
                    htmlFor="nom-salade"
                    className="block text-[0.75rem] font-medium text-ink-2"
                  >
                    Nom de votre salade
                  </label>
                  <input
                    id="nom-salade"
                    value={nomEnCours}
                    onChange={(e) => setNomEnCours(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setNomEnCours(null)}
                    onFocus={(e) => e.currentTarget.select()}
                    autoFocus
                    maxLength={MAX_NOM}
                    className="mt-1.5 w-full rounded-md border border-ink/20 bg-cream px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      className="h-10 flex-1 rounded-full bg-ink text-[0.875rem] font-medium text-cream transition-colors duration-300 hover:bg-olive-deep"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setNomEnCours(null)}
                      className="h-10 shrink-0 px-3 text-[0.8125rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-3">
            {majoration > 0 ? (
              <>
                <strong className="font-semibold text-ink-2">
                  +{euro(MAJORATION_COMPOSEE.montant)} appliqué
                </strong>{" "}
                : les salades composées passent à ce tarif après{" "}
                {MAJORATION_COMPOSEE.heure.replace(":", "h")}.
              </>
            ) : (
              <>
                +{euro(MAJORATION_COMPOSEE.montant)} sur les salades composées après{" "}
                {MAJORATION_COMPOSEE.heure.replace(":", "h")}.
              </>
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { computeTotals, minutesUntilCutoff } from "@/lib/pricing";
import { Dish } from "@/components/ui/Dish";
import { cn, euro, listFr } from "@/lib/utils";
import { restaurant } from "@/lib/restaurant";

/**
 * Tiroir panier.
 *
 * Toujours monté, rendu inerte quand il est fermé : la transition d’entrée
 * comme de sortie est purement CSS, aucun moteur d’animation n’est chargé,
 * et le contenu reste hors du parcours clavier tant qu’il est masqué.
 */
export function CartDrawer() {
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const totals = computeTotals(lines);
  const remaining = minutesUntilCutoff();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-ink/35 backdrop-blur-[2px] transition-opacity duration-400",
          "[transition-timing-function:var(--ease-soft)]",
          open ? "opacity-100" : "pointer-events-none invisible opacity-0"
        )}
      />

      <aside
        role="dialog"
        aria-modal={open}
        aria-label="Votre commande"
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-[61] flex w-full max-w-[27rem] flex-col bg-cream shadow-float",
          "transition-transform duration-[420ms] [transition-timing-function:var(--ease-soft)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-ink/8 px-6 py-5">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[1.5rem]">
              Votre commande
            </h2>
            {lines.length > 0 && (
              <p className="mt-0.5 text-xs text-ink-3">À retirer au {restaurant.street}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le panier"
            className="-mr-2 grid size-10 place-items-center rounded-full text-ink-3 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-ink">
              Votre panier est vide.
            </p>
            <p className="text-sm text-ink-3">
              Les recettes changent chaque jour — il y a forcément la vôtre.
            </p>
            <Link
              href="/la-carte"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-olive-deep"
            >
              Voir la carte
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="flex flex-col gap-5">
                {lines.map((line) => (
                  <li key={line.id} className="chip-in flex gap-4">
                    <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-md bg-cream-2">
                      <Dish slot={line.image} alt="" fill sizes="72px" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[0.9375rem] font-medium">{line.name}</p>
                        <p className="shrink-0 text-[0.9375rem] tabular-nums">
                          {euro(line.unitPrice * line.qty)}
                        </p>
                      </div>

                      {line.detail.length > 0 && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-3">
                          {listFr(line.detail)}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-ink/12">
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty - 1)}
                            aria-label={`Retirer un ${line.name}`}
                            className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink"
                          >
                            <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                              <path d="M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </button>
                          <span className="w-5 text-center text-[0.8125rem] tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty + 1)}
                            aria-label={`Ajouter un ${line.name}`}
                            className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink"
                          >
                            <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          className="text-xs text-ink-3 underline-offset-4 transition-colors hover:text-tomato hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-ink/8 bg-cream-2/60 px-6 pb-6 pt-5">
              {totals.earlyBird ? (
                <p className="mb-4 rounded-md bg-olive-wash px-3 py-2.5 text-xs leading-relaxed text-olive-deep">
                  <strong className="font-semibold">−10 % appliqué.</strong> Précommande
                  avant {restaurant.earlyBird.cutoff.replace(":", "h")}
                  {remaining !== null && remaining <= 60 ? ` — encore ${remaining} min.` : "."}
                </p>
              ) : (
                remaining !== null && (
                  <p className="mb-4 rounded-md bg-cream px-3 py-2.5 text-xs text-ink-3">
                    −10 % en commandant pour demain, ou avant{" "}
                    {restaurant.earlyBird.cutoff.replace(":", "h")} le jour même.
                  </p>
                )
              )}

              <dl className="mb-4 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-ink-3">
                  <dt>Sous-total</dt>
                  <dd className="tabular-nums">{euro(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-olive-deep">
                    <dt>Remise précommande</dt>
                    <dd className="tabular-nums">−{euro(totals.discount)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-ink/8 pt-2.5 text-base font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{euro(totals.total)}</dd>
                </div>
              </dl>

              <Link
                href="/commander"
                onClick={() => setOpen(false)}
                className="flex h-[3.25rem] items-center justify-center rounded-full bg-ink text-[0.9375rem] font-medium text-cream transition-colors duration-300 hover:bg-olive-deep"
              >
                Passer commande
              </Link>
              <p className="mt-3 text-center text-[0.6875rem] text-ink-3">
                Paiement Apple&nbsp;Pay, Google&nbsp;Pay ou carte
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

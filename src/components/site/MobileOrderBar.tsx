"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, selectCount } from "@/lib/cart";
import { computeTotals } from "@/lib/pricing";
import { euro } from "@/lib/utils";
import { restaurant } from "@/lib/restaurant";

/**
 * Barre fixe mobile. Deux états :
 *  — panier vide : appeler / voir la carte ;
 *  — panier rempli : total + accès direct au paiement.
 * Toujours à portée de pouce, jamais au-dessus d’un champ de saisie.
 */
export function MobileOrderBar() {
  const pathname = usePathname();
  const count = useCart(selectCount);
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);

  // Sur le tunnel de commande, la barre ferait doublon avec le bouton de paiement.
  if (pathname.startsWith("/commander")) return null;

  const totals = computeTotals(lines);
  const filled = hydrated && count > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="h-16 bg-gradient-to-t from-cream via-cream/85 to-transparent" />
      <div className="pointer-events-auto bg-cream/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        {filled ? (
          <div className="chip-in flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-[3.25rem] flex-1 items-center justify-between rounded-full bg-ink pl-5 pr-2 text-cream"
            >
              <span className="text-[0.9375rem] font-medium">
                {count} article{count > 1 ? "s" : ""}
                <span className="ml-2 text-cream/70 tabular-nums">{euro(totals.total)}</span>
              </span>
              <span className="grid h-[2.5rem] place-items-center rounded-full bg-cream/15 px-4 text-[0.8125rem] font-medium">
                Voir
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${restaurant.phoneHref}`}
              aria-label="Appeler Le Révélant"
              className="grid size-[3.25rem] shrink-0 place-items-center rounded-full border border-ink/15 text-ink"
            >
              <svg viewBox="0 0 20 20" fill="none" className="size-[18px]" aria-hidden>
                <path
                  d="M4.4 3h2.7l1.3 3.3-1.6 1.1a9.5 9.5 0 0 0 4.8 4.8l1.1-1.6L16 11.9v2.7A1.4 1.4 0 0 1 14.5 16 12.6 12.6 0 0 1 3 4.5 1.4 1.4 0 0 1 4.4 3Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <Link
              href="/la-carte"
              className="flex h-[3.25rem] flex-1 items-center justify-center rounded-full bg-ink text-[0.9375rem] font-medium text-cream"
            >
              Commander
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

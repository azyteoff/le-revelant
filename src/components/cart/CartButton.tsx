"use client";

import { useCart, selectCount } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function CartButton({ light = false }: { light?: boolean }) {
  const count = useCart(selectCount);
  const hydrated = useCart((s) => s.hydrated);
  const setOpen = useCart((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Panier${count ? `, ${count} article${count > 1 ? "s" : ""}` : " vide"}`}
      className={cn(
        "relative grid size-10 place-items-center rounded-full transition-colors duration-300",
        light ? "text-cream hover:bg-cream/10" : "text-ink hover:bg-ink/5"
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
        <path
          d="M6.2 8h11.6l-.9 10.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L6.2 8Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M9.4 9.6V7a2.6 2.6 0 0 1 5.2 0v2.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>

      {hydrated && count > 0 && (
        // `key` sur le compteur : chaque ajout rejoue la pastille.
        <span
          key={count}
          className="pop absolute -right-0.5 -top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-tomato px-1 text-[0.625rem] font-semibold leading-[1.15rem] text-cream"
        >
          {count}
        </span>
      )}
    </button>
  );
}

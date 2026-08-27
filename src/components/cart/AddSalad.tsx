"use client";

import { useState } from "react";
import { SIZES, type Salad } from "@/lib/catalog";
import { useCart, lineId } from "@/lib/cart";
import { cn, euro } from "@/lib/utils";

/**
 * Ajout d’une salade signature. Les deux formats sont exposés d’emblée :
 * une seule action pour commander, aucun écran intermédiaire.
 */
export function AddSalad({
  salad,
  tone = "light",
  className,
}: {
  salad: Salad;
  /** `light` = posé sur une photo sombre, `dark` = posé sur le fond crème. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {SIZES.map((size) => (
        <button
          key={size.key}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            add({
              kind: "salade",
              name: `${salad.name} · ${size.label}`,
              detail: salad.ingredients,
              size: size.key,
              unitPrice: size.price,
              image: salad.image,
            });
            setJustAdded(size.key);
            setTimeout(() => setJustAdded((v) => (v === size.key ? null : v)), 1400);
          }}
          aria-label={`Ajouter ${salad.name} ${size.label} au panier, ${size.price} euros`}
          className={cn(
            "h-10 flex-1 rounded-full text-[0.8125rem] font-medium transition-colors duration-300",
            "[transition-timing-function:var(--ease-soft)]",
            tone === "light"
              ? // Le survol doit être franchement perceptible : on descend
                // d'un cran vers le beige au lieu de rester dans le blanc.
                "bg-cream/92 text-ink hover:bg-sand"
              : "border border-ink/15 text-ink hover:border-ink/35 hover:bg-ink/[0.06]",
            justAdded === size.key && "!bg-olive-deep !text-cream !border-olive-deep"
          )}
        >
          {justAdded === size.key ? "Ajouté ✓" : `${size.label} · ${euro(size.price)}`}
        </button>
      ))}
    </div>
  );
}

/**
 * Ajout d’une boisson ou d’un dessert.
 *
 * L’état du bouton reflète le panier, pas un minuteur : tant que le produit
 * y figure, la pastille reste verte et affiche la quantité. On voit d’un coup
 * d’œil ce qu’on a déjà pris, et un nouveau clic en ajoute un de plus.
 */
export function AddSimple({
  name,
  price,
  image,
  kind,
}: {
  name: string;
  price: number;
  image: string;
  kind: "boisson" | "dessert";
}) {
  const add = useCart((s) => s.add);
  const id = lineId({ kind, name, detail: [], unitPrice: price, image });
  const qty = useCart((s) => s.lines.find((l) => l.id === id)?.qty ?? 0);

  return (
    <button
      type="button"
      onClick={() => add({ kind, name, detail: [], unitPrice: price, image })}
      aria-label={
        qty > 0
          ? `Ajouter un ${name} de plus, ${qty} déjà au panier`
          : `Ajouter ${name} au panier, ${price} euros`
      }
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-300",
        qty > 0
          ? "border-olive-deep bg-olive-deep text-cream"
          : "border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/[0.06]"
      )}
    >
      {qty > 0 ? (
        <span className="text-[0.8125rem] font-semibold tabular-nums">{qty}</span>
      ) : (
        <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
          <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

/**
 * Ajout d’un plat mijoté, dans l’une de ses deux formules.
 * Les tarifs viennent de `FORMULES` : ils n’ont rien à voir avec ceux
 * des salades, et se modifient indépendamment.
 */
export function AddPlat({
  nom,
  slug,
  formules,
  tone = "light",
  className,
}: {
  nom: string;
  slug: string;
  formules: { key: string; court: string; label: string; price: number }[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {formules.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            add({
              kind: "plat",
              name: `${nom} · ${f.label}`,
              detail: [],
              formule: f.key as "plat" | "complet",
              unitPrice: f.price,
              image: `plats/${slug}`,
            });
            setJustAdded(f.key);
            setTimeout(() => setJustAdded((v) => (v === f.key ? null : v)), 1400);
          }}
          aria-label={`Ajouter ${nom}, formule ${f.label}, ${f.price} euros`}
          className={cn(
            "h-10 flex-1 rounded-full text-[0.8125rem] font-medium transition-colors duration-300",
            "[transition-timing-function:var(--ease-soft)]",
            tone === "light"
              ? "bg-cream/92 text-ink hover:bg-sand"
              : "border border-ink/15 text-ink hover:border-ink/35 hover:bg-ink/[0.06]",
            justAdded === f.key && "!bg-olive-deep !text-cream !border-olive-deep"
          )}
        >
          {justAdded === f.key ? "Ajouté ✓" : `${f.court} · ${euro(f.price)}`}
        </button>
      ))}
    </div>
  );
}

import { Dish } from "@/components/ui/Dish";
import { AddSimple } from "@/components/cart/AddSalad";
import type { SimpleProduct } from "@/lib/catalog";
import { euro } from "@/lib/utils";

/**
 * Ligne produit pour les boissons et les desserts : une vignette, un nom,
 * un prix, un bouton. Rien de plus — ce sont des ajouts de dernière seconde,
 * ils ne doivent pas concurrencer les salades visuellement.
 */
export function SimpleRow({
  product,
  kind,
}: {
  product: SimpleProduct;
  kind: "boisson" | "dessert";
}) {
  return (
    <li className="group flex items-center gap-4 border-b border-ink/8 py-4 last:border-b-0">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-2">
        <Dish
          slot={product.image}
          alt={product.name}
          fill
          sizes="56px"
          className="transition-transform duration-500 [transition-timing-function:var(--ease-soft)] group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-medium">{product.name}</p>
        {product.note && <p className="mt-0.5 text-xs text-ink-3">{product.note}</p>}
      </div>

      <p className="shrink-0 text-[0.9375rem] tabular-nums text-ink-2">{euro(product.price)}</p>

      <AddSimple
        kind={kind}
        name={product.name}
        price={product.price}
        image={product.image}
      />
    </li>
  );
}

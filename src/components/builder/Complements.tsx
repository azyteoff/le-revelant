import { SimpleRow } from "@/components/menu/SimpleRow";
import { drinks, desserts } from "@/lib/catalog";
import { euro } from "@/lib/utils";

/**
 * Boissons et desserts, en bas de la page Composer.
 *
 * Ce sont des ajouts de dernière seconde : ils arrivent après le plat ou la
 * salade, jamais avant, et reprennent exactement la présentation de « La
 * carte » — même composant, même vignette, même bouton. Un client qui les a
 * vus une fois les reconnaît.
 */
export function Complements() {
  return (
    <section
      id="complements"
      className="border-t border-ink/10 bg-cream-2/40 py-16 md:py-20"
    >
      <div className="shell">
        <p className="eyebrow">Pour compléter</p>
        <h2 className="fluid-section mt-3 max-w-[18ch]">Boissons et desserts</h2>
        <p className="mt-4 max-w-[48ch] text-[1.0625rem] leading-relaxed text-ink-3">
          Tous à {euro(2)}, à ajouter à votre commande.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-[1.375rem]">
              Les desserts
            </h3>
            <ul className="mt-3">
              {desserts.map((d) => (
                <SimpleRow key={d.slug} product={d} kind="dessert" />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-[1.375rem]">
              Les boissons
            </h3>
            <ul className="mt-3">
              {drinks.map((d) => (
                <SimpleRow key={d.slug} product={d} kind="boisson" />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { SaladBuilder } from "./SaladBuilder";
import { PlatBuilder, type PlatDuJour, type Accompagnement } from "./PlatBuilder";
import { cn } from "@/lib/utils";

/**
 * Le choix d'entrée : une salade, ou un plat chaud.
 *
 * Deux composeurs sur une même page, jamais l'un sous l'autre : mis bout à
 * bout ils feraient une page interminable où l'on ne saurait plus ce qu'on
 * est en train de composer. Un sélecteur, deux univers, la même grammaire
 * dans les deux — on n'a rien à réapprendre en changeant d'onglet.
 *
 * Le plat chaud ne s'affiche que si la cuisine a mis des plats et au moins
 * une base à l'ardoise ; sinon la page redevient ce qu'elle était, sans
 * onglet ni case vide.
 */
export function Composeur({
  vignettes,
  plats,
  bases,
  garnitures,
  platsCommandables,
  platComposable,
}: {
  vignettes: Record<string, string>;
  plats: PlatDuJour[];
  bases: Accompagnement[];
  garnitures: Accompagnement[];
  platsCommandables: boolean;
  platComposable: boolean;
}) {
  const [onglet, setOnglet] = useState<"salade" | "plat">("salade");

  if (!platComposable) return <SaladBuilder vignettes={vignettes} />;

  const onglets = [
    { cle: "salade" as const, titre: "Une salade", detail: "31 ingrédients au comptoir" },
    { cle: "plat" as const, titre: "Un plat chaud", detail: "Plat, base et garniture" },
  ];

  return (
    <>
      <div className="shell pt-8">
        <div
          role="tablist"
          aria-label="Que voulez-vous composer ?"
          className="grid grid-cols-2 gap-2 sm:max-w-lg"
        >
          {onglets.map((o) => {
            const actif = onglet === o.cle;
            return (
              <button
                key={o.cle}
                role="tab"
                type="button"
                aria-selected={actif}
                aria-controls={`panneau-${o.cle}`}
                id={`onglet-${o.cle}`}
                onClick={() => setOnglet(o.cle)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-colors duration-300",
                  actif
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/14 hover:border-ink/35 hover:bg-cream-2/60"
                )}
              >
                <span className="block text-[0.9375rem] font-medium">{o.titre}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[0.75rem]",
                    actif ? "text-cream/65" : "text-ink-3"
                  )}
                >
                  {o.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panneau-${onglet}`}
        aria-labelledby={`onglet-${onglet}`}
        // La clé force un remontage : le récapitulatif collant du composeur
        // quitté ne doit pas rester à l'écran pendant la transition.
        key={onglet}
      >
        {onglet === "salade" ? (
          <SaladBuilder vignettes={vignettes} />
        ) : (
          <PlatBuilder
            plats={plats}
            bases={bases}
            garnitures={garnitures}
            commandable={platsCommandables}
          />
        )}
      </div>
    </>
  );
}

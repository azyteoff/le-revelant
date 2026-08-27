import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Apparition à l’entrée dans le viewport : 18 px de translation, rien d’autre.
 *
 * Composant serveur, sans une ligne de JavaScript. L’animation est pilotée par
 * `animation-timeline: view()` (voir globals.css) : le navigateur la relie
 * lui-même à la position de défilement.
 *
 * Là où la timeline n’est pas prise en charge, la règle entière est ignorée et
 * le contenu s’affiche simplement — pas de page blanche, pas de dépendance à
 * l’hydratation. `prefers-reduced-motion` la désactive également.
 *
 * `delay` décale le début de la plage d’animation, ce qui produit le décalage
 * en cascade d’une grille sans recourir à `animation-delay` (inopérant sur une
 * timeline de défilement).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  /** Décalage en secondes, converti en retard de plage (0 à ~0,2). */
  delay?: number;
  className?: string;
  id?: string;
}) {
  const offset = Math.min(delay, 0.2) * 60; // 0.1 s → 6 % de la plage
  return (
    <div
      id={id}
      className={cn("reveal", className)}
      style={offset ? ({ "--reveal-start": `${offset}%` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Pastille de ligne de transport.
 *
 * Par défaut, la pastille est dessinée aux couleurs officielles RATP/SNCF :
 * un disque pour le métro, un carré pour le RER. C'est fidèle, léger, et
 * ça n'engage aucun droit d'usage de logo.
 *
 * Pour utiliser les vrais logos officiels : déposez le fichier dans
 * `public/img/transports/` en le nommant d'après la ligne — `metro-3.svg`,
 * `rer-c.svg` — puis passez `logo` à `true` dans `restaurant.metro`.
 * Le composant bascule alors sur l'image, sans autre modification.
 */

export type LigneTransport = {
  /** « metro » ou « rer ». */
  reseau: "metro" | "rer";
  /** Numéro ou lettre : « 3 », « C »… */
  ligne: string;
  station: string;
  /** Passer à true une fois le fichier déposé dans public/img/transports/. */
  logo?: boolean;
};

/** Couleurs officielles des lignes desservant le restaurant. */
const COULEURS: Record<string, { fond: string; texte: string }> = {
  "metro-3": { fond: "#6E6E00", texte: "#ffffff" },
  "rer-c": { fond: "#F99D1C", texte: "#ffffff" },
};

export function PastilleLigne({
  reseau,
  ligne,
  logo = false,
  className,
}: LigneTransport & { className?: string }) {
  const cle = `${reseau}-${ligne.toLowerCase()}`;
  const couleurs = COULEURS[cle] ?? { fond: "#4b4b4b", texte: "#ffffff" };
  const nomComplet = `${reseau === "metro" ? "Métro" : "RER"} ligne ${ligne}`;

  if (logo) {
    return (
      <Image
        src={`/img/transports/${cle}.svg`}
        alt={nomComplet}
        width={24}
        height={24}
        className={cn("size-6 shrink-0", className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={nomComplet}
      style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
      className={cn(
        "grid size-6 shrink-0 place-items-center text-[0.75rem] font-bold leading-none",
        // Le métro est rond, le RER est carré : c'est la convention francilienne.
        reseau === "metro" ? "rounded-full" : "rounded-[3px]",
        className
      )}
    >
      {ligne}
    </span>
  );
}

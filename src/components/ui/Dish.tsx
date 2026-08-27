import Image, { type ImageProps } from "next/image";
import blur from "@/lib/blur.generated.json";
import platBlur from "@/lib/plat-photos.generated.json";
import { cn } from "@/lib/utils";

// Les plats sont adressés « plats/<slug> » : leurs placeholders vivent dans
// un second fichier généré, on expose les deux sous la même clé.
const blurMap: Record<string, string> = {
  ...(blur as Record<string, string>),
  ...Object.fromEntries(
    Object.entries(platBlur as Record<string, string>).map(([slug, data]) => [
      `plats/${slug}`,
      data,
    ])
  ),
};

type Props = Omit<ImageProps, "src" | "placeholder" | "blurDataURL"> & {
  /** Slot du manifeste content/photos.json. */
  slot: string;
};

/**
 * Image produit. Un seul point de passage pour toute la photo du site :
 * next/image sert AVIF puis WebP, le LQIP vient du manifeste généré.
 */
export function Dish({ slot, alt, className, ...rest }: Props) {
  const blurDataURL = blurMap[slot];
  return (
    <Image
      src={`/img/${slot}.jpg`}
      alt={alt}
      className={cn("object-cover", className)}
      {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
      {...rest}
    />
  );
}

import type { Metadata } from "next";
import { Composeur } from "@/components/builder/Composeur";
import { Complements } from "@/components/builder/Complements";
import { allBuilderItems, SIZES, FORMULES } from "@/lib/catalog";
import { euro } from "@/lib/utils";
import { vignettesIngredients } from "@/lib/phototheque";
import { lireArdoise } from "@/lib/ardoise";

export const metadata: Metadata = {
  title: "Composer — salade ou plat chaud, Paris 17",
  description: `Composez votre salade parmi ${allBuilderItems.length} ingrédients (${euro(SIZES[0].price)} la petite, ${euro(SIZES[1].price)} la grande) ou votre plat chaud : plat mijoté, base et garniture, ${euro(FORMULES[0].price)} à ${euro(FORMULES[1].price)}. Commande en ligne, retrait Paris 17.`,
  alternates: { canonical: "/composer" },
};

export default async function ComposerPage() {
  const [vignettes, ardoise] = await Promise.all([vignettesIngredients(), lireArdoise()]);

  return (
    <>
      <header className="border-b border-ink/8 bg-cream-2/40 pb-12 pt-32 md:pb-14 md:pt-40">
        <div className="shell">
          <p className="eyebrow">
            {ardoise.platComposable ? "Le comptoir" : "Le bar à salade"}
          </p>
          <h1 className="fluid-section mt-4 max-w-[15ch]">
            Composez exactement la vôtre.
          </h1>
          <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-3">
            {ardoise.platComposable ? (
              <>
                {allBuilderItems.length} ingrédients pour votre salade, ou un plat mijoté
                avec la base et la garniture de votre choix. Enregistrez vos compositions
                préférées : vous les retrouverez ici, prêtes à commander.
              </>
            ) : (
              <>
                {allBuilderItems.length} ingrédients au comptoir. Une base, autant de
                protéines que vous voulez, et tout ce qui vous fait envie autour.
                Enregistrez vos compositions préférées : vous les retrouverez ici, prêtes
                à commander.
              </>
            )}
          </p>
        </div>
      </header>

      <Composeur
        vignettes={vignettes}
        plats={ardoise.platsDuJour.map((p) => ({
          nom: p.nom,
          slug: p.slug,
          famille: p.famille,
          description: p.description,
        }))}
        bases={ardoise.basesDuJour}
        garnitures={ardoise.garnituresDuJour}
        platsCommandables={ardoise.platsCommandables}
        platComposable={ardoise.platComposable}
      />

      <Complements />
    </>
  );
}

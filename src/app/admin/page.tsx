import type { Metadata } from "next";
import { EcranArdoise } from "./EcranArdoise";
import { repertoirePlats } from "@/lib/plats";
import { lireArdoise } from "@/lib/ardoise";
import { salads } from "@/lib/catalog";
import { lireCommandes, jourParis } from "@/lib/commandes";
import { lireAccompagnements } from "@/lib/accompagnements";

export const metadata: Metadata = { title: "L’ardoise" };

// Les commandes et l'ardoise changent en continu : jamais de cache.
export const dynamic = "force-dynamic";

export default async function AdminArdoisePage() {
  const [commandes, ardoise, accompagnements] = await Promise.all([
    lireCommandes(),
    lireArdoise(),
    lireAccompagnements(),
  ]);
  const aujourdhui = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <EcranArdoise
      jour={aujourdhui}
      initial={{
        plats: ardoise.platsDuJour.map((p) => p.nom),
        bases: ardoise.basesDuJour.map((a) => a.nom),
        garnitures: ardoise.garnituresDuJour.map((a) => a.nom),
        platsCommandables: ardoise.platsCommandables,
        salades: ardoise.saladesChoisies,
        message: ardoise.messageDuJour ?? "",
      }}
      repertoire={repertoirePlats.map((p) => ({
        nom: p.nom,
        famille: p.famille,
        slug: p.slug,
        description: p.description,
      }))}
      basesConnues={accompagnements.bases.map((a) => a.nom)}
      garnituresConnues={accompagnements.garnitures.map((a) => a.nom)}
      saladesDisponibles={salads.map((s) => s.name)}
      nbCommandes={commandes.length}
      jourCle={jourParis()}
    />
  );
}

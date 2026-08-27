import type { Metadata } from "next";
import { EcranCommandes } from "./EcranCommandes";
import { lireCommandes, joursDisponibles, jourParis } from "@/lib/commandes";

export const metadata: Metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const { jour } = await searchParams;
  const choisi = jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : jourParis();

  const [commandes, jours] = await Promise.all([lireCommandes(choisi), joursDisponibles()]);

  return (
    <EcranCommandes
      jour={choisi}
      jours={jours.length ? jours : [jourParis()]}
      commandes={commandes}
    />
  );
}

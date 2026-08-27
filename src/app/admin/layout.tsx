import type { Metadata } from "next";
import { NavAdmin } from "./NavAdmin";
import { Alerte } from "./Alerte";
import { sessionOuverte } from "@/lib/admin-garde";

export const metadata: Metadata = {
  title: { default: "Espace restaurant", template: "%s · Espace restaurant" },
  robots: { index: false, follow: false },
};

/**
 * Coquille du back-office.
 *
 * Volontairement sans le décor du site public : pas de hero, pas de photo de
 * fond, pas d'animation. Un outil qu'on ouvre à 9h du matin doit être calme,
 * dense et immédiatement lisible.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const connecte = await sessionOuverte();

  // L'écran de connexion se rend seul, sans barre de navigation.
  if (!connecte) return <>{children}</>;

  return (
    <div className="min-h-screen bg-cream-2/40">
      <NavAdmin />
      <Alerte />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 md:px-8">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/Checkout";

export const metadata: Metadata = {
  title: "Ma commande",
  description:
    "Finalisez votre commande : retrait au 23 rue Guillaume Tell, Paris 17. Paiement Apple Pay, Google Pay ou carte, sans créer de compte.",
  robots: { index: false, follow: true },
};

export default function CommanderPage() {
  return (
    <>
      <header className="border-b border-ink/8 bg-cream-2/40 pb-10 pt-32 md:pb-12 md:pt-40">
        <div className="shell">
          <p className="eyebrow">Commande</p>
          <h1 className="fluid-section mt-4 max-w-[16ch]">Presque à table.</h1>
        </div>
      </header>

      <Checkout />
    </>
  );
}

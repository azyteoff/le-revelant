import type { Metadata } from "next";
import Link from "next/link";
import { Leaf } from "@/components/ui/Logo";
import { restaurant } from "@/lib/restaurant";
import { euro } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Commande confirmée",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k]);

  const reference = one("ref") ?? "—";
  const pickup = one("pickup");
  const firstName = one("prenom");
  const total = Number(one("total"));

  return (
    <div className="shell flex min-h-[80svh] flex-col items-center justify-center py-32 text-center">
      <Leaf className="size-8 text-olive" />

      <h1 className="fluid-section mt-8 max-w-[18ch]">
        {firstName ? `Merci ${firstName}, c’est noté.` : "C’est noté."}
      </h1>

      <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-3">
        Votre commande est enregistrée. Présentez votre référence au comptoir,
        {pickup ? ` à ${pickup}` : " entre 12h et 15h"}.
      </p>

      <div className="mt-10 w-full max-w-sm rounded-lg border border-ink/10 bg-cream-2/50 p-7">
        <p className="eyebrow">Référence</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-[2.25rem] tracking-[-0.02em]">
          {reference}
        </p>

        <dl className="mt-6 flex flex-col gap-2 border-t border-ink/10 pt-5 text-left text-[0.875rem]">
          {pickup && (
            <div className="flex justify-between">
              <dt className="text-ink-3">Retrait</dt>
              <dd className="tabular-nums">{pickup}</dd>
            </div>
          )}
          {Number.isFinite(total) && total > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-3">Total</dt>
              <dd className="tabular-nums">{euro(total)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-3">Adresse</dt>
            <dd className="text-right">
              {restaurant.street}
              <br />
              {restaurant.postalCode} {restaurant.city}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <a
          href={restaurant.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-ink px-7 py-3.5 text-[0.9375rem] font-medium text-cream transition-colors hover:bg-olive-deep"
        >
          Ouvrir l’itinéraire
        </a>
        <Link
          href="/la-carte"
          className="rounded-full border border-ink/15 px-7 py-3.5 text-[0.9375rem] font-medium transition-colors hover:border-ink/35 hover:bg-ink/[0.04]"
        >
          Retour à la carte
        </Link>
      </div>

      <p className="mt-10 text-[0.8125rem] text-ink-3">
        Un souci ?{" "}
        <a href={`tel:${restaurant.phoneHref}`} className="underline underline-offset-4 hover:text-ink">
          {restaurant.phone}
        </a>
      </p>
    </div>
  );
}

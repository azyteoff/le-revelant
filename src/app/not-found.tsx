import Link from "next/link";
import { Leaf } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[80svh] flex-col items-center justify-center py-32 text-center">
      <Leaf className="size-7 text-olive" />
      <h1 className="fluid-section mt-8 max-w-[16ch]">Cette page n’est pas au menu.</h1>
      <p className="mt-5 max-w-[38ch] text-[1.0625rem] text-ink-3">
        Elle a peut-être changé d’adresse. La carte, elle, n’a pas bougé.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/la-carte"
          className="rounded-full bg-ink px-7 py-3.5 text-[0.9375rem] font-medium text-cream transition-colors hover:bg-olive-deep"
        >
          Voir la carte
        </Link>
        <Link
          href="/"
          className="rounded-full border border-ink/15 px-7 py-3.5 text-[0.9375rem] font-medium transition-colors hover:border-ink/35"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

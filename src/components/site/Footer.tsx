import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { restaurant } from "@/lib/restaurant";

const columns = [
  {
    title: "Commander",
    links: [
      { href: "/la-carte", label: "La carte du jour" },
      { href: "/plats-du-jour", label: "Les plats chauds" },
      { href: "/composer", label: "Composer ma salade" },
      { href: "/commander", label: "Mon panier" },
    ],
  },
  {
    title: "La maison",
    links: [
      { href: "/le-restaurant", label: "Le restaurant" },
      { href: "/le-restaurant#horaires", label: "Horaires & accès" },
      { href: "/salade-paris-17", label: "Salade à Paris 17" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-px bg-ink text-cream">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="text-2xl text-cream" />
            <p className="mt-4 max-w-[22rem] text-sm leading-relaxed text-cream/70">
              Des salades composées le matin même, rue Guillaume Tell, dans le 17e.
              Rien de plus, rien de moins.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title}>
              <h3 className="eyebrow !text-cream/60">{col.title}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-cream/75 underline-offset-4 transition-colors hover:text-cream hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="eyebrow !text-cream/60">Nous trouver</h3>
            <address className="mt-5 flex flex-col gap-3 text-sm not-italic text-cream/75">
              <a
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 transition-colors hover:text-cream hover:underline"
              >
                {restaurant.street}
                <br />
                {restaurant.postalCode} {restaurant.city}
              </a>
              <a
                href={`tel:${restaurant.phoneHref}`}
                className="underline-offset-4 transition-colors hover:text-cream hover:underline"
              >
                {restaurant.phone}
              </a>
              <span className="text-cream/50">Lundi — vendredi · 12h à 15h</span>
              <a
                href={restaurant.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 underline-offset-4 transition-colors hover:text-cream hover:underline"
              >
                <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden>
                  <rect x="3" y="3" width="14" height="14" rx="4.2" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="14.2" cy="5.9" r="0.9" fill="currentColor" />
                </svg>
                Instagram
              </a>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs text-cream/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Le Révélant — Paris 17e</p>
          <p>Fait à Paris. Cuisiné chaque matin.</p>
        </div>
      </div>

      {/* Espace pour la barre de commande mobile */}
      <div className="h-20 md:hidden" />
    </footer>
  );
}

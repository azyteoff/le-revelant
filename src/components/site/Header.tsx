"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { CartButton } from "@/components/cart/CartButton";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/la-carte", label: "La carte" },
  { href: "/plats-du-jour", label: "Plats du jour" },
  { href: "/composer", label: "Composer" },
  { href: "/le-restaurant", label: "Le restaurant" },
];

/** Position de défilement, lue directement depuis le navigateur. */
const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // La home a un hero plein écran : l’en-tête y démarre transparent.
  const overlay = pathname === "/";

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false // rendu serveur : toujours en haut de page
  );

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const solid = scrolled || !overlay || menuOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500",
          "[transition-timing-function:var(--ease-soft)]",
          solid
            ? "border-b border-ink/8 bg-cream/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 md:h-20">
          <Link
            href="/"
            aria-label="Le Révélant — accueil"
            className={cn(
              "text-[1.0625rem] transition-colors duration-500 md:text-lg",
              solid ? "text-ink" : "text-cream"
            )}
          >
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
                    solid
                      ? active
                        ? "text-ink"
                        : "text-ink-3 hover:text-ink"
                      : "text-cream/80 hover:text-cream"
                  )}
                >
                  {item.label}
                  {active && solid && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-px bg-olive" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-3">
            <CartButton light={!solid} />

            <ButtonLink
              href="/la-carte"
              size="sm"
              className={cn(
                "hidden md:inline-flex",
                solid ? "" : "bg-cream text-ink hover:bg-cream hover:text-olive-deep"
              )}
            >
              Commander
            </ButtonLink>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className={cn(
                "-mr-1 grid size-10 place-items-center rounded-full transition-colors md:hidden",
                solid ? "text-ink hover:bg-ink/5" : "text-cream hover:bg-cream/10"
              )}
            >
              <span className="relative block h-3 w-5">
                <span
                  className={cn(
                    "absolute inset-x-0 h-px bg-current transition-transform duration-400 [transition-timing-function:var(--ease-soft)]",
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 h-px bg-current transition-transform duration-400 [transition-timing-function:var(--ease-soft)]",
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile plein écran. Toujours monté, rendu inerte quand il est
          fermé : la transition reste fluide sans embarquer de moteur d’animation
          et rien n’est atteignable au clavier derrière le voile. */}
      <div
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-40 bg-cream pt-16 transition-opacity duration-300 md:hidden",
          "[transition-timing-function:var(--ease-soft)]",
          menuOpen ? "opacity-100" : "pointer-events-none invisible opacity-0"
        )}
      >
        <nav className="shell flex flex-col pt-10">
          {[...nav, { href: "/commander", label: "Mon panier" }].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: menuOpen ? `${0.05 + i * 0.05}s` : "0s" }}
              className={cn(
                "block border-b border-ink/8 py-5 font-[family-name:var(--font-display)] text-[2rem] tracking-[-0.03em]",
                "transition-[opacity,transform] duration-500 [transition-timing-function:var(--ease-soft)]",
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

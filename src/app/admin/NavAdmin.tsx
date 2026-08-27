"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const onglets = [
  { href: "/admin", label: "L’ardoise" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/photos", label: "Photos" },
];

export function NavAdmin() {
  const pathname = usePathname();
  const router = useRouter();

  async function sortir() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/connexion");
    router.refresh();
  }

  return (
    <header className="border-b border-ink/10 bg-cream">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Leaf className="size-5 text-olive" />
          <span className="font-[family-name:var(--font-display)] text-[1.125rem]">
            Espace restaurant
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full px-3.5 py-2 text-[0.8125rem] text-ink-3 transition-colors hover:bg-ink/5 hover:text-ink sm:block"
          >
            Voir le site
          </a>
          <button
            type="button"
            onClick={sortir}
            className="rounded-full px-3.5 py-2 text-[0.8125rem] text-ink-3 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Quitter
          </button>
        </div>
      </div>

      <nav className="mx-auto flex w-full max-w-5xl gap-1 px-3 md:px-6">
        {onglets.map((o) => {
          const actif = o.href === "/admin" ? pathname === "/admin" : pathname.startsWith(o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "relative px-3.5 py-3 text-[0.9375rem] transition-colors duration-200",
                actif ? "font-medium text-ink" : "text-ink-3 hover:text-ink"
              )}
            >
              {o.label}
              {actif && <span className="absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-olive" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

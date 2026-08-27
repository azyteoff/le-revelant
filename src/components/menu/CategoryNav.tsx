"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Barre de catégories collante. Suit la section visible via un
 * IntersectionObserver — aucun calcul de scroll, aucun listener bruyant.
 * Défilement horizontal sur mobile.
 */
export function CategoryNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="sticky top-16 z-30 border-b border-ink/8 bg-cream/88 backdrop-blur-xl md:top-20">
      <div className="shell">
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto py-2.5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-colors duration-300",
                active === s.id
                  ? "bg-ink text-cream"
                  : "text-ink-3 hover:bg-ink/5 hover:text-ink"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

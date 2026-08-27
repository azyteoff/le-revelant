import { cn } from "@/lib/utils";

/**
 * Marque. La feuille est réduite à deux courbes : un signe, pas un pictogramme
 * de fast-food. Elle sert aussi de favicon et d’icône d’application.
 */
export function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-5", className)} aria-hidden>
      <path
        d="M20.5 3.5C10.8 3.5 5 8.4 5 15.1c0 2.2.7 4 1.9 5.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M20.5 3.5c0 9.3-5.3 14.3-13.6 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 leading-none", className)}>
      <Leaf className="size-[1.05em] translate-y-[0.12em] text-olive" />
      <span className="font-[family-name:var(--font-display)] tracking-[-0.03em]">
        {compact ? "Révélant" : "Le Révélant"}
      </span>
    </span>
  );
}

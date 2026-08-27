"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const motDePasse = String(new FormData(e.currentTarget).get("motDePasse") ?? "");
    setErreur(null);
    setOccupe(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasse }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error ?? "Connexion impossible.");
        return;
      }
      router.replace(suite && suite.startsWith("/admin") ? suite : "/admin");
      router.refresh();
    } catch {
      setErreur("Le serveur ne répond pas.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-8 flex flex-col gap-3">
      <label>
        <span className="sr-only">Mot de passe</span>
        <input
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          placeholder="Mot de passe"
          className="h-12 w-full rounded-md border border-ink/14 bg-cream px-4 text-[0.9375rem] placeholder:text-ink-3/70 focus:border-olive focus:outline-none"
        />
      </label>

      {erreur && (
        <p role="alert" className="rounded-md bg-tomato/8 px-3.5 py-2.5 text-[0.8125rem] text-tomato">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={occupe}
        className={cn(
          "flex h-12 items-center justify-center rounded-full bg-ink text-[0.9375rem] font-medium text-cream",
          "transition-colors duration-300 hover:bg-olive-deep disabled:opacity-60"
        )}
      >
        {occupe ? "Un instant…" : "Entrer"}
      </button>
    </form>
  );
}

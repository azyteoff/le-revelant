"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Commande } from "@/lib/commandes";
import { cn, euro } from "@/lib/utils";

/**
 * Les commandes du service.
 *
 * Écran pensé pour être lu en cuisine, debout, entre deux assiettes :
 * groupé par créneau de retrait, la ligne la plus urgente en haut, et un seul
 * geste par commande — « préparée », puis « remise ». Une commande remise
 * s'efface visuellement au lieu de disparaître, pour qu'on puisse revenir
 * dessus si le client se présente plus tard.
 */
export function EcranCommandes({
  jour,
  jours,
  commandes,
}: {
  jour: string;
  jours: string[];
  commandes: Commande[];
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [masquerRemises, setMasquerRemises] = useState(false);

  const parCreneau = useMemo(() => {
    const visibles = masquerRemises ? commandes.filter((c) => c.etat !== "remise") : commandes;
    const groupes = new Map<string, Commande[]>();
    for (const c of visibles) {
      const cle = c.creneau || "Sans créneau";
      groupes.set(cle, [...(groupes.get(cle) ?? []), c]);
    }
    return [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [commandes, masquerRemises]);

  const aPreparer = commandes.filter((c) => c.etat !== "remise").length;
  const chiffre = commandes.reduce((n, c) => n + c.total, 0);

  async function marquer(reference: string, etat: Commande["etat"]) {
    setEnCours(reference);
    try {
      await fetch("/api/admin/commandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jour, reference, etat }),
      });
      router.refresh();
    } finally {
      setEnCours(null);
    }
  }

  const dateLisible = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${jour}T12:00:00`));

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{dateLisible}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2rem]">
            {commandes.length === 0
              ? "Aucune commande"
              : `${commandes.length} commande${commandes.length > 1 ? "s" : ""}`}
          </h1>
          {commandes.length > 0 && (
            <p className="mt-1.5 text-[0.875rem] text-ink-3">
              {aPreparer} à préparer · {euro(chiffre)} encaissés
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {jours.length > 1 && (
            <select
              value={jour}
              onChange={(e) => router.push(`/admin/commandes?jour=${e.target.value}`)}
              className="h-10 rounded-full border border-ink/14 bg-cream px-4 text-[0.875rem] focus:border-olive focus:outline-none"
            >
              {jours.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="h-10 rounded-full border border-ink/14 px-4 text-[0.875rem] transition-colors hover:border-ink/35 hover:bg-ink/[0.04]"
          >
            Actualiser
          </button>
        </div>
      </div>

      {commandes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/20 bg-cream px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-[1.5rem]">
            Rien pour l’instant.
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] text-[0.9375rem] leading-relaxed text-ink-3">
            Les commandes passées sur le site apparaissent ici, groupées par heure de retrait.
            Cette page ne se met pas à jour toute seule : touchez « Actualiser ».
          </p>
        </div>
      ) : (
        <>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[0.875rem] text-ink-2">
            <input
              type="checkbox"
              checked={masquerRemises}
              onChange={(e) => setMasquerRemises(e.target.checked)}
              className="size-4 accent-olive-deep"
            />
            Masquer les commandes remises
          </label>

          {parCreneau.map(([creneau, liste]) => (
            <section key={creneau}>
              <h2 className="flex items-baseline gap-3 font-[family-name:var(--font-display)] text-[1.5rem]">
                {creneau}
                <span className="font-[family-name:var(--font-sans)] text-[0.8125rem] text-ink-3">
                  {liste.length} commande{liste.length > 1 ? "s" : ""}
                </span>
              </h2>

              <ul className="mt-3 flex flex-col gap-2.5">
                {liste.map((c) => (
                  <li
                    key={c.reference}
                    className={cn(
                      "rounded-lg border bg-cream p-4 transition-opacity md:p-5",
                      c.etat === "remise" ? "border-ink/10 opacity-55" : "border-ink/12"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-3">
                          <span className="font-[family-name:var(--font-display)] text-[1.25rem]">
                            {c.reference}
                          </span>
                          <span className="text-[0.9375rem]">{c.client.prenom}</span>
                          <a
                            href={`tel:${c.client.telephone.replace(/\s/g, "")}`}
                            className="text-[0.875rem] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
                          >
                            {c.client.telephone}
                          </a>
                        </p>
                        <p className="mt-0.5 text-[0.75rem] text-ink-3">
                          Reçue à{" "}
                          {new Intl.DateTimeFormat("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Paris",
                          }).format(new Date(c.recuLe))}
                          {c.paiement === "démonstration" && " · paiement non encaissé (démo)"}
                        </p>
                      </div>

                      <p className="shrink-0 font-[family-name:var(--font-display)] text-[1.25rem] tabular-nums">
                        {euro(c.total)}
                      </p>
                    </div>

                    <ul className="mt-3.5 flex flex-col gap-1.5 border-t border-ink/8 pt-3.5">
                      {c.lignes.map((l, i) => (
                        <li key={i} className="flex gap-3 text-[0.9375rem]">
                          <span className="w-6 shrink-0 tabular-nums text-ink-3">{l.quantite}×</span>
                          <span className="min-w-0 flex-1">
                            {l.nom}
                            {l.description && (
                              <span className="block text-[0.8125rem] leading-relaxed text-ink-3">
                                {l.description}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {c.notes && (
                      <p className="mt-3 rounded-md bg-tomato/8 px-3 py-2 text-[0.875rem] text-tomato">
                        <strong className="font-semibold">Note du client :</strong> {c.notes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {(["recue", "preparee", "remise"] as const).map((etat) => {
                        const libelle =
                          etat === "recue" ? "Reçue" : etat === "preparee" ? "Préparée" : "Remise";
                        const actif = c.etat === etat;
                        return (
                          <button
                            key={etat}
                            type="button"
                            disabled={enCours === c.reference}
                            onClick={() => marquer(c.reference, etat)}
                            aria-pressed={actif}
                            className={cn(
                              "rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-200 disabled:opacity-50",
                              actif
                                ? "border-olive-deep bg-olive-deep text-cream"
                                : "border-ink/14 text-ink-2 hover:border-ink/35 hover:bg-ink/[0.04]"
                            )}
                          >
                            {libelle}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

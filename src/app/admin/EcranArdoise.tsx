"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import platPhotos from "@/lib/plat-photos.generated.json";
import { cn } from "@/lib/utils";

const flous = platPhotos as Record<string, string>;

type PlatRef = { nom: string; famille: string; slug: string; description: string };

const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const nomAffiche = (nom: string) => nom.replace(/^V[ée]g[ée]tarien\s*[-–—]\s*/i, "");

/**
 * Une petite liste en texte libre : les bases et les garnitures.
 *
 * Elles ne se choisissent pas dans un répertoire fermé — la cuisine en
 * invente. On tape donc ce qu'on sert aujourd'hui, et ce qui a déjà été
 * servi se repropose d'un clic juste en dessous : au bout de quelques
 * jours, on ne tape plus rien.
 */
function ListeLibre({
  titre,
  aide,
  placeholder,
  valeurs,
  connus,
  onChange,
  max = 8,
}: {
  titre: string;
  aide: string;
  placeholder: string;
  valeurs: string[];
  connus: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const [saisie, setSaisie] = useState("");
  const cle = (n: string) => n.trim().toLowerCase();

  const ajouter = (nom: string) => {
    const propre = nom.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!propre) return;
    if (valeurs.some((v) => cle(v) === cle(propre))) return;
    if (valeurs.length >= max) return;
    onChange([...valeurs, propre]);
    setSaisie("");
  };

  const suggestions = connus.filter((n) => !valeurs.some((v) => cle(v) === cle(n)));

  return (
    <div className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">{titre}</h2>
        <p className="text-[0.8125rem] text-ink-3">
          {valeurs.length} proposée{valeurs.length > 1 ? "s" : ""}
        </p>
      </div>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">{aide}</p>

      {valeurs.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {valeurs.map((nom) => (
            <li key={nom}>
              <span className="flex items-center gap-1.5 rounded-full border border-olive-deep bg-olive-wash py-1.5 pl-3.5 pr-1.5 text-[0.875rem]">
                {nom}
                <button
                  type="button"
                  onClick={() => onChange(valeurs.filter((v) => v !== nom))}
                  aria-label={`Retirer ${nom}`}
                  className="grid size-6 place-items-center rounded-full text-ink-3 transition-colors hover:bg-tomato/12 hover:text-tomato"
                >
                  <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ajouter(saisie);
        }}
        className="mt-4 flex gap-2"
      >
        <label className="sr-only" htmlFor={`ajout-${titre}`}>
          {titre}
        </label>
        <input
          id={`ajout-${titre}`}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={placeholder}
          maxLength={60}
          disabled={valeurs.length >= max}
          className="h-11 flex-1 rounded-md border border-ink/14 bg-cream-2/40 px-3.5 text-[0.9375rem] placeholder:text-ink-3/70 focus:border-olive focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!saisie.trim() || valeurs.length >= max}
          className="h-11 shrink-0 rounded-md border border-ink/14 px-4 text-[0.875rem] transition-colors hover:border-ink/35 hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ajouter
        </button>
      </form>

      {suggestions.length > 0 && valeurs.length < max && (
        <>
          <p className="mt-4 text-[0.75rem] uppercase tracking-wide text-ink-3">
            Déjà proposé
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((nom) => (
              <button
                key={nom}
                type="button"
                onClick={() => ajouter(nom)}
                className="rounded-full border border-ink/14 px-3 py-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:border-ink/35 hover:bg-cream-2/60"
              >
                + {nom}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * L'écran du matin.
 *
 * Une seule tâche à l'écran : composer l'ardoise. On cherche un plat, on
 * clique, il entre dans la liste ; on reclique, il en sort. Aucun formulaire
 * à valider champ par champ, un seul bouton d'enregistrement, et un rappel
 * permanent de ce qui n'est pas encore sauvegardé.
 */
export function EcranArdoise({
  jour,
  initial,
  repertoire,
  basesConnues,
  garnituresConnues,
  saladesDisponibles,
  nbCommandes,
  jourCle,
}: {
  jour: string;
  initial: {
    plats: string[];
    bases: string[];
    garnitures: string[];
    platsCommandables: boolean;
    salades: string[];
    message: string;
  };
  repertoire: PlatRef[];
  basesConnues: string[];
  garnituresConnues: string[];
  saladesDisponibles: string[];
  nbCommandes: number;
  jourCle: string;
}) {
  const router = useRouter();

  const [plats, setPlats] = useState<string[]>(initial.plats);
  const [bases, setBases] = useState<string[]>(initial.bases);
  const [garnitures, setGarnitures] = useState<string[]>(initial.garnitures);
  const [commandables, setCommandables] = useState(initial.platsCommandables);
  const [salades, setSalades] = useState<string[]>(initial.salades);
  const [message, setMessage] = useState(initial.message);

  const [recherche, setRecherche] = useState("");
  const [famille, setFamille] = useState<string | null>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok" | "erreur">("repos");
  const [erreur, setErreur] = useState<string | null>(null);

  const modifie =
    JSON.stringify({ plats, bases, garnitures, commandables, salades, message }) !==
    JSON.stringify({
      plats: initial.plats,
      bases: initial.bases,
      garnitures: initial.garnitures,
      commandables: initial.platsCommandables,
      salades: initial.salades,
      message: initial.message,
    });

  const familles = useMemo(() => {
    const compte = new Map<string, number>();
    for (const p of repertoire) compte.set(p.famille, (compte.get(p.famille) ?? 0) + 1);
    return [...compte.entries()].map(([f, n]) => ({ famille: f, total: n })).sort((a, b) => b.total - a.total);
  }, [repertoire]);

  const resultats = useMemo(() => {
    const q = normaliser(recherche);
    return repertoire
      .filter(
        (p) =>
          (!famille || p.famille === famille) &&
          (!q || normaliser(p.nom).includes(q) || normaliser(p.description).includes(q))
      )
      .slice(0, 60);
  }, [repertoire, recherche, famille]);

  const basculer = (nom: string) =>
    setPlats((liste) =>
      liste.includes(nom) ? liste.filter((n) => n !== nom) : [...liste, nom].slice(0, 8)
    );

  async function enregistrer() {
    setEtat("envoi");
    setErreur(null);
    try {
      const res = await fetch("/api/admin/ardoise", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plats,
          bases,
          garnitures,
          platsCommandables: commandables,
          salades,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error ?? "Enregistrement impossible.");
        setEtat("erreur");
        return;
      }
      setEtat("ok");
      router.refresh();
      setTimeout(() => setEtat("repos"), 2500);
    } catch {
      setErreur("Le serveur ne répond pas.");
      setEtat("erreur");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{jour}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2rem] first-letter:uppercase">
            L’ardoise du jour
          </h1>
        </div>
        <Link
          href="/admin/commandes"
          className="inline-flex items-center gap-2 rounded-full border border-ink/14 px-4 py-2.5 text-[0.875rem] transition-colors hover:border-ink/35 hover:bg-ink/[0.04]"
        >
          {nbCommandes === 0
            ? "Aucune commande aujourd’hui"
            : `${nbCommandes} commande${nbCommandes > 1 ? "s" : ""} aujourd’hui`}
        </Link>
      </div>

      {/* Les plats retenus */}
      <section className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
            Les plats du jour
          </h2>
          <p className="text-[0.8125rem] text-ink-3">
            {plats.length} sur 4 — cliquez un plat ci-dessous pour l’ajouter
          </p>
        </div>

        {plats.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-ink/20 px-4 py-6 text-center text-[0.875rem] text-ink-3">
            Aucun plat retenu. La section « Plats chauds » sera masquée sur le site.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {plats.map((nom, i) => {
              const ref = repertoire.find((p) => p.nom === nom);
              return (
                <li
                  key={nom}
                  className="flex items-center gap-3 rounded-md border border-ink/10 bg-cream-2/50 p-2.5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[0.6875rem] font-semibold text-cream">
                    {i + 1}
                  </span>
                  {ref && (
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-cream-2">
                      <Image
                        src={`/img/plats/${ref.slug}.jpg`}
                        alt=""
                        fill
                        sizes="44px"
                        {...(flous[ref.slug]
                          ? { placeholder: "blur" as const, blurDataURL: flous[ref.slug] }
                          : {})}
                        className="object-cover"
                      />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem]">{nomAffiche(nom)}</span>
                    <span className="block text-[0.75rem] text-ink-3">{ref?.famille}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => basculer(nom)}
                    aria-label={`Retirer ${nom} de l’ardoise`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-tomato/10 hover:text-tomato"
                  >
                    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Le répertoire */}
      <section className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
          Choisir dans le répertoire
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Chercher une recette</span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            >
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13.2 13.2 17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher : poulet, vanille, végétarien…"
              className="h-11 w-full rounded-full border border-ink/14 bg-cream-2/40 pl-10 pr-4 text-[0.9375rem] placeholder:text-ink-3/80 focus:border-olive focus:outline-none"
            />
          </label>

          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            <button
              type="button"
              onClick={() => setFamille(null)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.75rem] transition-colors",
                famille === null ? "border-ink bg-ink text-cream" : "border-ink/14 text-ink-2 hover:border-ink/35"
              )}
            >
              Tout · {repertoire.length}
            </button>
            {familles.map((f) => (
              <button
                key={f.famille}
                type="button"
                onClick={() => setFamille(famille === f.famille ? null : f.famille)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.75rem] transition-colors",
                  famille === f.famille
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/14 text-ink-2 hover:border-ink/35"
                )}
              >
                {f.famille} · {f.total}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 grid max-h-[26rem] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {resultats.map((p) => {
            const retenu = plats.includes(p.nom);
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => basculer(p.nom)}
                  aria-pressed={retenu}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors duration-200",
                    retenu
                      ? "border-olive-deep bg-olive-wash"
                      : "border-transparent hover:border-ink/12 hover:bg-cream-2/60"
                  )}
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-cream-2">
                    <Image
                      src={`/img/plats/${p.slug}.jpg`}
                      alt=""
                      fill
                      sizes="40px"
                      {...(flous[p.slug]
                        ? { placeholder: "blur" as const, blurDataURL: flous[p.slug] }
                        : {})}
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem]">{nomAffiche(p.nom)}</span>
                    <span className="block truncate text-[0.75rem] text-ink-3">{p.famille}</span>
                  </span>
                  {retenu && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-olive-deep text-cream">
                      <svg viewBox="0 0 14 14" className="size-2.5" aria-hidden>
                        <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {resultats.length === 0 && (
            <li className="col-span-full py-8 text-center text-[0.875rem] text-ink-3">
              Aucune recette ne correspond.
            </li>
          )}
        </ul>
      </section>

      {/* Ce qui accompagne les plats mijotés */}
      <section className="grid gap-5 md:grid-cols-2">
        <ListeLibre
          titre="Les bases du jour"
          aide="Le féculent servi sous le plat : riz, fusili, semoule… Le client en choisit une seule."
          placeholder="Riz, Fusili, Semoule…"
          valeurs={bases}
          connus={basesConnues}
          onChange={setBases}
        />
        <ListeLibre
          titre="Les garnitures du jour"
          aide="L’accompagnement de légumes. Facultatif pour le client : sans garniture le plat est à 11 €, avec il passe à 13 €."
          placeholder="Lentilles, Tagliatelles de courgettes…"
          valeurs={garnitures}
          connus={garnituresConnues}
          onChange={setGarnitures}
        />
      </section>

      {bases.length === 0 && plats.length > 0 && (
        <p className="rounded-md border border-dashed border-ink/25 px-4 py-3 text-center text-[0.875rem] text-ink-3">
          Sans base, « Composez votre plat chaud » n’apparaît pas sur le site. Les plats
          restent commandables en formule.
        </p>
      )}

      {/* Réglages */}
      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
            Vente en ligne
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
            Quand c’est ouvert, les clients peuvent payer les plats en ligne aux tarifs des
            deux formules. Sinon les plats restent affichés, avec la mention « à commander au
            comptoir ».
          </p>
          <button
            type="button"
            onClick={() => setCommandables((v) => !v)}
            aria-pressed={commandables}
            className={cn(
              "mt-4 flex w-full items-center justify-between gap-4 rounded-md border px-4 py-3 transition-colors",
              commandables ? "border-olive-deep bg-olive-wash" : "border-ink/14 bg-cream-2/40"
            )}
          >
            <span className="text-[0.9375rem] font-medium">
              {commandables ? "Ouverte" : "Fermée"}
            </span>
            <span
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-300",
                commandables ? "bg-olive-deep" : "bg-ink/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-cream transition-transform duration-300",
                  commandables ? "translate-x-[1.375rem]" : "translate-x-0.5"
                )}
              />
            </span>
          </button>
        </div>

        <div className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
            Message sur la carte
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
            Une phrase affichée en haut de la page « La carte ». Laissez vide pour ne rien
            afficher.
          </p>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            placeholder="Fermeture exceptionnelle vendredi 15 août."
            className="mt-4 h-11 w-full rounded-md border border-ink/14 bg-cream-2/40 px-3.5 text-[0.9375rem] placeholder:text-ink-3/70 focus:border-olive focus:outline-none"
          />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
          Salades proposées
        </h2>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
          Ne cochez rien pour proposer les {saladesDisponibles.length} recettes — c’est le
          réglage habituel. Cochez pour n’en proposer que certaines.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {saladesDisponibles.map((nom) => {
            const coche = salades.includes(nom);
            return (
              <button
                key={nom}
                type="button"
                onClick={() =>
                  setSalades((l) => (l.includes(nom) ? l.filter((n) => n !== nom) : [...l, nom]))
                }
                aria-pressed={coche}
                className={cn(
                  "rounded-full border px-4 py-2 text-[0.875rem] transition-colors",
                  coche ? "border-olive-deep bg-olive-deep text-cream" : "border-ink/14 text-ink-2 hover:border-ink/35"
                )}
              >
                {nom}
              </button>
            );
          })}
        </div>
      </section>

      {/* Barre d'enregistrement, collée en bas tant qu'il y a des changements */}
      <div
        className={cn(
          "sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border p-4 shadow-lift transition-all duration-300 sm:flex-row sm:items-center sm:justify-between",
          modifie ? "border-olive-deep bg-cream" : "border-ink/10 bg-cream"
        )}
      >
        <p className="text-[0.875rem] text-ink-2">
          {etat === "ok" ? (
            <span className="font-medium text-olive-deep">Ardoise enregistrée. Le site est à jour.</span>
          ) : erreur ? (
            <span className="text-tomato">{erreur}</span>
          ) : modifie ? (
            "Modifications non enregistrées."
          ) : (
            <span className="text-ink-3">Tout est enregistré.</span>
          )}
        </p>
        <button
          type="button"
          onClick={enregistrer}
          disabled={!modifie || etat === "envoi"}
          className={cn(
            "h-11 shrink-0 rounded-full px-6 text-[0.9375rem] font-medium transition-colors duration-300",
            "disabled:cursor-not-allowed disabled:bg-ink/12 disabled:text-ink-3",
            "bg-ink text-cream hover:bg-olive-deep"
          )}
        >
          {etat === "envoi" ? "Enregistrement…" : "Enregistrer l’ardoise"}
        </button>
      </div>

      <p className="text-center text-[0.75rem] text-ink-3">
        Journal des commandes du {jourCle}. Les modifications sont écrites dans
        content/ardoise.json.
      </p>
    </div>
  );
}

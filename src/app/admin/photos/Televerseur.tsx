"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Une case photo remplaçable.
 *
 * Trois façons de changer la photo, et aucune n'exige de comprendre quoi que
 * ce soit : on clique sur la case, on y fait glisser un fichier, ou on tape
 * sur « Remplacer » depuis un téléphone (le sélecteur ouvre alors la
 * pellicule). Le reste — rognage, redimensionnement, compression, purge du
 * cache — se fait tout seul côté serveur.
 */

type Etat = "repos" | "survol" | "envoi" | "fait" | "erreur";

export function Televerseur({
  slot,
  titre,
  ou,
  forme,
  presente,
  version,
  restaurable,
}: {
  slot: string;
  titre: string;
  ou: string;
  forme: "paysage" | "carre" | "portrait";
  presente: boolean;
  version: string;
  restaurable: boolean;
}) {
  const champ = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<Etat>("repos");
  const [message, setMessage] = useState<string | null>(null);
  // `apercu` = l'image lue sur le disque du navigateur, affichée avant même
  // que l'envoi soit terminé. `v` = la version servie par le site une fois
  // l'envoi confirmé ; elle force le navigateur à recharger la photo.
  const [apercu, setApercu] = useState<string | null>(null);
  const [v, setV] = useState(version);
  const [aPhoto, setAPhoto] = useState(presente);
  const [peutRestaurer, setPeutRestaurer] = useState(restaurable);
  // Une photo posée sur un emplacement qui n'en avait aucune ne « revient »
  // à rien : on la retire, tout simplement.
  const [peutRetirer, setPeutRetirer] = useState(presente && !restaurable);

  async function envoyer(fichier: File | undefined) {
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) {
      setEtat("erreur");
      setMessage("Ce fichier n’est pas une image.");
      return;
    }

    const local = URL.createObjectURL(fichier);
    setApercu(local);
    setEtat("envoi");
    setMessage(null);

    const corps = new FormData();
    corps.set("emplacement", slot);
    corps.set("fichier", fichier);

    try {
      const reponse = await fetch("/api/admin/photo", { method: "POST", body: corps });
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok) {
        setEtat("erreur");
        setMessage(donnees.error ?? "L’envoi a échoué.");
        setApercu(null);
        URL.revokeObjectURL(local);
        return;
      }
      setV(String(donnees.version ?? Date.now()));
      setAPhoto(true);
      setPeutRestaurer(Boolean(donnees.restaurable));
      setPeutRetirer(!donnees.restaurable && Boolean(donnees.presente));
      setEtat("fait");
      setMessage(`En ligne · ${Math.max(1, Math.round((donnees.poids ?? 0) / 1024))} ko`);
      // On garde l'aperçu local jusqu'au rendu suivant : remplacer l'image
      // trop tôt ferait clignoter la case.
      setTimeout(() => {
        setApercu(null);
        URL.revokeObjectURL(local);
      }, 400);
    } catch {
      setEtat("erreur");
      setMessage("Connexion interrompue. Réessayez.");
      setApercu(null);
      URL.revokeObjectURL(local);
    }
  }

  async function restaurer() {
    setEtat("envoi");
    setMessage(null);
    try {
      const reponse = await fetch(`/api/admin/photo?emplacement=${encodeURIComponent(slot)}`, {
        method: "DELETE",
      });
      const donnees = await reponse.json().catch(() => ({}));
      if (!reponse.ok) {
        setEtat("erreur");
        setMessage(donnees.error ?? "Restauration impossible.");
        return;
      }
      setV(String(donnees.version ?? Date.now()));
      setPeutRestaurer(false);
      setAPhoto(Boolean(donnees.presente));
      setPeutRetirer(false);
      setEtat("fait");
      setMessage(peutRestaurer ? "Photo d’origine rétablie" : "Photo retirée");
    } catch {
      setEtat("erreur");
      setMessage("Connexion interrompue.");
    }
  }

  const src = apercu ?? `/img/${slot}.jpg?v=${v}`;
  const enCours = etat === "envoi";

  return (
    <div className="row-span-2 grid grid-rows-subgrid gap-2">
      <button
        type="button"
        onClick={() => champ.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!enCours) setEtat("survol");
        }}
        onDragLeave={() => setEtat((e) => (e === "survol" ? "repos" : e))}
        onDrop={(e) => {
          e.preventDefault();
          setEtat("repos");
          void envoyer(e.dataTransfer.files?.[0]);
        }}
        disabled={enCours}
        aria-label={`Remplacer la photo : ${titre}`}
        className={cn(
          "group relative block w-full overflow-hidden rounded-lg border bg-cream-2 text-left",
          "transition-[border-color,box-shadow] duration-200",
          forme === "carre" ? "aspect-square" : forme === "portrait" ? "aspect-[3/4]" : "aspect-[16/10]",
          etat === "survol"
            ? "border-olive-deep shadow-[0_0_0_3px_var(--color-olive-wash)]"
            : etat === "erreur"
              ? "border-tomato"
              : aPhoto
              ? "border-ink/12 hover:border-ink/35"
              // Une case vide se signale d'elle-même : trait pointillé, la
              // convention universelle du « déposez ici ».
              : "border-dashed border-ink/25 hover:border-ink/45"
        )}
      >
        {aPhoto && (
          // Photo de travail dans le back-office : une balise <img> simple,
          // pour que le `?v=` reprenne effet immédiatement après un envoi.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={cn(
              "size-full object-cover transition-opacity duration-300",
              enCours && "opacity-45"
            )}
          />
        )}

        {/*
          Deux états bien distincts. Une case remplie ne montre son invite
          qu'au survol, sous un voile sombre — la photo reste ce qu'on
          regarde. Une case vide n'a rien à masquer : elle affiche une
          invitation claire sur fond clair, sans le voile qui la ferait
          passer pour une image sombre.
        */}
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5",
            "transition-opacity duration-200",
            aPhoto
              ? [
                  "bg-ink/55 text-cream",
                  etat === "survol"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                ]
              : ["bg-cream-2 text-ink-3", etat === "survol" && "text-olive-deep"]
          )}
        >
          {enCours ? (
            <span className="text-[0.8125rem]">Envoi…</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="none">
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="px-2 text-center text-[0.75rem] leading-tight">
                {etat === "survol"
                  ? "Déposez la photo"
                  : aPhoto
                    ? "Remplacer"
                    : "Ajouter une photo"}
              </span>
            </>
          )}
        </span>
      </button>

      <input
        ref={champ}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          void envoyer(e.target.files?.[0]);
          // Remet le champ à zéro : sans ça, renvoyer deux fois le même
          // fichier ne déclencherait rien la seconde fois.
          e.target.value = "";
        }}
      />

      <div className="min-w-0 self-start">
        <p className="truncate text-[0.875rem] leading-snug">{titre}</p>
        <p className="truncate text-[0.75rem] text-ink-3">{ou}</p>
        {message && (
          <p
            className={cn(
              "mt-1 text-[0.75rem] leading-snug",
              etat === "erreur" ? "text-tomato" : "text-olive-deep"
            )}
          >
            {message}
          </p>
        )}
        {(peutRestaurer || peutRetirer) && !enCours && (
          <button
            type="button"
            onClick={restaurer}
            className="mt-1 text-[0.75rem] text-ink-3 underline underline-offset-2 hover:text-ink"
          >
            {peutRestaurer ? "Revenir à la photo d’origine" : "Retirer la photo"}
          </button>
        )}
      </div>
    </div>
  );
}

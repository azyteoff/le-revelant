import type { Metadata } from "next";
import { Televerseur } from "./Televerseur";
import { RUBRIQUES, etatPhotos } from "@/lib/phototheque";

export const metadata: Metadata = { title: "Photos" };
export const dynamic = "force-dynamic";

/**
 * Écran « Photos ».
 *
 * Toutes les images remplaçables du site, rangées par endroit, chacune sous
 * la forme de la case qu'elle occupe vraiment. On clique dessus, on choisit
 * un fichier, c'est en ligne. Aucun nom de fichier à respecter, aucun
 * dossier à trouver, aucune commande à lancer.
 */
export default async function AdminPhotosPage() {
  const etats = await etatPhotos();

  const total = RUBRIQUES.flatMap((r) => r.emplacements).length;
  const remplies = Object.values(etats).filter((e) => e.presente).length;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="eyebrow">Les images du site</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2rem]">Photos</h1>
        <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-3">
          Cliquez sur une image pour la remplacer, ou faites glisser un fichier dessus. Elle est
          recadrée, allégée et mise en ligne aussitôt — {remplies} emplacements sur {total} sont
          remplis.
        </p>
      </div>

      <div className="rounded-lg border border-ink/10 bg-cream p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.25rem]">
          Pour de belles photos
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-[0.9375rem] leading-relaxed text-ink-2">
          <li>À la lumière du jour, près d’une fenêtre, sans flash.</li>
          <li>Le produit occupe toute l’image, vu de dessus pour les bacs et les bols.</li>
          <li>JPEG, PNG ou WebP, 15 Mo maximum. Une photo prise au téléphone convient très bien.</li>
          <li>
            Sur iPhone, si l’envoi est refusé : Réglages › Appareil photo › Formats › « Le plus
            compatible ».
          </li>
        </ul>
      </div>

      {RUBRIQUES.map((rubrique) => (
        <section key={rubrique.cle}>
          <h2 className="font-[family-name:var(--font-display)] text-[1.375rem]">
            {rubrique.titre}
          </h2>
          <p className="mt-1.5 max-w-[68ch] text-[0.875rem] leading-relaxed text-ink-3">
            {rubrique.intro}
          </p>

          {/* `subgrid` : dans une rubrique où les formats diffèrent (une
              image large à côté de deux verticales), les légendes restent
              alignées sur une même ligne de base. */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rubrique.emplacements.map((e) => (
              <Televerseur
                key={e.slot}
                slot={e.slot}
                titre={e.titre}
                ou={e.ou}
                forme={e.forme}
                presente={etats[e.slot]?.presente ?? false}
                version={etats[e.slot]?.version ?? "0"}
                restaurable={etats[e.slot]?.restaurable ?? false}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

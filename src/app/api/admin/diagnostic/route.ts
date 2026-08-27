import { NextResponse } from "next/server";
import { refuserSiNonConnecte } from "@/lib/admin-garde";
import { blobActif, peutEcrire } from "@/lib/stockage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * « Est-ce que le back-office peut vraiment enregistrer ? »
 *
 * La question n'a pas de réponse théorique : selon l'hébergement, l'écriture
 * marche ou échoue. On fait donc un vrai aller-retour sur une clé jetable —
 * écrire, relire, effacer — et on répond par oui ou par non.
 *
 * C'est ce qui permet de le voir avant que le restaurant ne perde une
 * ardoise, plutôt qu'après.
 */
export async function GET() {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  const ecriture = await peutEcrire();

  return NextResponse.json({
    stockage: blobActif ? "blob" : "disque",
    ecriture,
    detail: ecriture
      ? null
      : blobActif
        ? "Le store Blob est déclaré mais refuse l’écriture."
        : "Hébergement sans disque inscriptible et sans store Blob connecté.",
  });
}

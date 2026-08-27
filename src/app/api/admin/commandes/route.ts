import { NextResponse } from "next/server";
import { refuserSiNonConnecte } from "@/lib/admin-garde";
import { changerEtat, jourParis, lireCommandes, type Commande } from "@/lib/commandes";

export const runtime = "nodejs";

const ETATS: Commande["etat"][] = ["recue", "preparee", "remise"];

export async function GET(request: Request) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  const jour = new URL(request.url).searchParams.get("jour") ?? jourParis();
  return NextResponse.json({ jour, commandes: await lireCommandes(jour) });
}

/** Marquer une commande comme préparée ou remise. */
export async function PATCH(request: Request) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  let corps: { jour?: string; reference?: string; etat?: string };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const etat = corps.etat as Commande["etat"];
  if (!ETATS.includes(etat)) {
    return NextResponse.json({ error: "État inconnu." }, { status: 400 });
  }

  const jour = corps.jour ?? jourParis();
  // Le jour est un nom de fichier : on refuse tout ce qui n'est pas une date.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) {
    return NextResponse.json({ error: "Jour invalide." }, { status: 400 });
  }

  const ok = await changerEtat(jour, String(corps.reference ?? ""), etat);
  if (!ok) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

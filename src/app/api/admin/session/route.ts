import { NextResponse } from "next/server";
import { COOKIE_SESSION } from "@/lib/admin-cookie";
import {
  creerJeton,
  motDePasseConfigure,
  optionsCookie,
  verifierMotDePasse,
} from "@/lib/admin-session";

export const runtime = "nodejs";

/** Connexion au back-office. */
export async function POST(request: Request) {
  if (!motDePasseConfigure()) {
    return NextResponse.json(
      {
        error:
          "Le back-office n’est pas configuré. Ajoutez ADMIN_PASSWORD dans le fichier .env.local, puis redémarrez le site.",
      },
      { status: 503 }
    );
  }

  let motDePasse = "";
  try {
    const body = await request.json();
    motDePasse = String(body?.motDePasse ?? "");
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  // Petite temporisation : rend le tâtonnement automatisé pénible sans
  // gêner un humain qui se trompe une fois.
  await new Promise((r) => setTimeout(r, 350));

  if (!verifierMotDePasse(motDePasse)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.set(COOKIE_SESSION, creerJeton(), optionsCookie(request));
  return reponse;
}

/** Déconnexion. */
export async function DELETE(request: Request) {
  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.set(COOKIE_SESSION, "", { ...optionsCookie(request), maxAge: 0 });
  return reponse;
}

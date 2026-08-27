import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESSION } from "./admin-cookie";
import { jetonValide, motDePasseConfigure } from "./admin-session";

/**
 * Vérification qui fait autorité, côté Node.
 *
 * Le middleware ne regarde que la présence du cookie ; c'est ici qu'on
 * contrôle réellement sa signature et son échéance. Toute page et toute route
 * du back-office doit appeler l'une de ces deux fonctions en premier.
 */

export async function sessionOuverte(): Promise<boolean> {
  if (!motDePasseConfigure()) return false;
  const jar = await cookies();
  return jetonValide(jar.get(COOKIE_SESSION)?.value);
}

/** Pour les routes API : renvoie une réponse d'erreur, ou null si tout va bien. */
export async function refuserSiNonConnecte(): Promise<NextResponse | null> {
  if (!motDePasseConfigure()) {
    return NextResponse.json(
      { error: "Back-office non configuré : ADMIN_PASSWORD manquant." },
      { status: 503 }
    );
  }
  if (!(await sessionOuverte())) {
    return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  }
  return null;
}

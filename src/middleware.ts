import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION } from "@/lib/admin-cookie";

/**
 * Garde d'entrée du back-office.
 *
 * Le middleware s'exécute sur le runtime Edge, où le module `node:crypto`
 * n'est pas disponible : on n'y vérifie donc que la *présence* du cookie,
 * pour rediriger tôt vers l'écran de connexion. La vérification réelle de la
 * signature se fait dans chaque page et chaque route serveur, côté Node —
 * c'est elle qui fait autorité.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // L'écran de connexion et sa route doivent rester accessibles.
  if (pathname === "/admin/connexion" || pathname.startsWith("/api/admin/session")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_SESSION)?.value;
  if (cookie) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/connexion";
  url.search = pathname === "/admin" ? "" : `?suite=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

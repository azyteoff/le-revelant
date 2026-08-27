import path from "node:path";
import { lire } from "@/lib/stockage";
import { DOSSIER_IMG } from "@/lib/phototheque";

export const runtime = "nodejs";

/**
 * Service des images remplaçables.
 *
 * Une photo changée depuis le back-office ne vit plus dans le dépôt : en
 * ligne elle est dans Vercel Blob, et Next ne saurait pas la servir depuis
 * `public/`. Les emplacements remplaçables sont donc réécrits vers cette
 * route (voir `next.config.ts`), qui rend la version enregistrée si elle
 * existe et retombe sinon sur le fichier livré avec le site.
 *
 * Les 208 photos de plats et les logos de transport ne passent pas par ici :
 * ils ne changent jamais et gardent le service statique, plus rapide.
 */

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const introuvable = () => new Response("Introuvable", { status: 404 });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chemin: string[] }> }
) {
  const { chemin } = await params;

  // Garde-fou : un segment `..` ou vide permettrait de sortir du dossier des
  // images. On refuse plutôt que de normaliser.
  if (
    chemin.length === 0 ||
    chemin.length > 3 ||
    chemin.some((s) => !s || s === "." || s === ".." || s.includes("/") || s.includes("\\"))
  ) {
    return introuvable();
  }

  const type = TYPES[path.extname(chemin[chemin.length - 1]).toLowerCase()];
  if (!type) return introuvable();

  const contenu = await lire(`${DOSSIER_IMG}/${chemin.join("/")}`);
  if (!contenu) return introuvable();

  return new Response(new Uint8Array(contenu), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(contenu.length),
      // Affichage instantané depuis le cache, et une photo remplacée
      // visible au bout d'une minute.
      "Cache-Control": "public, max-age=60, stale-while-revalidate=604800",
    },
  });
}

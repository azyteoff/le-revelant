import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { refuserSiNonConnecte } from "@/lib/admin-garde";
import { repertoirePlats, normaliser } from "@/lib/plats";
import { salads } from "@/lib/catalog";
import { enrichirRepertoire, lireAccompagnements } from "@/lib/accompagnements";
import { CLE_ARDOISE } from "@/lib/ardoise";
import { lireTexte, ecrireTexte } from "@/lib/stockage";

export const runtime = "nodejs";

/**
 * Lecture et écriture de l'ardoise du jour.
 *
 * Le fichier reste la source de vérité : le back-office ne fait que l'éditer,
 * exactement comme si on l'ouvrait dans un éditeur de texte. Le bloc d'aide
 * `$aide` est préservé, sinon la prochaine personne à ouvrir le fichier
 * perdrait le mode d'emploi.
 */

type Ardoise = {
  $aide?: string[];
  plats: string[];
  bases: string[];
  garnitures: string[];
  platsCommandables: boolean;
  salades: string[];
  message: string | null;
};

async function lire(): Promise<Ardoise> {
  // Le magasin sert l'ardoise enregistrée, et à défaut celle livrée avec le
  // site. Voir `src/lib/stockage.ts`.
  const texte = await lireTexte(CLE_ARDOISE);
  return texte ? JSON.parse(texte) : { plats: [], bases: [], garnitures: [], platsCommandables: true, salades: [], message: null };
}

export async function GET() {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  const ardoise = await lire();
  const repertoire = await lireAccompagnements();
  return NextResponse.json({
    plats: ardoise.plats ?? [],
    bases: ardoise.bases ?? [],
    garnitures: ardoise.garnitures ?? [],
    // Ce que la cuisine a déjà proposé : proposé d'un clic, jamais imposé.
    basesConnues: repertoire.bases.map((a) => a.nom),
    garnituresConnues: repertoire.garnitures.map((a) => a.nom),
    platsCommandables: ardoise.platsCommandables !== false,
    salades: ardoise.salades ?? [],
    message: ardoise.message ?? null,
    // Le catalogue accompagne la réponse : l'écran n'a pas à le deviner.
    repertoire: repertoirePlats.map((p) => ({
      nom: p.nom,
      famille: p.famille,
      slug: p.slug,
      description: p.description,
    })),
    saladesDisponibles: salads.map((s) => s.name),
  });
}

export async function PUT(request: Request) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  let corps: Partial<Ardoise>;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  // Validation : on n'accepte que des noms réellement au répertoire, sinon
  // le site afficherait une ardoise silencieusement amputée.
  const plats = Array.isArray(corps.plats) ? corps.plats.map(String) : [];
  if (plats.length > 8) {
    return NextResponse.json({ error: "Huit plats au maximum." }, { status: 400 });
  }
  const inconnus = plats.filter(
    (nom) => !repertoirePlats.some((p) => normaliser(p.nom) === normaliser(nom))
  );
  if (inconnus.length) {
    return NextResponse.json(
      { error: `« ${inconnus[0]} » ne figure pas au répertoire.` },
      { status: 400 }
    );
  }

  // Bases et garnitures sont du texte libre : la cuisine invente des
  // garnitures, il n'existe pas de liste fermée à valider. On se contente
  // de nettoyer, de borner, et d'écarter les doublons.
  const listeLibre = (brut: unknown, max: number) => {
    const vus = new Set<string>();
    const propre: string[] = [];
    for (const item of Array.isArray(brut) ? brut : []) {
      const nom = String(item).trim().replace(/\s+/g, " ").slice(0, 60);
      if (!nom) continue;
      const cle = nom.toLowerCase();
      if (vus.has(cle)) continue;
      vus.add(cle);
      propre.push(nom);
      if (propre.length >= max) break;
    }
    return propre;
  };
  // Une clé absente n'efface rien : seule une clé explicitement fournie
  // remplace la valeur en place. Sans cette distinction, un appel partiel —
  // un script, une intégration — viderait silencieusement les bases du jour
  // en ne parlant que des plats.
  const actuelleAvant = await lire();
  const bases =
    corps.bases === undefined ? actuelleAvant.bases ?? [] : listeLibre(corps.bases, 8);
  const garnitures =
    corps.garnitures === undefined
      ? actuelleAvant.garnitures ?? []
      : listeLibre(corps.garnitures, 8);

  const saladesChoisies = Array.isArray(corps.salades) ? corps.salades.map(String) : [];
  const saladesInconnues = saladesChoisies.filter(
    (nom) => !salads.some((s) => normaliser(s.name) === normaliser(nom))
  );
  if (saladesInconnues.length) {
    return NextResponse.json(
      { error: `La salade « ${saladesInconnues[0]} » n’existe pas.` },
      { status: 400 }
    );
  }

  const message = typeof corps.message === "string" ? corps.message.trim().slice(0, 200) : "";

  try {
    const actuelle = await lire();
    const suivante: Ardoise = {
      ...actuelle,
      // On réécrit les noms tels qu'ils figurent au répertoire : la casse et
      // les accents sont normalisés une bonne fois pour toutes.
      plats: plats.map(
        (nom) => repertoirePlats.find((p) => normaliser(p.nom) === normaliser(nom))!.nom
      ),
      bases,
      garnitures,
      platsCommandables: corps.platsCommandables !== false,
      salades: saladesChoisies.map(
        (nom) => salads.find((s) => normaliser(s.name) === normaliser(nom))!.name
      ),
      message: message || null,
    };

    await ecrireTexte(CLE_ARDOISE, JSON.stringify(suivante, null, 2) + "\n");

    // Ce qui vient d'être saisi entre au répertoire : demain, il se
    // proposera d'un clic au lieu d'être retapé.
    const ajoutes = await enrichirRepertoire(bases, garnitures);

    // Les pages publiques sont pré-rendues : sans cette purge, elles
    // continueraient d'afficher l'ancienne ardoise jusqu'au prochain build.
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, ajoutes });
  } catch (err) {
    console.error("Écriture de l’ardoise impossible :", err);
    return NextResponse.json(
      {
        error:
          "Impossible d’enregistrer l’ardoise. Réessayez dans un instant ; si le bandeau rouge est affiché en haut de l’écran, c’est l’hébergement qui refuse l’écriture.",
      },
      { status: 500 }
    );
  }
}

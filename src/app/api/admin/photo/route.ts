import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { refuserSiNonConnecte } from "@/lib/admin-garde";
import {
  LARGEURS,
  clephoto,
  cleOriginal,
  emplacement,
  etatPhoto,
} from "@/lib/phototheque";
import { ecrire, lire, lireEnregistre, supprimer } from "@/lib/stockage";

export const runtime = "nodejs";

/** 15 Mo : large pour une photo de téléphone, assez bas pour éviter l'accident. */
const TAILLE_MAX = 15 * 1024 * 1024;

const FORMATS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/gif": "GIF",
  "image/tiff": "TIFF",
};

const erreur = (message: string, code = 400) =>
  NextResponse.json({ error: message }, { status: code });

/**
 * Réception d'une photo depuis le back-office.
 *
 * Le fichier envoyé n'est jamais servi tel quel : il est réencodé en JPEG à
 * la bonne largeur. Une photo de 6 Mo prise au téléphone devient un fichier
 * de quelques centaines de kilo-octets, et le site reste rapide même si
 * personne au restaurant ne sait ce qu'est une image « optimisée ».
 */
export async function POST(request: Request) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  let formulaire: FormData;
  try {
    formulaire = await request.formData();
  } catch {
    return erreur("Envoi illisible.");
  }

  const slot = String(formulaire.get("emplacement") ?? "");
  const cible = emplacement(slot);
  // Le slot vient d'une liste fermée : impossible d'écrire ailleurs que dans
  // les emplacements prévus, quoi qu'on envoie.
  if (!cible) return erreur("Cet emplacement n’existe pas.");

  const fichier = formulaire.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return erreur("Aucun fichier reçu.");
  }
  if (fichier.size > TAILLE_MAX) {
    return erreur(
      `Photo trop lourde (${Math.round(fichier.size / 1024 / 1024)} Mo). Maximum 15 Mo.`
    );
  }
  if (fichier.type && !FORMATS[fichier.type]) {
    return erreur(
      fichier.type === "image/heic" || fichier.type === "image/heif"
        ? "Format HEIC non lisible. Sur iPhone : Réglages › Appareil photo › Formats › « Le plus compatible », ou envoyez la photo depuis Photos en JPEG."
        : "Format non pris en charge. Utilisez un JPEG, un PNG ou un WebP."
    );
  }

  const source = Buffer.from(await fichier.arrayBuffer());
  const destination = clephoto(slot);
  const largeur = LARGEURS[cible.forme];

  let sortie: Buffer;
  try {
    const image = sharp(source, { failOn: "error" })
      // Les photos de téléphone portent leur orientation en métadonnée :
      // sans cette rotation, une photo verticale arriverait couchée.
      .rotate();

    const meta = await image.metadata();
    if (!meta.width || !meta.height) return erreur("Fichier illisible comme image.");
    if (meta.width < 400 || meta.height < 400) {
      return erreur(
        `Photo trop petite (${meta.width}×${meta.height} px). Il en faut au moins 400 px de côté, sinon elle sera floue à l’écran.`
      );
    }

    sortie = await image
      .resize({
        width: largeur,
        height: cible.forme === "carre" ? largeur : undefined,
        fit: cible.forme === "carre" ? "cover" : "inside",
        // On ne grossit jamais une petite photo : ça ne ferait qu'alourdir
        // le fichier sans ajouter le moindre détail.
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch {
    return erreur("Cette image n’a pas pu être lue. Essayez un autre fichier.");
  }

  try {
    // Avant la toute première substitution, on met la photo d'origine de
    // côté : le bouton « revenir à la photo d'origine » n'existe que grâce
    // à cette copie. `lire` retombe sur le fichier livré avec le site, ce
    // qui permet de revenir à la photo d'origine même en ligne, où elle
    // n'a jamais été enregistrée.
    const original = cleOriginal(slot);
    const dejaSauvegardee = (await lireEnregistre(original)) !== null;
    if (!dejaSauvegardee) {
      const actuelle = await lire(destination);
      if (actuelle) await ecrire(original, actuelle, "image/jpeg");
    }

    await ecrire(destination, sortie, "image/jpeg");
  } catch (err) {
    console.error("Écriture de la photo impossible :", err);
    return erreur(
      "Impossible d’enregistrer la photo. Réessayez dans un instant ; si cela persiste, prévenez-nous.",
      500
    );
  }

  revalidatePath("/", "layout");

  const apres = await etatPhoto(slot);
  return NextResponse.json({ ok: true, ...apres, poids: sortie.length });
}

/**
 * Annulation.
 *
 * Deux situations, un seul geste du côté du restaurant. Si l'emplacement
 * avait une photo avant, on la remet. S'il était vide — un bac jamais
 * photographié — il n'y a rien à remettre : on retire la photo, et la case
 * redevient l'aplat de couleur qu'elle était.
 */
export async function DELETE(request: Request) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  const slot = new URL(request.url).searchParams.get("emplacement") ?? "";
  if (!emplacement(slot)) return erreur("Cet emplacement n’existe pas.");

  const original = cleOriginal(slot);
  const contenu = await lireEnregistre(original);

  try {
    if (contenu) {
      await ecrire(clephoto(slot), contenu, "image/jpeg");
      // La sauvegarde est consommée : la photo d'origine est de nouveau
      // celle en place, il n'y a plus rien à restaurer.
      await supprimer(original);
    } else {
      const existe = (await lire(clephoto(slot))) !== null;
      if (!existe) return erreur("Il n’y a pas de photo à retirer.");
      await supprimer(clephoto(slot));
    }
  } catch (err) {
    console.error("Annulation impossible :", err);
    return erreur("Impossible d’annuler la modification.", 500);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, ...(await etatPhoto(slot)) });
}

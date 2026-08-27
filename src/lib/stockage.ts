import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Le magasin : tout ce que le site écrit après son déploiement.
 *
 * Deux implémentations derrière une seule interface.
 *
 *  — **En local**, on écrit dans les fichiers du projet. C'est lisible, ça se
 *    sauvegarde en copiant un dossier, et `content/ardoise.json` reste
 *    modifiable à la main dans un éditeur.
 *
 *  — **En ligne sur Vercel**, le système de fichiers est en lecture seule :
 *    une ardoise enregistrée à 11 h disparaîtrait au déploiement suivant, et
 *    le back-office renvoyait d'ailleurs une erreur. On écrit donc dans
 *    Vercel Blob, un stockage d'objets accessible à l'exécution.
 *
 * Le choix se fait tout seul selon les variables d'environnement posées par
 * Vercel quand un store Blob est connecté au projet. Rien à configurer en
 * local, rien à configurer en ligne.
 *
 * ⚠️ Règle de lecture : le magasin n'est qu'une **surcouche**. Ce qui n'y a
 * jamais été écrit est lu dans les fichiers livrés avec le site. Un premier
 * déploiement affiche donc l'ardoise et les photos du dépôt ; le magasin ne
 * prend le pas qu'à partir du premier enregistrement.
 */

export const blobActif = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
);

/** Où les fichiers livrés avec le site sont lus, en dernier recours. */
const racineDepot = (cle: string) => path.resolve(process.cwd(), cle);

/* ------------------------------------------------------------------ */
/*  Implémentation disque                                              */
/* ------------------------------------------------------------------ */

async function disqueLire(cle: string): Promise<Buffer | null> {
  return fs.readFile(racineDepot(cle)).catch(() => null);
}

async function disqueEcrire(cle: string, contenu: Buffer) {
  const chemin = racineDepot(cle);
  await fs.mkdir(path.dirname(chemin), { recursive: true });
  // Écriture en deux temps : personne ne doit lire un fichier à moitié écrit.
  const provisoire = `${chemin}.${Date.now()}.tmp`;
  await fs.writeFile(provisoire, contenu);
  await fs.rename(provisoire, chemin);
}

async function disqueSupprimer(cle: string) {
  await fs.unlink(racineDepot(cle)).catch(() => {});
}

async function disqueLister(prefixe: string): Promise<string[]> {
  const dossier = racineDepot(prefixe);
  const noms = await fs.readdir(dossier).catch(() => [] as string[]);
  return noms.map((n) => `${prefixe.replace(/\/$/, "")}/${n}`);
}

/* ------------------------------------------------------------------ */
/*  Implémentation Vercel Blob                                         */
/* ------------------------------------------------------------------ */

/**
 * Le SDK est chargé à la demande : en local il n'est jamais évalué, et son
 * absence de configuration ne peut donc pas faire tomber le site.
 */
const sdk = () => import("@vercel/blob");

/**
 * Le store est **privé** : ses URL ne sont pas publiques, et le contenu se
 * récupère par `get()`, authentifié. C'est ce qui convient ici — les photos
 * sont servies par `/api/media`, jamais par une URL de stockage exposée.
 */
const ACCES = "private" as const;

async function blobLire(cle: string): Promise<Buffer | null> {
  const { get } = await sdk();
  try {
    // `useCache: false` : après un enregistrement, le back-office doit relire
    // ce qu'il vient d'écrire, pas une version encore en cache.
    const res = await get(cle, { access: ACCES, useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function blobEcrire(cle: string, contenu: Buffer, type?: string) {
  const { put } = await sdk();
  await put(cle, contenu, {
    access: ACCES,
    allowOverwrite: true,
    contentType: type,
    // Le nom de l'objet est notre clé, pas un nom généré : c'est lui qui
    // permet de relire la bonne photo au rendu suivant.
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });
}

async function blobSupprimer(cle: string) {
  const { del, head } = await sdk();
  try {
    const meta = await head(cle);
    await del(meta.url);
  } catch {
    /* déjà absent : rien à faire */
  }
}

async function blobLister(prefixe: string): Promise<string[]> {
  const { list } = await sdk();
  try {
    const { blobs } = await list({ prefix: prefixe, limit: 1000 });
    return blobs.map((b) => b.pathname);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Interface publique                                                 */
/* ------------------------------------------------------------------ */

/** Le contenu enregistré après déploiement, ou `null` s'il n'y en a pas. */
export async function lireEnregistre(cle: string): Promise<Buffer | null> {
  return blobActif ? blobLire(cle) : disqueLire(cle);
}

/**
 * Le contenu à servir : ce qui a été enregistré, sinon le fichier livré
 * avec le site.
 */
export async function lire(cle: string): Promise<Buffer | null> {
  return (await lireEnregistre(cle)) ?? (blobActif ? disqueLire(cle) : null);
}

export async function ecrire(cle: string, contenu: Buffer, type?: string) {
  return blobActif ? blobEcrire(cle, contenu, type) : disqueEcrire(cle, contenu);
}

export async function supprimer(cle: string) {
  return blobActif ? blobSupprimer(cle) : disqueSupprimer(cle);
}

export type Meta = { cle: string; taille: number; modifieLe: number };

/**
 * Les métadonnées des clés enregistrées sous un préfixe, en un seul appel.
 *
 * Indispensable pour l'écran Photos : lire les 57 fichiers pour savoir
 * lesquels existent coûterait 57 téléchargements. Blob les donne d'un coup,
 * le disque par un `stat` par entrée.
 */
export async function metaEnregistrees(prefixe: string): Promise<Map<string, Meta>> {
  const carte = new Map<string, Meta>();

  if (blobActif) {
    const { list } = await sdk();
    let curseur: string | undefined;
    do {
      const page = await list({ prefix: prefixe, limit: 1000, cursor: curseur }).catch(
        () => null
      );
      if (!page) break;
      for (const b of page.blobs) {
        carte.set(b.pathname, {
          cle: b.pathname,
          taille: b.size,
          modifieLe: new Date(b.uploadedAt).getTime(),
        });
      }
      curseur = page.hasMore ? page.cursor : undefined;
    } while (curseur);
    return carte;
  }

  const parcourir = async (dossier: string) => {
    const entrees = await fs
      .readdir(racineDepot(dossier), { withFileTypes: true })
      .catch(() => []);
    for (const e of entrees) {
      const cle = `${dossier.replace(/\/$/, "")}/${e.name}`;
      if (e.isDirectory()) await parcourir(cle);
      else {
        const st = await fs.stat(racineDepot(cle)).catch(() => null);
        if (st) carte.set(cle, { cle, taille: st.size, modifieLe: Math.round(st.mtimeMs) });
      }
    }
  };
  await parcourir(prefixe);
  return carte;
}

/** Métadonnées d'une seule clé, en incluant le fichier livré avec le site. */
export async function meta(cle: string): Promise<Meta | null> {
  if (blobActif) {
    const { head } = await sdk();
    try {
      const h = await head(cle);
      return { cle, taille: h.size, modifieLe: new Date(h.uploadedAt).getTime() };
    } catch {
      /* pas enregistré : on retombe sur le fichier du dépôt */
    }
  }
  const st = await fs.stat(racineDepot(cle)).catch(() => null);
  return st ? { cle, taille: st.size, modifieLe: Math.round(st.mtimeMs) } : null;
}

/** Les clés enregistrées sous un préfixe. Ne liste pas les fichiers du dépôt. */
export async function listerEnregistre(prefixe: string): Promise<string[]> {
  return blobActif ? blobLister(prefixe) : disqueLister(prefixe);
}

/* --- Confort : texte et JSON --------------------------------------- */

export async function lireTexte(cle: string): Promise<string | null> {
  return (await lire(cle))?.toString("utf8") ?? null;
}

export async function ecrireTexte(cle: string, contenu: string) {
  return ecrire(cle, Buffer.from(contenu, "utf8"), "application/json");
}

/** Existe-t-il une version enregistrée de cette clé ? */
export async function existeEnregistre(cle: string): Promise<boolean> {
  return (await lireEnregistre(cle)) !== null;
}

/**
 * Le magasin accepte-t-il vraiment une écriture ?
 *
 * Question sans réponse théorique : selon l'hébergement, ça marche ou non.
 * On fait donc un aller-retour réel sur une clé jetable. C'est ce qui permet
 * de prévenir le restaurant avant qu'il ne perde une ardoise.
 */
export async function peutEcrire(): Promise<boolean> {
  const cle = `data/diagnostic/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const temoin = Buffer.from(new Date().toISOString());
  try {
    await ecrire(cle, temoin, "application/json");
    const relu = await lireEnregistre(cle);
    await supprimer(cle);
    return relu !== null && relu.equals(temoin);
  } catch {
    return false;
  }
}

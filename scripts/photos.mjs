/**
 * Pipeline photo.
 *
 *   npm run photos            -> télécharge ce qui manque + régénère les flous
 *   npm run photos -- --force -> retélécharge tout
 *
 * Deux familles de visuels :
 *
 *  1. Les emplacements fixes du site (hero, salades, boissons, desserts, salle).
 *     Manifeste : content/photos.json → public/img/<slot>.jpg
 *
 *  2. Les plats chauds. Les 151 photos déjà présentes sur l'ancien site sont
 *     rapatriées ; les autres reçoivent une photo de remplacement ou, à défaut,
 *     le visuel de repli de leur famille.
 *     public/img/plats/<slug>.jpg — le slug figure dans content/repertoire-plats.json
 *
 * Remplacer une photo par une vraie photo du restaurant :
 *   · emplacement fixe → déposer public/img/<slot>.jpg puis retirer "source"
 *   · plat            → déposer public/img/plats/<slug>.jpg
 * Le script ne touche jamais à un fichier déjà présent (sauf --force).
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG = path.join(ROOT, "public", "img");
const IMG_PLATS = path.join(IMG, "plats");
const BLUR_OUT = path.join(ROOT, "src", "lib", "blur.generated.json");
const BLUR_PLATS_OUT = path.join(ROOT, "src", "lib", "plat-photos.generated.json");
const IMG_ING = path.join(IMG, "ingredients");
const BLUR_ING_OUT = path.join(ROOT, "src", "lib", "ingredient-photos.generated.json");

const force = process.argv.includes("--force");
const exists = (p) => fs.access(p).then(() => true, () => false);

const manifest = JSON.parse(
  await fs.readFile(path.join(ROOT, "content", "photos.json"), "utf8")
);
const repertoire = JSON.parse(
  await fs.readFile(path.join(ROOT, "content", "repertoire-plats.json"), "utf8")
);

await fs.mkdir(IMG, { recursive: true });
await fs.mkdir(IMG_PLATS, { recursive: true });
await fs.mkdir(IMG_ING, { recursive: true });

/** L'ancien site refuse les requêtes sans en-têtes de navigateur. */
const ENTETES_REVELANT = {
  Referer: "https://revelant-restaurant.fr/recette",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
};

async function telecharger(url, sortie, largeur, entetes) {
  const res = await fetch(url, entetes ? { headers: entetes } : undefined);
  if (!res.ok) return { ok: false, statut: res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .resize({ width: largeur, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(sortie);
  return { ok: true };
}

const unsplash = (id, w) => `https://images.unsplash.com/${id}?w=${w}&q=80&fm=jpg&fit=max`;

/* ------------------------------------------------------------------ */
/*  1. Emplacements fixes                                              */
/* ------------------------------------------------------------------ */

const blur = {};
let nouveaux = 0;

for (const { slot, source } of manifest.slots) {
  const fichier = path.join(IMG, `${slot}.jpg`);

  if ((force || !(await exists(fichier))) && source) {
    const r = await telecharger(unsplash(source, 2000), fichier, 2000);
    if (!r.ok) {
      console.warn(`✗ ${slot} — HTTP ${r.statut}`);
      continue;
    }
    console.log(`↓ ${slot}`);
    nouveaux++;
  }

  if (!(await exists(fichier))) {
    console.warn(`· ${slot} — aucun fichier`);
    continue;
  }

  const tiny = await sharp(fichier).resize(20).webp({ quality: 45 }).toBuffer();
  blur[slot] = `data:image/webp;base64,${tiny.toString("base64")}`;
}

await fs.mkdir(path.dirname(BLUR_OUT), { recursive: true });
await fs.writeFile(BLUR_OUT, JSON.stringify(blur, null, 2) + "\n");

/* ------------------------------------------------------------------ */
/*  2. Plats chauds                                                    */
/* ------------------------------------------------------------------ */

const { remplacements = {}, familles = {} } = manifest.plats ?? {};

/** Où aller chercher la photo d'un plat, par ordre de priorité. */
function sourcePlat(plat) {
  if (remplacements[plat.slug]) {
    return { type: "unsplash", ref: remplacements[plat.slug] };
  }
  if (plat.sourcePhoto) {
    return {
      type: "revelant",
      ref: `https://revelant-restaurant.fr/storage/app/public/img/${plat.sourcePhoto}`,
    };
  }
  if (familles[plat.famille]) {
    return { type: "famille", ref: familles[plat.famille] };
  }
  return null;
}

const file = [...repertoire];
const blurPlats = {};
let repris = 0;
let echecs = 0;

// Six téléchargements en parallèle : assez rapide sans matraquer leur serveur.
async function ouvrier() {
  while (file.length) {
    const plat = file.shift();
    const fichier = path.join(IMG_PLATS, `${plat.slug}.jpg`);

    if (force || !(await exists(fichier))) {
      const src = sourcePlat(plat);
      if (src) {
        const r =
          src.type === "revelant"
            ? await telecharger(src.ref, fichier, 900, ENTETES_REVELANT)
            : await telecharger(unsplash(src.ref, 900), fichier, 900);
        if (r.ok) repris++;
        else echecs++;
      }
    }

    if (await exists(fichier)) {
      const tiny = await sharp(fichier).resize(20).webp({ quality: 45 }).toBuffer();
      blurPlats[plat.slug] = `data:image/webp;base64,${tiny.toString("base64")}`;
    }
  }
}

await Promise.all(Array.from({ length: 6 }, ouvrier));
await fs.writeFile(BLUR_PLATS_OUT, JSON.stringify(blurPlats, null, 1) + "\n");

/* ------------------------------------------------------------------ */
/*  3. Vignettes du bar à salade                                       */
/* ------------------------------------------------------------------ */

const ingredients = manifest.ingredients ?? {};
const blurIng = {};

// Les slugs viennent du catalogue : on lit le fichier source plutôt que de
// dupliquer la liste, pour qu'un ingrédient ajouté soit pris en compte seul.
const catalog = await fs.readFile(path.join(ROOT, "src", "lib", "catalog.ts"), "utf8");
const bloc = catalog.slice(
  catalog.indexOf("export const builderGroups"),
  catalog.indexOf("export const drinks")
);
// On ne lit que le contenu des tableaux `items: [...]` : les titres et les
// phrases d'aide des groupes ne sont pas des ingrédients.
const noms = [...bloc.matchAll(/items:\s*\[([^\]]*)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
);

const slugifier = (nom) =>
  nom
    .replace(/œ/g, "oe").replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae").replace(/Æ/g, "Ae")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

let ingTelecharges = 0;
for (const nom of noms) {
  const slug = slugifier(nom);
  const fichier = path.join(IMG_ING, `${slug}.jpg`);

  if ((force || !(await exists(fichier))) && ingredients[slug]) {
    const r = await telecharger(unsplash(ingredients[slug], 700), fichier, 700);
    if (r.ok) ingTelecharges++;
    else console.warn(`✗ ingrédient ${slug} — HTTP ${r.statut}`);
  }

  if (await exists(fichier)) {
    const tiny = await sharp(fichier).resize(20).webp({ quality: 45 }).toBuffer();
    blurIng[slug] = `data:image/webp;base64,${tiny.toString("base64")}`;
  }
}

await fs.writeFile(BLUR_ING_OUT, JSON.stringify(blurIng, null, 1) + "\n");

const manquants = noms.filter((n) => !blurIng[slugifier(n)]);

console.log(
  `\n✓ ${Object.keys(blur).length} emplacements fixes${nouveaux ? ` (${nouveaux} téléchargés)` : ""}` +
    `\n✓ ${Object.keys(blurPlats).length}/${repertoire.length} plats illustrés` +
    (repris ? ` (${repris} téléchargés)` : "") +
    (echecs ? ` — ${echecs} en échec` : "") +
    `\n✓ ${Object.keys(blurIng).length}/${noms.length} ingrédients illustrés` +
    (ingTelecharges ? ` (${ingTelecharges} téléchargés)` : "")
);

if (manquants.length) {
  console.log(
    `\n  ${manquants.length} ingrédients sans photo — ils s'affichent en pastille de couleur :\n` +
      manquants.map((n) => `   · ${slugifier(n).padEnd(28)} ${n}`).join("\n") +
      `\n\n  Pour les compléter : déposez public/img/ingredients/<slug>.jpg\n`
  );
}

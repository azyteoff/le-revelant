/**
 * Vérifie l'ardoise du jour et signale les erreurs en français clair.
 *
 *   npm run verifier
 *
 * À lancer après chaque modification de content/ardoise.json. Le script
 * ne modifie rien : il dit ce qui va, ce qui ne va pas, et quoi corriger.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const lire = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));

const normaliser = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function distance(a, b) {
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i, ...Array(a.length).fill(0)]);
  for (let j = 1; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
      );
  return m[b.length][a.length];
}

const ardoise = await lire("content/ardoise.json");
const repertoire = await lire("content/repertoire-plats.json");
const catalog = await fs.readFile(path.join(ROOT, "src/lib/catalog.ts"), "utf8");

const nomsSalades = [...catalog.matchAll(/^\s*name: "([^"]+)",$/gm)]
  .map((m) => m[1])
  .filter((n) => catalog.indexOf(`name: "${n}"`) < catalog.indexOf("export const drinks"));

const erreurs = [];
const avertissements = [];
const ok = [];

/* --- Les plats du jour ------------------------------------------------ */

const plats = ardoise.plats ?? [];
if (plats.length === 0) {
  avertissements.push("Aucun plat du jour n’est saisi : la section « Plats chauds » sera masquée.");
} else if (plats.length !== 4) {
  avertissements.push(
    `Vous avez saisi ${plats.length} plat${plats.length > 1 ? "s" : ""} au lieu de 4. Le site s’adapte, mais la grille est prévue pour quatre.`
  );
}

for (const nom of plats) {
  const cible = normaliser(nom);
  const trouve = repertoire.find((p) => normaliser(p.nom) === cible);
  if (trouve) {
    ok.push(`« ${trouve.nom} » — ${trouve.famille}`);
    continue;
  }
  let proche = null;
  let meilleur = Infinity;
  for (const p of repertoire) {
    const d = distance(cible, normaliser(p.nom));
    if (d < meilleur) {
      meilleur = d;
      proche = p;
    }
  }
  erreurs.push(
    `« ${nom} » ne figure pas au répertoire.` +
      (proche && meilleur <= Math.max(3, cible.length / 3)
        ? `\n     Vouliez-vous dire « ${proche.nom} » ?`
        : "\n     Vérifiez l’orthographe dans content/repertoire-plats.json.")
  );
}

/* --- La vente des plats en ligne -------------------------------------- */

const formules = [...catalog.matchAll(/label: "([^"]+)",\s*\n\s*court: "[^"]*",\s*\n\s*price: ([\d.]+)/g)].map(
  (m) => `${m[1]} ${m[2]} €`
);

if (ardoise.platsCommandables === false) {
  avertissements.push(
    "« platsCommandables » est à false : les plats sont affichés avec la mention\n     « à commander au comptoir ». Passez-le à true pour les vendre en ligne."
  );
} else if (ardoise.platsCommandables === true) {
  ok.push(`Plats vendus en ligne : ${formules.join(" · ") || "voir FORMULES dans catalog.ts"}`);
} else {
  erreurs.push(
    `« platsCommandables » doit valoir true ou false, pas « ${ardoise.platsCommandables} ».`
  );
}

/* --- Les salades ------------------------------------------------------ */

const salades = ardoise.salades ?? [];
if (salades.length === 0) {
  ok.push(`Salades : les ${nomsSalades.length} recettes signature sont affichées`);
} else {
  for (const nom of salades) {
    if (nomsSalades.some((n) => normaliser(n) === normaliser(nom))) {
      ok.push(`Salade « ${nom} »`);
    } else {
      erreurs.push(
        `La salade « ${nom} » n’existe pas.\n     Salades disponibles : ${nomsSalades.join(", ")}.`
      );
    }
  }
}

/* --- Les photos ------------------------------------------------------- */

for (const nom of plats) {
  const p = repertoire.find((x) => normaliser(x.nom) === normaliser(nom));
  if (!p) continue;
  const fichier = path.join(ROOT, "public", "img", "plats", `${p.slug}.jpg`);
  const existe = await fs.access(fichier).then(() => true, () => false);
  if (!existe) {
    avertissements.push(
      `Pas de photo pour « ${p.nom} ».\n     Lancez « npm run photos », ou déposez public/img/plats/${p.slug}.jpg`
    );
  }
}

/* --- Rapport ---------------------------------------------------------- */

console.log("\n  L’ARDOISE DU JOUR\n  " + "─".repeat(46));

for (const m of ok) console.log(`  ✓ ${m}`);
if (avertissements.length) {
  console.log("");
  for (const m of avertissements) console.log(`  ! ${m}`);
}
if (erreurs.length) {
  console.log("");
  for (const m of erreurs) console.log(`  ✗ ${m}`);
}

console.log("");
if (erreurs.length) {
  console.log(
    `  ${erreurs.length} erreur${erreurs.length > 1 ? "s" : ""} à corriger dans content/ardoise.json.\n`
  );
  process.exit(1);
}
console.log("  Tout est bon. Le site peut être publié.\n");

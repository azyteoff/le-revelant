/**
 * Test de bout en bout du tunnel de commande.
 *   BASE=http://localhost:3100 node scripts/e2e.mjs
 *
 * Couvre en particulier la régression que la refonte doit corriger :
 * composer une salade, se connecter, et retrouver son panier intact.
 */
import { chromium, devices } from "playwright";
import fs from "node:fs/promises";
import fss from "node:fs";

/** L'ardoise réellement en place : les tests suivent le service du jour. */
const ardoise = JSON.parse(await fs.readFile("content/ardoise.json", "utf8"));
const platDuJour = ardoise.plats[0];
const repertoire = JSON.parse(await fs.readFile("content/repertoire-plats.json", "utf8"));
const fiche = (repertoire.plats ?? repertoire).find((p) => p.nom === platDuJour);
const baseDuJour = (ardoise.bases ?? [])[0];
const garnitureDuJour = (ardoise.garnitures ?? [])[0];

const BASE = process.env.BASE ?? "http://localhost:3000";
const results = [];
const check = (label, ok, extra = "") => {
  results.push({ label, ok, extra });
  console.log(`${ok ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch();

/* ------------------------------------------------------------------ */
/*  Parcours desktop : survol → ajout → composeur → connexion → paiement */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  // Survol : la composition n'apparaît qu'à l'intention.
  const card = page.locator("article", { hasText: "La Gourmande" }).first();
  await card.scrollIntoViewIfNeeded();
  // La composition est présente dans le HTML (les moteurs la voient) mais
  // n’est ni visible ni atteignable tant qu’on ne la demande pas.
  const addBtn = card.getByRole("button", { name: /Ajouter La Gourmande Petite/i });
  check("Au repos, la composition est masquée", !(await addBtn.isVisible()));
  await card.hover();
  await page.waitForTimeout(600);
  check("Au survol, le bouton Ajouter apparaît", await addBtn.isVisible());

  await addBtn.click();
  await page.waitForTimeout(400);
  const badge = page.locator("header").getByText("1", { exact: true });
  check("Le badge panier passe à 1", await badge.isVisible());

  // Les plats chauds du jour, au même rang que les salades
  const platCard = page.locator("article", { hasText: platDuJour }).first();
  await platCard.scrollIntoViewIfNeeded();
  check("Les plats du jour sont sur l’accueil", await platCard.isVisible(), platDuJour);
  await platCard.hover();
  await page.waitForTimeout(600);
  // On cherche un mot pris dans la description du plat effectivement à
  // l'ardoise, jamais un mot choisi d'avance.
  const motDeLaDescription = (fiche?.description ?? "").split(/[\s,.]+/).find((m) => m.length > 6);
  check(
    "La description du plat apparaît au survol",
    !motDeLaDescription ||
      (await platCard.getByText(motDeLaDescription, { exact: false }).first().isVisible()),
    motDeLaDescription ?? "(pas de description)"
  );

  // Composeur — plusieurs protéines
  await page.goto(`${BASE}/composer`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quinoa", exact: true }).click();
  await page.getByRole("button", { name: "Concombre", exact: true }).click();
  await page.getByRole("button", { name: "Tofu miel sésame", exact: true }).click();
  await page.getByRole("button", { name: "Œufs durs", exact: true }).click();
  await page.getByRole("button", { name: "Ceviche", exact: true }).click();
  await page.getByRole("button", { name: "Guacamole", exact: true }).click();
  await page.waitForTimeout(300);
  check(
    "★ Plusieurs protéines sélectionnables simultanément",
    (await page.getByRole("button", { name: "Tofu miel sésame", exact: true }).getAttribute("aria-pressed")) === "true" &&
      (await page.getByRole("button", { name: "Œufs durs", exact: true }).getAttribute("aria-pressed")) === "true" &&
      (await page.getByRole("button", { name: "Ceviche", exact: true }).getAttribute("aria-pressed")) === "true"
  );
  check(
    "La base reste un choix unique",
    await (async () => {
      await page.getByRole("button", { name: "Pâtes", exact: true }).click();
      await page.waitForTimeout(200);
      const quinoa = await page
        .getByRole("button", { name: "Quinoa", exact: true })
        .getAttribute("aria-pressed");
      await page.getByRole("button", { name: "Quinoa", exact: true }).click();
      return quinoa === "false";
    })()
  );

  await page.getByRole("button", { name: /^Ajouter — /i }).click();
  await page.waitForTimeout(500);
  check("Salade composée ajoutée", await page.getByText("Ajouté au panier").isVisible());

  // Persistance au rechargement
  await page.reload({ waitUntil: "networkidle" });
  const count = await page.evaluate(
    () => JSON.parse(localStorage.getItem("revelant.cart.v1")).state.lines.length
  );
  check("Le panier survit à un rechargement", count === 2, `${count} lignes`);

  // Tunnel de commande + connexion en cours de route
  await page.goto(`${BASE}/commander`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /déjà un compte/ }).click();
  const panel = page.locator(".expander");
  await panel.getByPlaceholder("Prénom").fill("Arthur");
  await panel.getByPlaceholder("E-mail").fill("arthur@example.com");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForTimeout(600);

  const afterLogin = await page.evaluate(
    () => JSON.parse(localStorage.getItem("revelant.cart.v1")).state.lines.length
  );
  check(
    "★ Le panier survit à la connexion (bug du site actuel)",
    afterLogin === 2,
    `${afterLogin} lignes`
  );
  check(
    "Les coordonnées sont pré-remplies après connexion",
    (await page.locator('input[name="firstName"]').inputValue()) === "Arthur"
  );

  await page.locator('input[name="phone"]').fill("06 21 96 88 98");
  await page.getByRole("button", { name: /^Payer / }).last().click();
  await page.waitForURL(/\/commander\/confirmation/, { timeout: 15000 });

  const ref = await page.locator("p", { hasText: /^LR-/ }).first().innerText();
  check("Redirection vers la confirmation avec référence", /^LR-[A-Z0-9]{5}$/.test(ref), ref);

  const cleared = await page.evaluate(
    () => JSON.parse(localStorage.getItem("revelant.cart.v1")).state.lines.length
  );
  check("Le panier est vidé après commande", cleared === 0);

  check("Aucune erreur console sur le parcours", errors.length === 0, errors[0] ?? "");
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/*  Parcours mobile : barre fixe, menu, ajout au toucher                */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const bar = page.getByRole("link", { name: "Commander", exact: true }).last();
  check("Barre de commande fixe visible sur mobile", await bar.isVisible());
  check(
    "Bouton d’appel direct présent",
    await page.getByRole("link", { name: /Appeler Le Révélant/ }).isVisible()
  );

  // Menu plein écran
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.waitForTimeout(400);
  check(
    "Menu mobile ouvert",
    await page.getByRole("link", { name: "Mon panier" }).first().isVisible()
  );
  await page.getByRole("button", { name: "Fermer le menu" }).click();
  await page.waitForTimeout(400);

  // Ajout au toucher : premier appui = composition, second = ajout
  await page.goto(`${BASE}/la-carte`, { waitUntil: "networkidle" });
  const card = page.locator("article", { hasText: "Poulet pesto" }).first();
  await card.scrollIntoViewIfNeeded();
  await card.getByRole("button", { name: /Voir la composition/ }).click();
  await page.waitForTimeout(500);
  const grande = card.getByRole("button", { name: /Ajouter Poulet pesto Grande/i });
  check("Appui tactile : la composition se révèle", await grande.isVisible());
  await grande.click();
  await page.waitForTimeout(500);

  const mobileCount = await page.evaluate(
    () => JSON.parse(localStorage.getItem("revelant.cart.v1")).state.lines.length
  );
  check("Ajout au panier depuis mobile", mobileCount === 1);

  await ctx.close();
}

/* ------------------------------------------------------------------ */
/*  Sécurité : les prix envoyés par le client sont ignorés              */
/* ------------------------------------------------------------------ */
{
  const res = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { firstName: "Test", email: "t@example.com", phone: "0621968898" },
      pickup: "12h30",
      lines: [{ kind: "salade", name: "La Gourmande · Grande", size: "grande", qty: 1, unitPrice: 0 }],
    }),
  });
  const data = await res.json();
  check("Le serveur retarifie la commande", res.ok && data.total >= 10.8, `total = ${data.total} €`);

  const bad = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { firstName: "Test", email: "t@example.com", phone: "0621968898" },
      lines: [{ kind: "composee", name: "Salade composée", size: "petite", qty: 1, detail: ["Caviar"] }],
    }),
  });
  check("Un ingrédient inexistant est refusé", bad.status === 400);

  // Les deux formules de plat sont facturées à leur tarif propre.
  const client = { firstName: "Test", email: "t@example.com", phone: "0621968898" };

  for (const [formule, attendu] of [["plat", 11], ["complet", 13]]) {
    const res = await fetch(`${BASE}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: client,
        pickup: "12h30",
        lines: [{ kind: "plat", name: platDuJour, formule, qty: 1, unitPrice: 0 }],
      }),
    });
    const data = await res.json();
    // La remise précommande peut s'appliquer selon l'heure : on compare au brut.
    const brut = Math.round((data.total + (data.discount ?? 0)) * 100) / 100;
    check(
      `Formule « ${formule} » facturée ${attendu} €`,
      res.ok && Math.abs(brut - attendu) < 0.01,
      `brut = ${brut} €`
    );
  }

  const sansFormule = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: client,
      lines: [{ kind: "plat", name: platDuJour, qty: 1 }],
    }),
  });
  check("Un plat sans formule est refusé", sansFormule.status === 400);

  const horsArdoise = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: client,
      lines: [{ kind: "plat", name: "Coq au vin", formule: "plat", qty: 1 }],
    }),
  });
  check("Un plat hors ardoise est refusé", horsArdoise.status === 400);

  // La remise de la veille : commander pour demain y donne droit à toute heure.
  const demain = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: client,
      pickup: "12h30",
      retrait: "demain",
      lines: [{ kind: "salade", name: "La Gourmande · Grande", size: "grande", qty: 1 }],
    }),
  });
  const dData = await demain.json();
  check(
    "★ Commander pour demain donne −10 %",
    demain.ok && Math.abs(dData.discount - 1.2) < 0.01,
    `remise = ${dData.discount} €`
  );

  // La majoration des salades composées s'applique côté serveur.
  const composee = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: client,
      pickup: "12h30",
      lines: [
        {
          kind: "composee",
          name: "Salade composée · Petite",
          size: "petite",
          detail: ["Quinoa", "Concombre"],
          qty: 1,
          unitPrice: 0,
        },
      ],
    }),
  });
  const cData = await composee.json();
  const brutComposee = Math.round((cData.total + (cData.discount ?? 0)) * 100) / 100;
  // Le seuil est 11h48, pas midi : on compare en minutes.
  const [hh, mm] = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .split(":")
    .map(Number);
  const attenduComposee = hh * 60 + mm >= 11 * 60 + 48 ? 12 : 10;
  check(
    "Majoration des salades composées appliquée par le serveur",
    composee.ok && Math.abs(brutComposee - attenduComposee) < 0.01,
    `${brutComposee} € attendu ${attenduComposee} €`
  );
}

/* ------------------------------------------------------------------ */
/*  Le répertoire des 208 recettes                                      */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/plats-du-jour`, { waitUntil: "networkidle" });

  const total = await page.locator("ul li h3").count();
  check("Les 208 recettes sont dans la page", total === 208, `${total} recettes`);

  await page.getByPlaceholder(/Chercher/).fill("vanille");
  await page.waitForTimeout(400);
  const apres = await page.locator("ul li h3").count();
  check("La recherche filtre le répertoire", apres > 0 && apres < 20, `${apres} résultats`);

  await page.getByPlaceholder(/Chercher/).fill("");
  await page.getByRole("button", { name: /^Végétarien · / }).click();
  await page.waitForTimeout(400);
  const veg = await page.locator("ul li h3").count();
  check("Le filtre par famille fonctionne", veg === 16, `${veg} recettes végétariennes`);

  await ctx.close();
}

/* ------------------------------------------------------------------ */
/*  Composeur visuel                                                   */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/composer`, { waitUntil: "networkidle" });

  const vignettes = await page.locator("button[aria-pressed]").count();
  check("Le composeur affiche une vignette par ingrédient", vignettes >= 31, `${vignettes} vignettes`);

  // next/image réécrit la source en /_next/image?url=%2Fimg%2Fingredients%2F…
  const photos = await page.locator('img[src*="ingredients"]').count();
  check("Des photos d’ingrédients sont servies", photos > 0, `${photos} photos`);

  const radis = page.getByRole("button", { name: "Radis", exact: true });
  await radis.click();
  await page.waitForTimeout(250);
  check("Une vignette se sélectionne", (await radis.getAttribute("aria-pressed")) === "true");
  await radis.click();
  await page.waitForTimeout(250);
  check("Une vignette se désélectionne", (await radis.getAttribute("aria-pressed")) === "false");

  /* ---------------------------------------------------------------- */
  /*  Composer un plat chaud                                           */
  /* ---------------------------------------------------------------- */

  if (baseDuJour) {
    await page.getByRole("tab", { name: /Un plat chaud/ }).click();
    await page.waitForTimeout(500);
    check(
      "★ L’onglet « Un plat chaud » ouvre le composeur de plat",
      await page.getByRole("heading", { name: "La base", exact: true }).isVisible()
    );

    await page.getByRole("button", { name: new RegExp(platDuJour.slice(0, 14)) }).first().click();
    await page.getByRole("button", { name: baseDuJour, exact: true }).click();
    await page.waitForTimeout(300);
    const sansGarniture = await page.getByRole("button", { name: /^Ajouter — / }).first().innerText();
    check(
      "★ Plat + base sans garniture : 11 €",
      sansGarniture.includes("11"),
      sansGarniture.trim()
    );

    if (garnitureDuJour) {
      await page.getByRole("button", { name: new RegExp(garnitureDuJour.slice(0, 12)) }).first().click();
      await page.waitForTimeout(300);
      const avec = await page.getByRole("button", { name: /^Ajouter — / }).first().innerText();
      check("★ Avec garniture : 13 €", avec.includes("13"), avec.trim());
    }

    await page.getByRole("button", { name: /^Ajouter — / }).first().click();
    await page.waitForTimeout(700);
    check(
      "Le plat composé entre au panier",
      await page.locator("header").getByText("1", { exact: true }).isVisible()
    );

    // Retarification : le serveur ne croit pas la formule annoncée.
    const triche = await page.evaluate(
      async ([base, obj, plat]) => {
        const r = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: [{ kind: "plat", name: plat, formule: "plat", detail: obj, qty: 1 }],
            retrait: "aujourdhui",
            slot: "12:15",
            customer: { firstName: "Test", email: "t@example.fr", phone: "0600000000" },
          }),
        });
        return (await r.json()).total;
      },
      [BASE, [baseDuJour, garnitureDuJour].filter(Boolean), platDuJour]
    );
    check(
      "★ Le serveur retarifie le plat composé — formule annoncée ignorée",
      triche === (garnitureDuJour ? 13 : 11),
      `${triche} €`
    );

    const refus = await page.evaluate(
      async (plat) => {
        const r = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: [{ kind: "plat", name: plat, detail: ["Caviar"], qty: 1 }],
            retrait: "aujourdhui",
            slot: "12:15",
            customer: { firstName: "Test", email: "t@example.fr", phone: "0600000000" },
          }),
        });
        return r.status;
      },
      platDuJour
    );
    check("Une base hors ardoise est refusée", refus === 400, `statut ${refus}`);

    await page.getByRole("tab", { name: /Une salade/ }).click();
    await page.waitForTimeout(500);
  }

  // Boissons et desserts, en bas de la page
  check(
    "★ Boissons et desserts sont proposés en bas du composeur",
    await page.getByRole("heading", { name: "Boissons et desserts" }).isVisible()
  );

  /* ---------------------------------------------------------------- */
  /*  Salades enregistrées                                             */
  /* ---------------------------------------------------------------- */

  check(
    "Aucune liste de salades tant qu’on n’a rien enregistré",
    !(await page.getByRole("heading", { name: "Mes salades" }).isVisible())
  );

  await page.getByRole("button", { name: "Quinoa", exact: true }).click();
  await page.getByRole("button", { name: "Tofu miel sésame", exact: true }).click();
  await page.getByRole("button", { name: "Concombre", exact: true }).click();
  await page.waitForTimeout(300);

  const lienEnregistrer = page.getByRole("button", { name: "Enregistrer cette salade" });
  check("L’enregistrement est proposé dès la salade valide", await lienEnregistrer.isVisible());
  await lienEnregistrer.click();
  await page.waitForTimeout(300);

  // Le nom est proposé d'avance : enregistrer ne doit coûter qu'un geste.
  const propose = await page.locator("#nom-salade").inputValue();
  check("Un nom est proposé d’avance", propose.length > 0, propose);

  await page.locator("#nom-salade").fill("Ma verte du lundi");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.waitForTimeout(600);
  check(
    "★ La salade est enregistrée sous son nom",
    await page.getByRole("heading", { name: "Mes salades" }).isVisible()
  );

  // Elle doit survivre au rechargement : c'est tout l'intérêt.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const carte2 = page.locator("li", { hasText: "Ma verte du lundi" }).first();
  check("★ Elle survit au rechargement de la page", await carte2.isVisible());
  check(
    "La composition est rappelée sur la carte",
    (await carte2.innerText()).includes("Tofu miel sésame")
  );

  const avant = Number((await page.locator("header").locator("text=/^[0-9]+$/").first().innerText().catch(() => "0")) || 0);
  await carte2.getByRole("button", { name: /^Ajouter — / }).click();
  await page.waitForTimeout(700);
  const apres = Number((await page.locator("header").locator("text=/^[0-9]+$/").first().innerText().catch(() => "0")) || 0);
  check("★ On la recommande en un clic", apres === avant + 1, `${avant} → ${apres}`);

  // Reprendre une salade doit recharger exactement la sélection.
  await page.getByRole("button", { name: "Modifier" }).first().click();
  await page.waitForTimeout(900);
  check(
    "« Modifier » recharge la sélection dans le composeur",
    (await page.getByRole("button", { name: "Tofu miel sésame", exact: true }).getAttribute("aria-pressed")) === "true" &&
      (await page.getByRole("button", { name: "Quinoa", exact: true }).getAttribute("aria-pressed")) === "true"
  );

  await page.getByTitle("Renommer").first().click();
  const champRenom = page.locator('input[name="nom"]').first();
  await champRenom.fill("Verte du mardi");
  await champRenom.press("Enter");
  await page.waitForTimeout(500);
  check("Une salade se renomme", await page.getByText("Verte du mardi").first().isVisible());

  await page.getByRole("button", { name: /^Supprimer / }).first().click();
  await page.waitForTimeout(500);
  check(
    "La liste disparaît quand la dernière salade est supprimée",
    !(await page.getByRole("heading", { name: "Mes salades" }).isVisible())
  );

  await ctx.close();
}

/* ------------------------------------------------------------------ */
/*  Back-office                                                        */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check("★ /admin redirige vers la connexion sans session", page.url().includes("/admin/connexion"));

  const api = await fetch(`${BASE}/api/admin/ardoise`);
  check("L’API d’administration refuse un accès anonyme", api.status === 401);

  const mauvais = await fetch(`${BASE}/api/admin/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motDePasse: "pas-le-bon" }),
  });
  check("Un mauvais mot de passe est rejeté", mauvais.status === 401);

  const mdp = process.env.ADMIN_PASSWORD;
  if (!mdp) {
    check("ADMIN_PASSWORD fourni au test", false, "exportez ADMIN_PASSWORD avant de lancer");
  } else {
    await page.getByPlaceholder("Mot de passe").fill(mdp);
    await page.getByRole("button", { name: "Entrer" }).click();
    await page.waitForURL(/\/admin$/, { timeout: 15000 });
    await page.waitForTimeout(700);
    check("★ Connexion au back-office", page.url().endsWith("/admin"));
    check(
      "L’ardoise du jour est affichée",
      await page.getByRole("heading", { name: /ardoise du jour/i }).isVisible()
    );

    await page.goto(`${BASE}/admin/commandes`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    check(
      "L’écran commandes s’ouvre",
      await page.getByRole("button", { name: "Actualiser" }).isVisible()
    );

    await page.goto(`${BASE}/admin/photos`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const cases = await page.getByRole("button", { name: /^Remplacer la photo/ }).count();
    check("L’écran photos propose une case par emplacement", cases >= 55, `${cases} cases`);
    check(
      "Le bar à salade y figure",
      await page.getByRole("heading", { name: "Le bar à salade" }).isVisible()
    );
    check(
      "Les photos du lieu y figurent",
      await page.getByRole("heading", { name: "Le restaurant", exact: true }).isVisible()
    );
    check(
      "Les salades signature y figurent",
      await page.getByRole("heading", { name: "Les salades signature" }).isVisible()
    );

    // Téléversement réel : on envoie une image de test sur un emplacement,
    // on vérifie qu'elle est recadrée puis on remet la photo d'origine.
    const carre = 900;
    const png = await page.evaluate(async (c) => {
      const t = document.createElement("canvas");
      t.width = t.height = 1200;
      const g = t.getContext("2d");
      g.fillStyle = "#8a2b12";
      g.fillRect(0, 0, 1200, 1200);
      const blob = await new Promise((r) => t.toBlob(r, "image/png"));
      const buf = new Uint8Array(await blob.arrayBuffer());
      return Array.from(buf);
    }, carre);

    await page.setInputFiles('input[type="file"]', {
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(png),
    });
    await page.waitForTimeout(2500);
    check(
      "★ Une photo envoyée depuis le back-office est mise en ligne",
      await page.getByText(/^En ligne · /).first().isVisible()
    );
    const restaurer = page.getByRole("button", { name: /photo d’origine/ }).first();
    check("Le retour à la photo d’origine est proposé", await restaurer.isVisible());
    await restaurer.click();
    await page.waitForTimeout(1500);
    check(
      "La photo d’origine est rétablie",
      await page.getByText("Photo d’origine rétablie").first().isVisible()
    );

    // Régression : une photo déposée sur un emplacement doit être servie
    // tout de suite. Next dresse la liste des fichiers de `public/` au
    // démarrage ; sans la réécriture de secours, le fichier existait sur le
    // disque mais répondait 404, et la vignette s'affichait cassée.
    //
    // ⚠️ Ce test écrit dans les vraies photos du restaurant. Il note donc
    // l'état de départ et le rétablit systématiquement — une version
    // antérieure laissait son image de test à la place du quinoa.
    const CIBLE = "Quinoa";
    const CHEMIN = "/img/ingredients/quinoa.jpg";
    // La suite tourne en local, sur les vraies photos du restaurant. On
    // prend donc un instantané des deux fichiers concernés et on les
    // rétablit à l'octet près en sortie. Se contenter du bouton « revenir à
    // la photo d'origine » ne suffit pas : il rend la photo d'avant le
    // premier remplacement, pas celle qui était là juste avant le test.
    const F_PHOTO = "public/img/ingredients/quinoa.jpg";
    const F_ORIGINAL = "content/photos-originales/ingredients__quinoa.jpg";
    const instantane = Object.fromEntries(
      [F_PHOTO, F_ORIGINAL].map((f) => [f, fss.existsSync(f) ? fss.readFileSync(f) : null])
    );
    const rendreLesFichiers = () => {
      for (const [f, contenu] of Object.entries(instantane)) {
        if (contenu) fss.writeFileSync(f, contenu);
        else if (fss.existsSync(f)) fss.unlinkSync(f);
      }
    };
    const boutonCible = page.getByRole("button", {
      name: `Remplacer la photo : ${CIBLE}`,
    });
    // Le parent direct du bouton est la carte : `filter({ has })` sur `div`
    // remonterait jusqu'à la grille entière et deviendrait ambigu.
    const carteCible = boutonCible.locator("xpath=..");
    const avaitUnePhoto = !(await boutonCible.getByText("Ajouter une photo").isVisible());

    const champCible = page.locator("input[type=file]").nth(
      await page.getByRole("button", { name: /^Remplacer la photo/ }).evaluateAll(
        (n, cible) => n.findIndex((b) => b.getAttribute("aria-label") === cible),
        `Remplacer la photo : ${CIBLE}`
      )
    );
    await champCible.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(png),
    });
    await page.waitForTimeout(2500);

    const servie = await page.evaluate(
      ([base, chemin]) => fetch(`${base}${chemin}?t=${Date.now()}`).then((r) => r.status),
      [BASE, CHEMIN]
    );
    check(
      "★ Une photo envoyée est servie aussitôt, même nouvelle sur le disque",
      servie === 200,
      `statut ${servie}`
    );

    // Rétablissement : « Revenir à la photo d'origine » si l'emplacement
    // était occupé, « Retirer la photo » s'il était vide.
    const attendu = avaitUnePhoto ? /photo d’origine/ : /Retirer la photo/;
    const rendre = carteCible.getByRole("button", { name: attendu });
    check(
      avaitUnePhoto
        ? "Le retour à la photo d’origine est proposé"
        : "Le retrait est proposé quand il n’y avait pas de photo",
      await rendre.isVisible()
    );
    await rendre.click();
    await page.waitForTimeout(1800);

    const apresRestauration = await page.evaluate(
      ([base, chemin]) => fetch(`${base}${chemin}?t=${Date.now()}`).then((r) => r.status),
      [BASE, CHEMIN]
    );
    check(
      "L’annulation depuis le back-office fonctionne",
      apresRestauration === (avaitUnePhoto ? 200 : 404),
      avaitUnePhoto ? "photo d’origine rétablie" : "emplacement de nouveau vide"
    );

    rendreLesFichiers();
    check(
      "★ La suite rend les photos du restaurant intactes",
      instantane[F_PHOTO] === null ||
        fss.readFileSync(F_PHOTO).equals(instantane[F_PHOTO])
    );
    // Régression : une ardoise modifiée depuis le back-office doit apparaître
    // sur le site public sans reconstruction. Le contraire a été un vrai bug —
    // le fichier était lu au build, jamais à l'exécution.
    const cookie = (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
    const avant = await (
      await fetch(`${BASE}/api/admin/ardoise`, { headers: { cookie } })
    ).json();
    const ecrire = (plats, message) =>
      fetch(`${BASE}/api/admin/ardoise`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          plats,
          bases: avant.bases ?? [],
          garnitures: avant.garnitures ?? [],
          platsCommandables: true,
          salades: avant.salades ?? [],
          message,
        }),
      });

    try {
      await ecrire(["Bœuf bourguignon", "Coq au vin"], "Ardoise de test");
      await page.waitForTimeout(1200);
      await page.goto(`${BASE}/?t=${Date.now()}`, { waitUntil: "networkidle" });
      const accueil = await page.content();
      check(
        "★ Les plats changés dans l’admin apparaissent aussitôt sur l’accueil",
        accueil.includes("Bœuf bourguignon") && accueil.includes("Coq au vin")
      );
      await page.goto(`${BASE}/la-carte?t=${Date.now()}`, { waitUntil: "networkidle" });
      check(
        "★ Le message du jour apparaît aussitôt sur la carte",
        (await page.content()).includes("Ardoise de test")
      );
    } finally {
      // La remise en état ne dépend jamais du succès des vérifications :
      // sinon un échec laisserait le site avec l'ardoise de test.
      await ecrire(avant.plats, avant.message ?? "");
    }
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/?t=${Date.now()}`, { waitUntil: "networkidle" });
    check(
      "L’ardoise d’origine est remise en place",
      (await page.content()).includes(avant.plats[0])
    );
    await page.goto(`${BASE}/admin/photos`, { waitUntil: "networkidle" });

    const refus = await page.evaluate(async (base) => {
      const fd = new FormData();
      fd.set("emplacement", "../../secret");
      fd.set("fichier", new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" }));
      const r = await fetch(base + "/api/admin/photo", { method: "POST", body: fd });
      return r.status;
    }, BASE);
    check("Un emplacement hors liste est refusé", refus === 400, `statut ${refus}`);
  }

  await ctx.close();
}


await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} vérifications passées.`);
process.exit(failed.length ? 1 : 0);

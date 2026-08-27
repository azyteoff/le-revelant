/**
 * Captures de contrôle desktop + mobile.
 *   node scripts/shots.mjs [chemin ...]
 * Sorties dans .shots/ (ignoré par git).
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = path.resolve(import.meta.dirname, "..", ".shots");
const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/la-carte", "/composer", "/commander", "/le-restaurant"];

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const viewports = [
  { name: "desktop", width: 1440, height: 900, dsf: 2 },
  { name: "mobile", width: 390, height: 844, dsf: 3, mobile: true },
];

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: !!vp.mobile,
    hasTouch: !!vp.mobile,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  });
  const page = await ctx.newPage();

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });

    // Parcourt la page écran par écran : les révélations au scroll se jouent,
    // les images paresseuses se chargent, et chaque capture correspond à ce
    // qu’un visiteur voit réellement.
    const slug = route === "/" ? "home" : route.replace(/\//g, "-").slice(1);
    const height = await page.evaluate(() => document.body.scrollHeight);
    const screens = Math.min(Math.ceil(height / vp.height), 14);

    for (let i = 0; i < screens; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * vp.height);
      await page.waitForTimeout(650);
      await page.screenshot({
        path: path.join(OUT, `${vp.name}-${slug}-${String(i).padStart(2, "0")}.png`),
      });
    }
    console.log(`✓ ${vp.name}/${slug} — ${screens} écrans`);
  }

  if (errors.length) {
    console.log(`\n⚠ ${vp.name} — erreurs console :`);
    for (const e of [...new Set(errors)]) console.log("  " + e.slice(0, 200));
  }
  await ctx.close();
}

await browser.close();

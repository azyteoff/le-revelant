/**
 * Web Vitals réellement observés, sur mobile de milieu de gamme émulé
 * (Pixel 7, CPU ×4 plus lent, 1,6 Mb/s, 150 ms de latence).
 *
 *   BASE=http://localhost:3100 node scripts/vitals.mjs
 *
 * Complète Lighthouse, dont le score mobile repose sur une simulation
 * (Lantern) nettement plus pessimiste que la mesure directe.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTES = ["/", "/la-carte", "/composer", "/le-restaurant", "/salade-paris-17"];
const RUNS = 3;

const browser = await chromium.launch();
const rows = [];

for (const route of ROUTES) {
  const runs = [];

  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "fr-FR" });

    await ctx.addInitScript(() => {
      window.__lcp = 0;
      window.__el = "";
      window.__cls = 0;
      new PerformanceObserver((list) => {
        const e = list.getEntries().pop();
        window.__lcp = e.startTime;
        window.__el = (e.element?.tagName ?? "?") + (e.url ? " (image)" : " (texte)");
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });

    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });

    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForTimeout(3500);

    runs.push(
      await page.evaluate(() => ({
        fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0),
        lcp: Math.round(window.__lcp),
        cls: +window.__cls.toFixed(3),
        el: window.__el,
      }))
    );
    await ctx.close();
  }

  const median = (key) => runs.map((r) => r[key]).sort((a, b) => a - b)[Math.floor(RUNS / 2)];
  rows.push({ route, fcp: median("fcp"), lcp: median("lcp"), cls: runs[0].cls, el: runs[0].el });
}

await browser.close();

console.log("\nWeb Vitals observés — Pixel 7 émulé, CPU ×4, 1,6 Mb/s\n");
console.log("route            FCP      LCP      CLS    élément LCP");
for (const r of rows) {
  const verdict = r.lcp <= 2500 ? "✓" : r.lcp <= 4000 ? "~" : "✗";
  console.log(
    `${verdict} ${r.route.padEnd(16)}${String(r.fcp).padStart(4)}ms ${String(r.lcp).padStart(6)}ms ${String(r.cls).padStart(6)}    ${r.el}`
  );
}
console.log("\nSeuil « bon » Core Web Vitals : LCP ≤ 2500 ms, CLS ≤ 0,1.");

/**
 * End-to-end smoke test against a running pair of servers.
 *
 *   # terminal 1
 *   cd ../manometry-back && uvicorn app.main:app
 *   # terminal 2
 *   npm run dev
 *   # terminal 3
 *   npm run smoke                 # add --shots to write PNGs into e2e/shots
 *
 * It is deliberately outside `npm test`: the unit suite has to run on a bare
 * checkout, and this one needs the checkpoint, the corpus and a browser.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:5173";
const SHOTS = process.argv.includes("--shots");
const OUT = path.join(import.meta.dirname, "shots");
const ANALYSIS_TIMEOUT = Number(process.env.SMOKE_ANALYSIS_TIMEOUT ?? 180_000);

// React's StrictMode mounts effects twice in development, so the first pass of
// in-flight GETs is aborted by design. Nothing else may fail.
const EXPECTED = /net::ERR_ABORTED/;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

if (SHOTS) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const problems = [];
page.on("console", (message) => {
  if (message.type() === "error") problems.push(`[console] ${message.text()}`);
});
page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));
page.on("requestfailed", (request) => {
  const reason = request.failure()?.errorText ?? "";
  if (!EXPECTED.test(reason)) problems.push(`[request] ${request.url()} :: ${reason}`);
});

await page.goto(BASE, { waitUntil: "domcontentloaded" });

// --- landing -----------------------------------------------------------------
await page.waitForSelector("h1");
check(
  (await page.locator("h1").innerText()).includes("Dez deglutições"),
  "o título principal não apareceu",
);
check(await page.locator("[data-testid=dropzone]").isVisible(), "a zona de upload não apareceu");
await page.waitForSelector("nav[aria-label=Diagnósticos]");
const atlasEntries = await page.locator("nav[aria-label=Diagnósticos] button").count();
check(atlasEntries === 8, `o atlas listou ${atlasEntries} classes em vez de 8`);
if (SHOTS) await page.screenshot({ path: `${OUT}/01-hero.png`, timeout: 120_000 });

// --- every atlas entry renders ----------------------------------------------
for (let index = 0; index < atlasEntries; index += 1) {
  await page.locator("nav[aria-label=Diagnósticos] button").nth(index).click();
  await page.waitForTimeout(120);
  const heading = await page.locator("article h3").first().innerText();
  check(heading.trim().length > 0, `a entrada ${index} do atlas ficou sem título`);
}
if (SHOTS) await page.screenshot({ path: `${OUT}/02-atlas.png`, timeout: 120_000 });

// --- a real analysis, end to end --------------------------------------------
const sample = page.locator("button", { hasText: /^Acalásia II$/ }).first();
if (await sample.count()) {
  await sample.click();
  await page.waitForSelector("[data-testid=pipeline-progress]", { timeout: 20_000 });
  await page.waitForSelector("[data-testid=result-view]", { timeout: ANALYSIS_TIMEOUT });
  const diagnosis = await page.locator("[data-testid=result-view] h3").first().innerText();
  check(/Acalásia tipo II/.test(diagnosis), `o laudo de exemplo saiu como "${diagnosis}"`);
  const swallows = await page.locator("[data-testid=swallow-strip] button").count();
  check(swallows > 0, "nenhuma deglutição foi exibida");
  if (SHOTS) await page.screenshot({ path: `${OUT}/03-resultado.png`, timeout: 120_000 });
} else {
  console.log("(sem laudo de exemplo no servidor; a análise não foi testada)");
}

// --- narrow viewport ---------------------------------------------------------
const mobile = await browser.newPage({ viewport: { width: 360, height: 780 } });
await mobile.goto(BASE, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("h1");
await mobile.waitForTimeout(800);
const overflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check(overflow <= 0, `a página rola ${overflow}px na horizontal a 360px de largura`);
if (SHOTS) await mobile.screenshot({ path: `${OUT}/04-mobile.png`, timeout: 120_000 });

await browser.close();

for (const problem of problems) failures.push(problem);
if (failures.length) {
  console.error("FALHOU\n" + failures.map((line) => `  - ${line}`).join("\n"));
  process.exit(1);
}
console.log("smoke ok");

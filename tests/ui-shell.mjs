/* Platform-shell acceptance: canonical recalculation service (scopes,
   identity strip, failure isolation, audit log) and the customizer's
   Calibri + separate number-font controls. Desktop and mobile.
   Run:  node tests/ui-shell.mjs [baseURL]   (static server on repo root)   */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  ({ chromium } = require(process.env.PLAYWRIGHT_HOME || "/opt/node22/lib/node_modules/playwright"));
}

const BASE = process.argv[2] || "http://localhost:8901";
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? "  ✓ " : "  ✗ FAIL ") + n); };

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

// ---- Recalculate controls visible on every section ----
ok(await page.locator("#recalc-btn").isVisible(), "Recalculate button visible in the sticky header");
ok(await page.locator("#recalc-strip").isVisible(), "calculation identity strip visible");
const stripInit = await page.locator("#recalc-strip").textContent();
ok(stripInit.includes("OBBBA") && stripInit.includes("Client:"), "strip shows ruleset + active client");

// Visible on a deep calculation tab too (sticky header + strip persist)
await page.evaluate(() => showSection("schedule-c"));
ok(await page.locator("#recalc-btn").isVisible(), "Recalculate visible on Schedule C");

// ---- Scope: this tab ----
await page.selectOption("#recalc-scope", "tab");
await page.click("#recalc-btn");
await page.waitForTimeout(300);
let strip = await page.locator("#recalc-strip").textContent();
ok(/✓ 1 module current \(tab\)/.test(strip), "tab-scope recalculation reports success (" + strip.slice(-60) + ")");
ok(strip.match(/Calc \d/), "strip shows calculation timestamp");

// ---- Scope: all — runs every registered module, updates dependent views ----
await page.selectOption("#recalc-scope", "all");
await page.click("#recalc-btn");
await page.waitForTimeout(600);
strip = await page.locator("#recalc-strip").textContent();
ok(/✓ \d+ modules current \(all\)/.test(strip), "all-scope recalculation reports success across modules");

// idempotent: run again, same success, audit grows by exactly one entry
const logLen1 = await page.evaluate(() => JSON.parse(localStorage.getItem("tap-recalc-log") || "[]").length);
await page.click("#recalc-btn");
await page.waitForTimeout(600);
const logLen2 = await page.evaluate(() => JSON.parse(localStorage.getItem("tap-recalc-log") || "[]").length);
ok(logLen2 === logLen1 + 1, "each run records exactly one audit entry (" + logLen1 + " → " + logLen2 + ")");

// upstream edit propagates: change client-profile business income, recalc, dashboard updates
await page.evaluate(() => showSection("clients"));
const kpiBefore = await page.evaluate(() => document.querySelector("#section-dashboard .kpi-value").textContent);
// Set the profile input without firing its own onchange, so only the
// orchestrated recalculation can propagate the edit to dependent tabs.
await page.evaluate(() => { document.getElementById("cp-biz-income").value = "245000"; });
await page.selectOption("#recalc-scope", "affected");
await page.click("#recalc-btn");
await page.waitForTimeout(600);
const kpiAfter = await page.evaluate(() => document.querySelector("#section-dashboard .kpi-value").textContent);
ok(kpiBefore !== kpiAfter, "upstream profile edit updates dependent Dashboard KPI (" + kpiBefore + " → " + kpiAfter + ")");

// ---- Failure isolation: one module throwing does not stop the rest ----
await page.evaluate(() => { window.calcVehicle = () => { throw new Error("injected test failure"); }; });
await page.selectOption("#recalc-scope", "all");
await page.click("#recalc-btn");
await page.waitForTimeout(600);
strip = await page.locator("#recalc-strip").textContent();
ok(strip.includes("1 module failure"), "failing module is reported, not silent");
ok((await page.locator("#recalc-strip").getAttribute("title")).includes("injected test failure"), "failure detail available");
const lastLog = await page.evaluate(() => JSON.parse(localStorage.getItem("tap-recalc-log") || "[]").pop());
ok(lastLog.failures.length === 1 && lastLog.modules.length > 15, "audit entry shows the other modules still ran (" + lastLog.modules.length + " modules)");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

// embedded workbench tab: strip explains delegation instead of double-running
await page.evaluate(() => showSection("workbench"));
await page.selectOption("#recalc-scope", "tab");
await page.click("#recalc-btn");
await page.waitForTimeout(300);
strip = await page.locator("#recalc-strip").textContent();
ok(strip.includes("recalculates inside its own workspace"), "embedded workbench delegates to its internal Recalculate");

// ---- Customizer: Calibri + separate number font ----
await page.evaluate(() => showSection("dashboard"));
await page.click("#tab-customize-btn");
ok(await page.locator('#tap-font-select option[value="calibri"]').count() === 1, "Calibri offered as text font");
ok(await page.locator("#tap-numfont-select").isVisible(), "separate number-font control present");
await page.selectOption("#tap-font-select", "calibri");
const fontVar = await page.evaluate(() => document.getElementById("section-dashboard").style.getPropertyValue("--tab-font"));
ok(fontVar.includes("Calibri") && fontVar.includes("Carlito") && fontVar.includes("Segoe UI"), "Calibri applies with safe fallback stack (" + fontVar + ")");
await page.selectOption("#tap-numfont-select", "mono");
const numVar = await page.evaluate(() => document.getElementById("section-dashboard").style.getPropertyValue("--tab-font-num"));
ok(numVar.includes("Menlo") || numVar.includes("Mono"), "number font set independently of text font");
const kpiFam = await page.evaluate(() => getComputedStyle(document.querySelector("#section-dashboard .kpi-value")).fontFamily);
ok(kpiFam.includes("Menlo") || kpiFam.includes("Mono"), "KPI figures render in the number font");
const labelFam = await page.evaluate(() => getComputedStyle(document.querySelector("#section-dashboard .kpi-label") || document.querySelector("#section-dashboard h3") || document.querySelector("#section-dashboard div")).fontFamily);
ok(!(labelFam.includes("Menlo") || labelFam.includes("Mono")), "text labels keep the text font");
// number weight scoped: default KPI bold preserved
const kpiWeight = await page.evaluate(() => getComputedStyle(document.querySelector("#section-dashboard .kpi-value")).fontWeight);
ok(kpiWeight === "700", "default KPI weight unchanged (" + kpiWeight + ")");
await page.selectOption("#tap-numweight-select", "semibold");
const kpiWeight2 = await page.evaluate(() => getComputedStyle(document.querySelector("#section-dashboard .kpi-value")).fontWeight);
ok(kpiWeight2 === "600", "number-weight control applies (" + kpiWeight2 + ")");

// persistence after reload
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const fontVar2 = await page.evaluate(() => document.getElementById("section-dashboard").style.getPropertyValue("--tab-font"));
const numVar2 = await page.evaluate(() => document.getElementById("section-dashboard").style.getPropertyValue("--tab-font-num"));
ok(fontVar2.includes("Calibri") && (numVar2.includes("Menlo") || numVar2.includes("Mono")), "font choices persist after reload");
// formatting is presentation-only: recalc still succeeds and values match engine rerun
await page.selectOption("#recalc-scope", "all");
await page.click("#recalc-btn");
await page.waitForTimeout(600);
strip = await page.locator("#recalc-strip").textContent();
ok(/✓ \d+ modules current/.test(strip), "recalculation unaffected by formatting changes");
// reset restores defaults
await page.click("#tab-customize-btn");
await page.evaluate(() => tapResetTab());
const fontVar3 = await page.evaluate(() => document.getElementById("section-dashboard").style.getPropertyValue("--tab-font"));
ok(fontVar3.includes("Instrument Sans"), "reset restores the default font");

ok(errors.length === 0, "no page errors on desktop (" + errors.slice(0, 2).join(" | ") + ")");
await page.close();

// ---- Mobile ----
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
const merrs = [];
m.on("pageerror", e => merrs.push(String(e)));
await m.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await m.waitForTimeout(2000);
ok(await m.locator("#recalc-btn").isVisible(), "mobile: Recalculate button visible");
ok(await m.locator("#recalc-strip").isVisible(), "mobile: identity strip visible");
await m.click("#recalc-btn"); // scope select hidden on mobile; defaults to affected
await m.waitForTimeout(500);
const mstrip = await m.locator("#recalc-strip").textContent();
ok(/✓ .*current/.test(mstrip) || mstrip.includes("no shell-side"), "mobile: recalculation runs (" + mstrip.slice(-50) + ")");
ok(merrs.length === 0, "no page errors on mobile (" + merrs.slice(0, 2).join(" | ") + ")");
await m.close();

await browser.close();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);

/* Acceptance tests for the data-driven scenario system (js/scenarios.js):
   registry integrity, library grid, search/filter, selectable comparison,
   scenario loading through the field map, dashboard recalculation, custom
   scenario save/load/delete, report attribution, and persistence.
   Run:  node tests/ui-scenarios.mjs   (static server on the repo root)      */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  ({ chromium } = require(process.env.PLAYWRIGHT_HOME || "/opt/node22/lib/node_modules/playwright"));
}
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const BASE = process.argv[2] || "http://localhost:8901";

const b = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? "  ✓ " : "  ✗ FAIL ") + n); };
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", e => errs.push(String(e)));
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);

// registry
const n = await p.evaluate(() => BUILT_IN_SCENARIOS.length);
ok(n === 11, "registry holds 11 built-in scenarios (got " + n + ")");
ok(await p.evaluate(() => DEMO_CLIENTS.length) === 11, "client switcher derives all scenarios");
ok(await p.evaluate(() => document.querySelectorAll('#client-switcher option').length) === 11, "switcher renders 11 options");

// library UI — the tab now opens on the 1040 Planner, so switch to the library view
await p.evaluate(() => showSection('scenarios'));
await p.waitForTimeout(400);
await p.evaluate(() => showScenarioView('library'));
await p.waitForTimeout(200);
const cards = await p.locator("#scenario-grid > div.card").count();
ok(cards === 11, "library grid renders every scenario (" + cards + ")");
ok((await p.locator("#scenario-count").textContent()).includes("11 of 11"), "count reads 11 of 11");

// search + filter
await p.fill("#scenario-search", "real estate");
await p.waitForTimeout(200);
ok(await p.locator("#scenario-grid > div.card").count() === 1, "search narrows to the real estate scenario");
await p.fill("#scenario-search", "");
await p.evaluate(() => setScenarioFilter('scorp'));
await p.waitForTimeout(200);
const sc = await p.locator("#scenario-grid > div.card").count();
ok(sc === 4, "S-Corp filter returns the 4 S-Corp scenarios (" + sc + ")");
await p.evaluate(() => setScenarioFilter('all'));

// comparison is now computed by the embedded 1040 Planner, not read off the record
await p.evaluate(() => showScenarioView('planner'));
await p.waitForTimeout(2500); // the planner iframe boots and runs its engine
await p.evaluate(() => { ['s4','s5'].forEach(toggleComparison); });
await p.waitForTimeout(1200);
const cols = await p.locator("#scenario-compare thead th").count();
ok(cols === 5, "engine comparison renders a column per modeled scenario (" + cols + " incl. label)");
const modeled = await p.evaluate(() => PLANNER_SUMMARIES.length);
ok(modeled === 4, "planner modeled the four ticked scenarios (" + modeled + ")");
ok(await p.evaluate(() => PLANNER_SUMMARIES.every(s => s.totalTax > 0)), "every modeled scenario has an engine-computed total tax");
await p.evaluate(() => showScenarioView('library'));
await p.waitForTimeout(200);

// load a new scenario -> inputs + dashboard update
const kpiBefore = await p.evaluate(() => document.querySelector('#section-dashboard .kpi-value').textContent);
await p.evaluate(() => loadScenario('s11'));
await p.waitForTimeout(700);
ok(await p.evaluate(() => document.getElementById('cp-name').value) === "Ray & Denise Kowalczyk", "loading s11 populates Client Profile");
ok(await p.evaluate(() => +document.getElementById('sc-gross').value) === 1180000, "Schedule C gross revenue applied");
ok(await p.evaluate(() => +document.getElementById('sc-cogs').value) === 420000, "COGS applied (field-map covers new fields)");
ok(await p.evaluate(() => +document.getElementById('sc2-salary-pct').value) === 40, "S-Corp salary % clamped to the slider max (42% data → 40% control)");
const kpiAfter = await p.evaluate(() => document.querySelector('#section-dashboard .kpi-value').textContent);
ok(kpiBefore !== kpiAfter, "dashboard KPI recalculated (" + kpiBefore + " → " + kpiAfter + ")");
ok(await p.evaluate(() => localStorage.getItem('tap-active-client')) === "s11", "active client synced to s11");
ok(await p.evaluate(() => document.getElementById('sidebar-client-name').textContent) === "Ray & Denise Kowalczyk", "sidebar name updated");

// legacy ordinal still works
await p.evaluate(() => loadScenario(2));
await p.waitForTimeout(500);
ok(await p.evaluate(() => document.getElementById('cp-name').value).then(v => v.includes("Rodriguez")), "legacy loadScenario(2) still resolves");

// switching via the client switcher
await p.selectOption("#client-switcher", "s6");
await p.waitForTimeout(600);
ok(await p.evaluate(() => document.getElementById('cp-name').value) === "Marcus Whitfield", "client switcher loads registry scenario");

// custom scenario save / load / delete
await p.evaluate(() => { document.getElementById('cp-biz-income').value = 275000; saveCurrentScenario('My Test Client'); });
await p.waitForTimeout(400);
ok(await p.evaluate(() => customScenarios().length) === 1, "custom scenario saved to localStorage");
ok((await p.locator("#scenario-grid > div.card").count()) === 12, "custom scenario appears in the grid");
const cid = await p.evaluate(() => customScenarios()[0].id);
await p.evaluate(id => loadScenario(id), cid);
await p.waitForTimeout(500);
ok(await p.evaluate(() => document.getElementById('cp-biz-income').value) === "275000", "custom scenario reloads its captured state");
await p.evaluate(id => deleteCustomScenario(id), cid);
await p.waitForTimeout(200);
ok(await p.evaluate(() => customScenarios().length) === 0, "custom scenario deleted");

// report attribution
await p.evaluate(() => loadScenario('s9'));
await p.waitForTimeout(600);
const label = await p.evaluate(() => reportScenarioLabel());
ok(label.includes("Osei"), "Client Report names the loaded scenario (" + label + ")");

// recalc service still healthy with the new module
await p.evaluate(() => showSection('dashboard'));
await p.selectOption("#recalc-scope", "all");
await p.click("#recalc-btn");
await p.waitForTimeout(900);
const strip = await p.locator("#recalc-strip").textContent();
ok(/✓ 21 modules current/.test(strip), "recalc runs all 21 modules incl. Scenario Library");

ok(errs.length === 0, "no page errors (" + errs.slice(0,3).join(" | ") + ")");

// persistence across reload
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
ok(await p.evaluate(() => document.getElementById('cp-name').value).then(v => v.includes("Osei")), "active scenario restored after reload");

// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
const merr = []; m.on("pageerror", e => merr.push(String(e)));
await m.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await m.waitForTimeout(2000);
await m.evaluate(() => showSection('scenarios'));
await m.evaluate(() => showScenarioView('library'));
await m.waitForTimeout(300);
ok(await m.locator("#scenario-grid > div.card").first().isVisible(), "mobile: scenario cards render");
ok(merr.length === 0, "mobile: no page errors");
await b.close();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);

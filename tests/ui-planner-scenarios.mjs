/* Acceptance tests for the 1040 Planner module inside the Scenarios tab.

   The planner replaced the static side-by-side attribute table this tab used
   to show, so these tests cover the seam: that the module loads where the
   table was, that library scenario FACTS map onto the planner's input schema
   correctly, that every number on screen comes out of the planner's engine,
   and that a user's own planner scenarios survive a re-import.

   Run:  node tests/ui-planner-scenarios.mjs   (static server on the repo root) */
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
const near = (a, x, tol = 1) => Math.abs(a - x) <= tol;

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", e => errs.push(String(e)));
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);

/* ---- the module lives in the Scenarios tab now ------------------------- */
ok(await p.evaluate(() => !document.getElementById('section-planner-1040')),
   "the standalone 1040 Planner section is gone");
ok(await p.evaluate(() => !document.getElementById('nav-planner-1040')),
   "the standalone 1040 Planner nav item is gone");
ok(await p.evaluate(() => !!document.querySelector('#section-scenarios #scenarios-frame')),
   "the planner frame sits inside the Scenarios tab");
ok(await p.evaluate(() => !document.getElementById('scenarios-frame').getAttribute('src')),
   "the planner is lazy — no src before the tab is opened");

await p.evaluate(() => showSection('scenarios'));
await p.waitForTimeout(3000);
ok(await p.evaluate(() => document.getElementById('scenarios-frame').getAttribute('src')) === "planner/index.html",
   "opening the tab loads the planner");
ok(await p.evaluate(() => document.getElementById('page-title').textContent).then(t => t.includes("1040 Planner")),
   "page title names the module");

/* legacy route still resolves */
await p.evaluate(() => showSection('planner-1040'));
await p.waitForTimeout(400);
ok(await p.evaluate(() => document.getElementById('section-scenarios').classList.contains('active')),
   "the old planner-1040 route redirects into the Scenarios tab");

/* ---- the engine, not the scenario record, produces the comparison ------- */
const summaries = await p.evaluate(() => PLANNER_SUMMARIES);
ok(summaries.length > 0, "the planner reported engine results to the host (" + summaries.length + ")");
ok(summaries.every(s => typeof s.totalTax === "number" && s.totalTax > 0),
   "every modeled scenario carries an engine-computed total tax");
ok(await p.evaluate(() => PLANNER_LAST_ERROR) === "", "no mapping errors reported");

await p.evaluate(() => showScenarioView('library'));
await p.waitForTimeout(300);
const head = await p.locator("#scenario-compare thead th").first().textContent();
ok(head.includes("Engine result"), "the old attribute table is replaced by the engine comparison");
const rowLabels = await p.locator("#scenario-compare tbody td:first-child").allTextContents();
["AGI", "Taxable income", "QBI deduction", "Self-employment tax", "Total tax", "Effective rate"].forEach(l =>
  ok(rowLabels.includes(l), "engine comparison reports " + l));

/* ---- fact mapping: sole proprietor ------------------------------------- */
const s1 = await p.evaluate(() => {
  const s = allScenarios().find(x => x.id === 's1');
  const mapped = plannerInputsFromScenario(s);
  const fr = document.getElementById('scenarios-frame').contentWindow;
  const r = fr.TaxEngine.computeProjection(fr.TaxEngine.parseInputs(mapped.inputs));
  return { scenario: s, inputs: mapped.inputs, notes: mapped.notes, r: {
    totalIncome: r.totalIncome, adjustments: r.adjustments, agi: r.agi,
    seTax: r.seTax, qbiDeduction: r.qbiDeduction, totalTax: r.totalTax
  } };
});
ok(s1.inputs.businesses.length === 1, "sole prop maps to one Schedule C business");
ok(s1.inputs.businesses[0].grossReceipts - s1.inputs.businesses[0].expenses === s1.scenario.business.netIncome,
   "Schedule C expenses are derived so net profit equals the scenario's stated net income");
ok(s1.inputs.businesses[0].isSSTB === s1.scenario.business.sstb, "SSTB status carries across");
ok(s1.inputs.profile.filingStatus === s1.scenario.filingStatus, "filing status carries across");
ok(s1.inputs.profile.taxpayerAge === s1.scenario.age, "age carries across");
/* Total income = Schedule C net + investment income + rental income. */
const s1Expected = s1.scenario.business.netIncome + s1.scenario.otherIncome.investment + s1.scenario.otherIncome.rental;
ok(near(s1.r.totalIncome, s1Expected),
   "total income equals the mapped facts (" + s1.r.totalIncome + " vs " + s1Expected + ")");
/* Investment income must not be double counted across the dividend lines. */
const s1Div = s1.inputs.interestDividends.reduce((a, i) => a + (i.kind === 'qualifiedDividend' || i.kind === 'ordinaryDividend' || i.kind === 'interest' ? i.amount : 0), 0);
ok(near(s1Div, s1.scenario.otherIncome.investment),
   "investment income splits without double counting (" + s1Div + ")");
/* SE tax on 92.35% of Schedule C net, 12.4% + 2.9% under the wage base. */
const seBase = s1.scenario.business.netIncome * 0.9235;
ok(near(s1.r.seTax, seBase * 0.124 + seBase * 0.029, 1),
   "self-employment tax matches Schedule SE on the mapped net profit (" + s1.r.seTax + ")");
ok(s1.notes.length > 0, "the mapping records its assumptions on the scenario");

/* ---- fact mapping: S-Corporation --------------------------------------- */
const s3 = await p.evaluate(() => {
  const s = allScenarios().find(x => x.id === 's3');
  const mapped = plannerInputsFromScenario(s);
  const fr = document.getElementById('scenarios-frame').contentWindow;
  const r = fr.TaxEngine.computeProjection(fr.TaxEngine.parseInputs(mapped.inputs));
  return { scenario: s, inputs: mapped.inputs, r: {
    totalIncome: r.totalIncome, seTax: r.seTax, qbiDeduction: r.qbiDeduction, taxableIncome: r.taxableIncome
  } };
});
const k1 = s3.inputs.otherIncome.find(i => i.kind === 'k1Ordinary');
ok(s3.inputs.businesses.length === 0, "an S-Corp is not modeled as Schedule C income");
ok(s3.inputs.wages.some(w => w.wages === s3.scenario.compensation.reasonableComp),
   "reasonable compensation is modeled as W-2 wages");
ok(!!k1 && k1.amount === s3.scenario.business.netIncome - s3.scenario.compensation.reasonableComp,
   "the remaining profit is modeled as K-1 ordinary income");
ok(s3.r.seTax === 0, "no self-employment tax on S-Corp passthrough income");
ok(k1.isSSTB === s3.scenario.business.sstb && k1.w2Wages > 0,
   "the K-1 carries SSTB status and W-2 wages into §199A");
/* Linda Park is an SSTB single filer far above the §199A phase-out ceiling,
   so the deduction must be fully denied — the case the old lumped, always
   non-SSTB K-1 component got wrong. */
ok(s3.r.qbiDeduction === 0,
   "§199A is denied for an SSTB S-Corp above the phase-out (taxable " + Math.round(s3.r.taxableIncome) + ")");

/* An SSTB S-Corp below the threshold still gets the full 20%. */
const s7 = await p.evaluate(() => {
  const s = allScenarios().find(x => x.id === 's7');
  const fr = document.getElementById('scenarios-frame').contentWindow;
  const inputs = fr.TaxEngine.parseInputs(plannerInputsFromScenario(s).inputs);
  const r = fr.TaxEngine.computeProjection(inputs);
  return { k1: inputs.otherIncome[0].amount, qbi: r.qbiDeduction, taxable: r.taxableIncome };
});
ok(near(s7.qbi, s7.k1 * 0.2, 1),
   "§199A allows the full 20% for an SSTB S-Corp below the threshold (" + s7.qbi + ")");

/* A corporate retirement contribution is not an above-the-line 1040 item. */
ok(await p.evaluate(() => plannerInputsFromScenario(allScenarios().find(x => x.id === 's3')).inputs.planningStrategies.length) === 0,
   "an S-Corp plan contribution is not deducted on the shareholder's 1040");
ok(await p.evaluate(() => plannerInputsFromScenario(allScenarios().find(x => x.id === 's1')).inputs.planningStrategies.length) === 1,
   "a self-employed plan contribution is a Schedule 1 adjustment");

/* ---- selection drives what the planner models --------------------------- */
await p.evaluate(() => { localStorage.setItem('tap-scenario-compare', JSON.stringify(['s2'])); });
await p.evaluate(() => sendScenariosToPlanner());
await p.waitForTimeout(800);
const one = await p.evaluate(() => PLANNER_SUMMARIES);
ok(one.length === 1 && one[0].name.includes("Rodriguez"),
   "the planner models exactly the ticked selection (" + one.map(s => s.name).join(", ") + ")");

await p.evaluate(() => toggleComparison('s1'));
await p.waitForTimeout(900);
const two = await p.evaluate(() => PLANNER_SUMMARIES.length);
ok(two === 2, "ticking another scenario re-models it in the planner (" + two + ")");

/* ---- a user's own planner scenarios are never clobbered ----------------- */
const kept = await p.evaluate(() => {
  const fr = document.getElementById('scenarios-frame').contentWindow;
  fr.document.getElementById('new-scenario');
  /* Create a planner-native scenario the way the Scenarios view does. */
  const api = fr.TaxPlannerHost;
  const before = api.scenarioCount();
  fr.TaxPlannerHost.setTab('scenarios');
  return { before: before };
});
await p.evaluate(() => {
  const fr = document.getElementById('scenarios-frame').contentWindow;
  fr.TaxPlannerHost.setTab('scenarios');
});
await p.waitForTimeout(400);
await p.evaluate(() => {
  const fr = document.getElementById('scenarios-frame').contentWindow;
  const input = fr.document.getElementById('new-scenario');
  input.value = 'My own what-if';
  input.dispatchEvent(new fr.Event('input', { bubbles: true }));
  fr.document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim() === 'Create from active') btn.click();
  });
});
await p.waitForTimeout(700);
ok(await p.evaluate(() => {
  const fr = document.getElementById('scenarios-frame').contentWindow;
  return fr.TaxPlannerHost.summaries().some(s => s.name === 'My own what-if');
}), "a scenario created inside the planner exists");

await p.evaluate(() => toggleComparison('s4'));
await p.waitForTimeout(900);
const afterReimport = await p.evaluate(() => {
  const fr = document.getElementById('scenarios-frame').contentWindow;
  const all = fr.TaxPlannerHost.summaries();
  return { mine: all.filter(s => !s.hostId).map(s => s.name), hosted: all.filter(s => s.hostId).length };
});
ok(afterReimport.mine.includes('My own what-if'),
   "a re-import keeps the user's own planner scenario (" + afterReimport.mine.join(", ") + ")");
ok(afterReimport.hosted === 3, "a re-import refreshes only the host-imported scenarios (" + afterReimport.hosted + ")");

/* ---- recalculation service still covers the tab ------------------------- */
await p.evaluate(() => showSection('dashboard'));
await p.selectOption("#recalc-scope", "all");
await p.click("#recalc-btn");
await p.waitForTimeout(1200);
ok(/✓ 21 modules current/.test(await p.locator("#recalc-strip").textContent()),
   "the recalculation service runs the Scenarios & 1040 Planner module");

ok(errs.length === 0, "no page errors (" + errs.slice(0, 3).join(" | ") + ")");

await b.close();
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);

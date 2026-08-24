import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_HOME);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('**/*', route => {
  const url = route.request().url();
  if (url.startsWith('http://127.0.0.1:8322')) route.continue();
  else route.abort();
});
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
let passed = 0;
const check = (condition, label) => {
  if (!condition) throw new Error('FAIL  ' + label);
  passed++;
  console.log('PASS  ' + label);
};

await page.goto(process.argv[2] || 'http://127.0.0.1:8322', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1200);
check(errors.length === 0, 'page loads without runtime errors');
const initial = await page.evaluate(() => ({ recalc: window.TAP_LAST_RECALC, report: !!document.getElementById('report-body')?.textContent.trim() }));
check(initial.recalc && initial.recalc.failures.length === 0, 'shared recalculation completes every available module');
check(initial.report, 'report builds without visiting prerequisite tabs');

await page.evaluate(() => {
  const set = (id, value) => { const el = document.getElementById(id); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); };
  set('inv-interest', 11111); set('dni-ti', 22222); switchClient('s2');
  set('inv-interest', 33333); set('dni-ti', 44444); switchClient('s1');
});
const restored = await page.evaluate(() => ({ inv: +document.getElementById('inv-interest').value, trust: +document.getElementById('dni-ti').value }));
check(restored.inv === 11111 && restored.trust === 22222, 'client switching restores investment and trust inputs to the correct client');

await page.evaluate(() => switchClient('s2'));
const ai = await page.evaluate(() => ({ name: activeClient().name, prompt: buildAISystemPrompt() }));
check(ai.prompt.includes(ai.name) && !ai.prompt.includes('Sarah Mitchell'), 'AI prompt is generated from the active client only');
const tax = await page.evaluate(() => {
  recalculateAll(); const t = window.TC_BASE;
  return { total: t.totalTax, sum: t.fedTax + t.seTax + t.niit + t.additionalMedicareTax + t.stateTax,
    preferential: calcFederalTaxWithPreferential(100000, 20000, 10000, 'single'), ordinary: calcFederalTax(100000, 'single') };
});
check(Math.abs(tax.total - tax.sum) < .01, 'comparison total reconciles all displayed tax components');
check(tax.preferential < tax.ordinary, 'qualified dividends and long-term gains receive preferential rates');
await browser.close();
console.log(`\n${passed} passed, 0 failed`);

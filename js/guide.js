// guide.js — injects the in-app User Guide section.
// Plain content only: this file renders documentation and never touches
// client data, calculations, or preferences.
(function(){
const wrap = document.querySelector('#main-content > .px-8');
if(!wrap) return;
const H = (t) => '<h2 class="text-lg font-bold text-slate-800 mt-8 mb-2">' + t + '</h2>';
const P = (t) => '<p class="text-slate-600 text-sm leading-relaxed mb-3">' + t + '</p>';
const UL = (items) => '<ul class="list-disc pl-5 text-sm text-slate-600 leading-relaxed mb-3 space-y-1">' +
  items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
const OL = (items) => '<ol class="list-decimal pl-5 text-sm text-slate-600 leading-relaxed mb-3 space-y-1">' +
  items.map(i => '<li>' + i + '</li>').join('') + '</ol>';
const NOTE = (t) => '<div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed mb-4">' + t + '</div>';
const KEY = (t) => '<kbd class="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-xs font-mono">' + t + '</kbd>';

wrap.insertAdjacentHTML('beforeend', '' +
'<div id="section-user-guide" class="content-section">' +
  '<div class="mb-6 flex items-end justify-between no-print">' +
    '<div><h1 class="text-2xl font-extrabold text-slate-900">User Guide</h1>' +
    '<p class="text-slate-500 text-sm mt-1">How to run a client through the workbench, build scenarios, and read the numbers</p></div>' +
    '<button onclick="window.print()" class="px-4 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">Print this guide</button>' +
  '</div>' +
  '<div class="card" style="max-width:900px;">' +

  H('1. The two workspaces — and which one to use') +
  P('This platform contains two calculation environments. They share the same screen but keep <strong>separate client records</strong>, so pick one home for a given client and stay there.') +
  UL([
    '<strong>Planning Workbench (TY25/26)</strong> — under Planning in the sidebar. The full multi-scenario engine: client profiles, unlimited scenarios, side-by-side comparison, SE and retirement plan design, MAGI phase-outs, QBI, SEHI/IRA, audit trail, Excel workbooks with live formulas, and the AI advisory layer. <strong>Use this for real planning work.</strong>',
    '<strong>The platform tabs</strong> — Schedules 1/A/C/E, Investment Income, Entity and S-Corp, Retirement, Home Office, Vehicle, State Tax, Quarterly, Trusts and Estates, Form 1041, GST. Single-case calculators for quick answers and for topics the workbench does not cover (notably trusts and estates).',
    '<strong>1040 Planner (TY2026)</strong> — under Client &rarr; Scenarios &amp; 1040 Planner. A full Form 1040 build-up for one return: every line carries an authority citation and a calculation-detail drawer, plus its own what-if scenarios, Strategy Scenario Library, print-ready report, coverage matrix and round-trippable Excel export. It also runs standalone at <code>planner/</code>.'
  ]) +
  NOTE('A client you create in the platform’s Client Profiles will <strong>not</strong> appear in the Planning Workbench’s client list, and vice versa. The two keep separate stores. Numbers flow freely <em>within</em> each workspace, never between them.') +

  H('2. Core workflow') +
  OL([
    'Open the <strong>Planning Workbench</strong> and select or create a client (sidebar, Active client).',
    'Fill in the <strong>Client Profile</strong> tab — household facts, income, businesses, goals, constraints. This drives every calculation.',
    'Go to <strong>Scenarios</strong>. The first scenario is your baseline. Add more to model alternatives.',
    'Compare on the <strong>Dashboard</strong> and the Scenarios ledger.',
    'Use the <strong>Calculators</strong> in the right Tools rail to test specific strategies.',
    'Review <strong>validation notices</strong> and the <strong>Audit Trail</strong>.',
    'Produce a <strong>Report</strong> and an <strong>Excel workbook</strong>.'
  ]) +

  H('3. Building specific cases — for example, a retirement comparison') +
  P('There are three ways to model a specific case, from fastest to most controlled.') +
  P('<strong>a) Use a calculator, then promote the result to a scenario.</strong> Open the Tools rail on the right, choose <strong>Calculators &rarr; Retirement</strong>. It clones your active scenario four times and runs the real engine on each plan design — No plan, Solo 401(k), SEP IRA, SIMPLE IRA — showing deduction, total modeled tax, and spendable cash side by side, with the lowest-tax design flagged. Press <strong>Model</strong> on any row to turn that design into a permanent scenario in your list. The calculator itself never edits your current scenario; its overrides are temporary.') +
  P('<strong>b) Build it by hand.</strong> On the Scenarios tab press <strong>Add</strong> or <strong>Duplicate</strong>, rename it, and edit the inputs directly — plan type, deferral, employer percentage, age, and everything else.') +
  P('<strong>c) Use the dedicated module.</strong> The <strong>SE &amp; Retirement</strong> tab carries the full plan-design detail: maximum deductible contribution under each design, catch-ups, the compensation limit, and the annual-additions limit.') +
  P('The same pattern exists for the other nine calculators: S-Corp Salary, QBI, SSTB Phase-out, Tax Brackets, Charitable, Audit Risk, &sect;163(j), Payroll Tax, and Roth Conversion. Each offers <strong>Create test scenario</strong>, <strong>Ask AI to review</strong>, and <strong>Add note</strong>.') +
  NOTE('A bigger deduction is not automatically a better outcome. Compare the <strong>spendable cash</strong> column alongside the tax column — a retirement deduction defers tax and reduces cash available this year.') +

  H('3b. The Scenarios tab — 1040 Planner and the Scenario Library') +
  P('The <strong>Scenarios</strong> tab (Client &rarr; Scenarios &amp; 1040 Planner) opens on the <strong>1040 Planner (TY2026)</strong>: the full Form 1040 build-up, its own what-if scenarios with deltas against a baseline, the Strategy Scenario Library, and the print-ready report. This is where the tab\'s comparison is computed — the planner\'s engine produces every figure.') +
  P('Switch to the <strong>Scenario Library</strong> view for the built-in client profiles covering a wide range of fact patterns — SSTB phase-out, high-SALT multi-state, real estate professional, low S-Corp salary risk, W-2 plus side Schedule C, high net worth with NIIT, a young professional maximizing deferrals, and an equipment-heavy contractor. Search or filter by entity type and planning issue, tick any number of scenarios to model them, and press <strong>Load</strong> to push one into every calculator.') +
  P('Ticking <strong>Include in comparison</strong> maps those scenarios into the planner and recomputes them there, so the comparison you read is engine output — AGI, taxable income, QBI deduction, SE tax, total tax and the delta against the first scenario — rather than a restatement of the facts on the scenario card. Each mapped scenario carries a description recording exactly what was assumed (how S-Corp compensation was split from K-1 income, how investment income was split between interest and qualified dividends, and what was left out).') +
  P('<strong>Save your own.</strong> Set the calculators up for a real client and press <strong>Save current state</strong> — it becomes a saved scenario you can reload, rename, delete, export to JSON, or import on another machine. Saved scenarios are marked as yours and live in this browser only.') +

  H('4. Do the numbers flow to the other tabs?') +
  P('Inside the Planning Workbench: <strong>yes, completely.</strong> One calculation pipeline serves every view. Any scenario you add or edit immediately updates the Dashboard KPIs and Form 1040 walk, the Scenarios ledger, the SE / MAGI / QBI / SEHI modules, goal alignment, the audit trail, the client report, the Excel export, and the context handed to the AI.') +
  P('On the platform tabs the modules also feed each other — the Retirement tab passes its deduction into Schedule 1, which flows into the 1040 totals.') +
  P('The <strong>Recalculate</strong> button in the header re-runs everything on demand, with three scopes: <em>This tab</em>, <em>Affected tabs</em>, and <em>All</em>. It stages your current edit, validates the active client, runs the modules in dependency order, refreshes every dependent view, and records the run. The strip underneath shows the calculation time, engine version, ruleset version, and whether the figures are current.') +

  H('5. Where did this number come from?') +
  P('In the workbench, Dashboard KPIs and every line of the Form 1040 walk carry a small <strong>?</strong> button. It opens a trace showing the inputs, intermediate values, the formula in words, the statutory parameters with their citations, the tax year and filing status, the engine and ruleset versions, and when it was calculated. Copy the trace, or ask the AI to explain it in plain language.') +

  H('6. What the AI can and cannot do') +
  UL([
    '<strong>Can:</strong> explain drivers, identify opportunities and missing facts, compare scenarios, draft report narrative, and propose specific input changes.',
    '<strong>Cannot:</strong> change your data. Every proposal is shown for review and applied only when you approve it — at which point the deterministic engine recalculates and the change is written to the audit trail.',
    '<strong>Never</strong> supplies tax figures of its own. All amounts come from the engine.'
  ]) +
  P('Entry points: <strong>AI Analysis</strong> (the workspace tab), <strong>Ask AI</strong> on modules and scenarios, <strong>AI Optimize</strong> (proposes candidate scenarios), <strong>Build Report</strong>, and the floating <strong>Ask AI</strong> reviewer. Saved analyses and built reports are marked <strong>Stale</strong> when the underlying inputs change afterwards.') +
  P('Reports are generated one section at a time, and you can regenerate any single section with an instruction such as making it more technical.') +

  H('7. Excel, reports, and round-tripping') +
  UL([
    '<strong>Import / Export tab &rarr; Export workbook (.xlsx)</strong> — every computed cell is a live Excel formula pointing at a named statutory constant or an input cell, and each schedule ends with a tie-out against the engine result.',
    '<strong>Blank input template</strong> — fill in the scenario columns offline and import it back.',
    '<strong>Import Excel</strong> — reads the Inputs sheet and rebuilds the scenarios.',
    '<strong>Save session (.json)</strong> — an exact restore point including notes and the audit trail.',
    '<strong>Copy for Excel</strong> — on the Scenarios ledger, the 1040 walk, and the Audit Trail; pastes into a worksheet as real numbers.',
    '<strong>Report tab</strong> — client-ready report; choose which sections print, then print or save as PDF.'
  ]) +

  H('8. Making it yours') +
  UL([
    '<strong>Customize</strong> (the gear in the header) — theme, background, borders, and fonts, per tab or application-wide. Text font and number font are set separately; Calibri is available, and financial figures use aligned tabular numerals.',
    '<strong>Number formats</strong> — currency style, decimals, negative-number style, and zero style. Presentation only; stored values and calculations never change.',
    '<strong>Edit Layout</strong> (workbench) — move, resize, and hide cards, saved per tab.',
    '<strong>Navigation</strong> — the sidebar expands, collapses to icons, or hides entirely. The Tools rail does the same.',
    '<strong>Pin</strong> the calculators you use most to the top of the Tools rail.'
  ]) +

  H('9. Keyboard shortcuts (workbench)') +
  UL([
    KEY('Ctrl') + ' + ' + KEY('K') + ' — search pages, clients, scenarios, calculators, and actions',
    KEY('Ctrl') + ' + ' + KEY('Z') + ' — undo an input edit; ' + KEY('Ctrl') + ' + ' + KEY('Shift') + ' + ' + KEY('Z') + ' — redo',
    KEY('Esc') + ' — close a drawer, panel, or full-screen section'
  ]) +

  H('10. Your data') +
  P('Client data is stored in <strong>this browser only</strong> — there is no server database. Clearing site data erases it, and it does not follow you to another device. Export a session or a workbook to keep a copy. The AI credential lives only in the deployment environment and never reaches the browser.') +

  H('11. If something does not work') +
  UL([
    '<strong>Numbers look stale</strong> — press Recalculate (scope: All) and check the status strip.',
    '<strong>An AI request times out</strong> — the hosting plan limits how long a single request may run. Ask a narrower question, select fewer report sections, or reduce the number of scenarios in scope.',
    '<strong>AI says it is not configured</strong> — the deployment is missing its API credential; that is a deployment setting, not something to fix in the browser.',
    '<strong>A calculation module fails</strong> — the status strip names it and keeps the last valid figures; the other modules keep working.',
    '<strong>A client is missing</strong> — check whether it was created in the other workspace (see section 1).'
  ]) +

  '<p class="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-200">All figures are planning estimates, not a filed return or a formal tax opinion. &copy; 2026 AI Tax Strategy Advisors. All Rights Reserved.</p>' +
  '</div>' +
'</div>');
})();

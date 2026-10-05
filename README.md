# Tax Planning Workbench

A single-page tax strategy platform for a solo tax practice: client profiles, a
tax calculation engine (federal/state income tax, SE tax, QBI, retirement,
entity comparisons), and a dedicated Trusts & Estates module (Form 1041
workbench, GST planning, trust classification).

## Running it

No build step. Serve the directory statically and open `index.html`, e.g.:

```
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Structure

- `index.html` — app shell, layout, styles, and the core dashboard/client-profile logic
- `planner/` — **Tax Planner — Individual 1040 (TY2026)** workbench (own
  engine, UI, and vendored libraries — see `planner/README.md`). It is the
  module the **Scenarios** tab opens on, where it replaced that tab's static
  side-by-side attribute table, and it is also usable standalone at
  `planner/`. `js/planner-bridge.js` maps scenario facts from the library
  into the planner's input schema and reads the engine's results back; the
  planner's engine computes every figure the tab shows.
- `workbench/` — **Individual Planning Workbench (TY2025/TY2026)**, imported
  from [`nasi118/AI-Tax`](https://github.com/nasi118/AI-Tax): a React 18
  (vendored UMD, no build step) multi-scenario planning app — SE and
  retirement-plan design, MAGI phase-outs, QBI, SEHI/IRA coordination, and
  AI-assisted review. Embedded as the "Planning Workbench (TY25/26)" section
  in the Planning nav group, and also usable standalone at `workbench/`.
  The `workbench/src/*.js` files load in numeric order and share global
  scope — preserve the script order in `workbench/index.html`.
- `api/` — Vercel serverless functions (from `nasi118/AI-Tax`, since switched
  from xAI to Anthropic) that proxy the workbench's AI features (`/api/grok`
  — kept as a compatibility path — and `/api/ai/*`) to the Claude API
  (`claude-opus-5`). They require an `ANTHROPIC_API_KEY` environment variable
  set in the Vercel project — the key never appears in browser code or this
  repository. On static hosting (GitHub Pages) these endpoints 404 and the
  workbench's AI panels simply report the service as unavailable; everything
  else works.
- `js/scenarios.js` — the **scenario registry**: the data model, the built-in
  scenario library, the loader, custom (user-saved) scenarios, and the library
  UI. To add a new built-in scenario, append one object to
  `BUILT_IN_SCENARIOS` — nothing else needs to change. The client switcher,
  the library grid, the 1040 Planner comparison, the dashboard, the Client
  Report and the recalculation service all read from that array. Only `id`, `name` and
  `business.netIncome` are required; every other field is defaulted by
  `normalizeScenario()`. Map a new calculator input by adding one row to
  `SCENARIO_FIELD_MAP` rather than writing another assignment.
- `js/planner-bridge.js` — the **Scenarios tab ↔ 1040 Planner bridge**. Maps a
  registry scenario's facts onto the planner's input schema (Schedule C for a
  sole proprietor; W-2 reasonable compensation plus K-1 ordinary income for an
  S-Corporation, with SSTB status and W-2/UBIA facts carried into §199A),
  pushes the selection into the frame, and renders the engine's results. It
  computes no tax of its own, and records every modeling assumption it makes on
  the scenario it sends. Scenarios it pushes carry a `hostId`, so re-importing
  never disturbs scenarios the user built inside the planner.
- `js/sections.js` / `js/app.js` — additional planning sections (clients, what-if planner, quarterly payments, documents, deadlines, state tax, client report) and their markup
- `js/trust-sections.js` / `js/trust-app.js` — the Trusts & Estates module (trust classification, Form 1041, GST, fiduciary reference) and its markup

Tailwind, Chart.js, marked, and SheetJS are loaded from CDN; there's no
backend — all client data lives in `localStorage` (the `api/` AI proxy above
is the one optional serverless piece).

The third component of `nasi118/AI-Tax` — the **`ai_tax`** audit-grade Python
tax engine and Tax Planning Analyst agent — cannot run on static hosting, so
it is surfaced as the "ai_tax Engine (Python) ↗" link in the Planning nav
group rather than embedded.

## AI Tax Strategist

The AI Strategist section talks to Claude through the same secure server-side
proxy as the workbench (`/api/grok`, needs `ANTHROPIC_API_KEY` on the Vercel
project) — no key in the browser. On static hosting, or when the proxy is
unconfigured, it falls back to a bring-your-own Anthropic key pasted into the
config panel (kept in this browser's `localStorage` only and sent directly to
Anthropic, never through our servers).

---

**Ownership Notice:** The proprietary software, workflows, methodologies, original tax scenarios, documentation, and related materials in this project are © 2026 AI Tax Strategy Advisors. All Rights Reserved. Third-party and public-domain materials retain their respective ownership status. See `NOTICE.md`.

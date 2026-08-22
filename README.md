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
  engine, UI, and vendored libraries — see `planner/README.md`). Embedded in
  the main app as the "1040 Planner (TY2026)" section in the Planning nav
  group, and also usable standalone at `planner/`.
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

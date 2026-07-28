# Tax Planner — Individual 1040 (TY2026)

A standalone Form 1040 planning workbench for tax year 2026, rebuilt as clean,
dependency-vendored static source from the compiled reference app
(`Tax_Planner___Individual_1040_TY2026`). No build step: serve this directory
(or the repo root) statically and open `index.html`.

## What it does

- **Planner** — a full Form 1040 build-up (wages, interest/dividends,
  Schedule C, Schedule E with §469 passive-loss limitation, Schedule D with
  0/15/20/25/28% preference bands, other income incl. Social Security
  taxability, above-the-line planning deductions, standard vs. itemized with
  the 2026 SALT cap phase-down and the OBBBA 2/37 haircut, §199A QBI with
  SSTB phase-out and W-2/UBIA limits, AMT (estimated), NIIT, Additional
  Medicare, CTC/ODC, and the §6654 estimated-tax safe harbor). Every line has
  an authority citation, a completeness status, and a calculation-detail
  drawer.
- **Report** — a print-ready client deliverable (browser print → PDF).
- **Scenarios** — create/duplicate/rename/delete scenarios and compare 2–4
  side by side with deltas vs. baseline and an input diff.
- **Coverage** — an honest matrix of what is implemented, partial, estimated,
  or out of scope.
- **Import/Export** — round-trippable Excel workbook (ExcelJS), project JSON,
  and a deterministic client-notes parser (fixed regex list, no AI, no
  network).

## Structure

- `index.html` — shell, Tailwind config, custom component CSS
- `js/engine.js` — the TY2026 tax engine (decimal.js, precision 40); exposes
  `window.TaxEngine`
- `js/app.js` — the UI (vanilla JS, no framework); state persists to
  `localStorage` under `tax-planner-project-v1`
- `js/excel.js` — Excel workbook build/parse; exposes `window.TaxExcel`
- `vendor/` — vendored `tailwindcss` (play CDN build), `decimal.js`, and
  `exceljs` so the app works fully offline

## Parameters & authority

2026 parameters follow Rev. Proc. 2025-32 and P.L. 119-21 (OBBBA) as encoded
in the reference app (`js/engine.js` → `PARAMS` / `PARAM_AUTHORITIES`).
Planning estimates only — not a filed return and not tax advice.

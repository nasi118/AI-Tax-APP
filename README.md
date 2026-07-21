# Tax Advisory Pro

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
- `js/sections.js` / `js/app.js` — additional planning sections (clients, what-if planner, quarterly payments, documents, deadlines, state tax, client report) and their markup
- `js/trust-sections.js` / `js/trust-app.js` — the Trusts & Estates module (trust classification, Form 1041, GST, fiduciary reference) and its markup

Tailwind, Chart.js, marked, and SheetJS are loaded from CDN; there's no
backend — all client data lives in `localStorage`.

## AI Tax Strategist

The AI Strategist section calls an LLM API directly from the browser using a
key the user pastes into the config panel for that session (never persisted,
never shipped in source). Bring your own key.

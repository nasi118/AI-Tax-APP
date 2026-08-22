/* ============================================================================
   CANONICAL RECALCULATION SERVICE — platform shell
   One orchestration service with three scopes (this tab / affected tabs /
   all). Each calculation tab's existing engine function is registered as a
   module here; no tab keeps a separate recalculation implementation and no
   second calculation engine is introduced. Failures are isolated per module,
   every run is recorded, and the identity strip stays visible on every tab.

   The embedded Planning Workbench and 1040 Planner run their own canonical
   recalculation service inside their frames (with the same scope model);
   this service reports that rather than duplicating it.
   ========================================================================== */

/* Module registry. `fns` are resolved by name at run time so load order does
   not matter. `affects` lists downstream shell tabs recomputed by the
   "affected" scope. The Client Profile drives every profile-synced view, so
   it declares the widest dependency set (via refreshClientViews). */
const RECALC_MODULES = [
  { id: "clients", label: "Client Profile", fns: ["refreshClientViews"],
    affects: ["dashboard", "whatif", "state-tax", "quarterly", "client-report"] },
  { id: "dashboard", label: "Dashboard", fns: ["updateDashboard", "renderDashWidgets", "renderPlanningSnapshot"] },
  { id: "tax-comparison", label: "Tax Year Comparison", fns: ["calcTaxComparison"] },
  { id: "schedule-1", label: "Schedule 1", fns: ["calcSchedule1"] },
  { id: "schedule-a", label: "Schedule A", fns: ["calcScheduleA"] },
  { id: "schedule-c", label: "Schedule C", fns: ["calcScheduleC"] },
  { id: "schedule-e", label: "Schedule E — Rental", fns: ["calcRealEstate"] },
  { id: "investment-income", label: "Investment Income", fns: ["calcInvestmentIncome", "calcWinthrop"] },
  { id: "entity-strategy", label: "Entity & S-Corp", fns: ["calcScorp"] },
  { id: "retirement", label: "Retirement", fns: ["calcRetirement"] },
  { id: "home-office", label: "Home Office", fns: ["calcHomeOffice"] },
  { id: "vehicle", label: "Vehicle Expenses", fns: ["calcVehicle"] },
  { id: "whatif", label: "What-If Planner", fns: ["calcWhatIf"] },
  { id: "state-tax", label: "State Tax", fns: ["calcStateSection"] },
  { id: "quarterly", label: "Quarterly Payments", fns: ["renderQuarterly"] },
  { id: "year-end", label: "Year-End Planning", fns: ["calcEstTax", "calcEstate"] },
  { id: "trust-center", label: "Trust Classification", fns: ["classifyTrust"] },
  { id: "form-1041", label: "Form 1041", fns: ["calc1041"] },
  { id: "gst", label: "GST Planner", fns: ["calcGST"] },
  { id: "client-report", label: "Client Report", fns: ["renderReportOpts", "renderReport"] }
];
/* Tabs whose calculations run inside an embedded app with its own service */
const RECALC_EMBEDDED = { "workbench": "Planning Workbench", "planner-1040": "1040 Planner" };

const RECALC_RULES_LABEL = "OBBBA 2025 · TY2026 limits";
const RECALC_ENGINE_LABEL = "shell engine v2026.2";
const RECALC_LOG_KEY = "tap-recalc-log";
let RECALC_RUNNING = false;

function recalcActiveSectionId() {
  const active = document.querySelector(".content-section.active");
  return active ? active.id.replace(/^section-/, "") : null;
}

function recalcRunModule(mod) {
  /* Run one module's registered functions; any throw is caught by the
     orchestrator so later modules still run and the prior rendered values
     (last known valid output) remain on screen. */
  mod.fns.forEach(name => {
    const f = window[name];
    if (typeof f !== "function") return; // optional sub-function not present
    if (name === "renderQuarterly") f(false);
    else f();
  });
}

function recalcLog(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(RECALC_LOG_KEY) || "[]");
    log.push(entry);
    localStorage.setItem(RECALC_LOG_KEY, JSON.stringify(log.slice(-200)));
  } catch (e) { /* private browsing: the visible strip still reports the run */ }
}

function recalcRun(scope) {
  if (RECALC_RUNNING) return; // concurrency / double-click guard
  const btn = document.getElementById("recalc-btn");
  const activeId = recalcActiveSectionId();

  /* 1. Stage current edits: commit the focused input so its onchange fires */
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

  /* 2. Validate the active client context */
  const client = typeof activeClient === "function" ? activeClient() : null;
  if (!client) {
    recalcStrip({ ok: false, message: "No active client — select a client before recalculating" });
    return;
  }

  /* 3–5. Determine scope and run modules in dependency order (Client Profile
     first, since profile-synced views read from it) */
  let mods;
  if (scope === "tab") {
    mods = RECALC_MODULES.filter(m => m.id === activeId);
  } else if (scope === "affected") {
    const ids = new Set(activeId ? [activeId] : []);
    RECALC_MODULES.forEach(m => {
      if (m.id === activeId) (m.affects || []).forEach(x => ids.add(x));
    });
    mods = RECALC_MODULES.filter(m => ids.has(m.id));
  } else {
    mods = RECALC_MODULES.slice();
  }
  mods.sort((a, b) => (a.id === "clients" ? -1 : 0) - (b.id === "clients" ? -1 : 0));

  const embedded = scope === "tab" && RECALC_EMBEDDED[activeId];
  if (embedded) {
    recalcStrip({
      ok: true, client, at: new Date(),
      message: embedded + " recalculates inside its own workspace — use the Recalculate control in that view (same orchestration model)"
    });
    return;
  }
  if (!mods.length) {
    recalcStrip({ ok: true, client, at: new Date(), message: "This tab has no shell-side calculations" });
    return;
  }

  RECALC_RUNNING = true;
  if (btn) { btn.disabled = true; btn.textContent = "Recalculating…"; }

  /* Yield one frame so the progress state paints before the synchronous run */
  setTimeout(() => {
    const failures = [];
    mods.forEach(mod => {
      try {
        recalcRunModule(mod);
      } catch (err) {
        /* 12. Isolate: keep the last rendered values, report, continue */
        failures.push({ module: mod.label, error: String(err && err.message || err) });
      }
    });
    const at = new Date();
    recalcStrip({ ok: failures.length === 0, client, at, failures, scope, count: mods.length });
    recalcLog({
      ts: at.getTime(), tsLabel: at.toLocaleString(), scope,
      clientId: client.id, client: client.name,
      modules: mods.map(m => m.id), failures
    });
    if (typeof showToast === "function") {
      showToast(failures.length
        ? "Recalculation finished with " + failures.length + " module failure" + (failures.length === 1 ? "" : "s")
        : "Recalculated " + mods.length + " module" + (mods.length === 1 ? "" : "s") + " ✓");
    }
    RECALC_RUNNING = false;
    if (btn) { btn.disabled = false; btn.textContent = "⟳ Recalculate"; }
  }, 30);
}

/* Always-visible calculation identity strip under the top bar */
function recalcStrip(state) {
  const el = document.getElementById("recalc-strip");
  if (!el) return;
  const parts = [];
  if (state.at) parts.push("Calc " + state.at.toLocaleTimeString());
  parts.push(RECALC_ENGINE_LABEL);
  parts.push(RECALC_RULES_LABEL);
  if (state.client) parts.push("Client: " + state.client.name);
  if (state.message) parts.push(state.message);
  else if (state.failures && state.failures.length) {
    parts.push("⚠ " + state.failures.length + " module failure" + (state.failures.length === 1 ? "" : "s") + " — showing last valid figures");
  } else if (state.count != null) {
    parts.push("✓ " + state.count + " module" + (state.count === 1 ? "" : "s") + " current (" + state.scope + ")");
  } else {
    parts.push("✓ live recalculation on input");
  }
  el.innerHTML = "";
  parts.forEach(p => {
    const span = document.createElement("span");
    span.textContent = p;
    el.appendChild(span);
  });
  el.className = "recalc-strip " + (state.ok === false ? "bad" : "ok");
  if (state.failures && state.failures.length) {
    el.title = state.failures.map(f => f.module + ": " + f.error).join("\n");
  } else {
    el.removeAttribute("title");
  }
}

/* Inject the header controls and the strip once the DOM is ready */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("#main-content header");
  if (!header) return;
  const right = header.querySelector(".flex.items-center.gap-2");
  const wrap = document.createElement("span");
  wrap.className = "recalc-controls";
  wrap.innerHTML =
    '<select id="recalc-scope" class="form-select" aria-label="Recalculation scope" ' +
    'title="Recalculate this tab, the tabs affected by it, or every calculation module" ' +
    'style="width:auto;font-size:11px;padding:3px 22px 3px 8px;">' +
    '<option value="tab">This tab</option>' +
    '<option value="affected" selected>Affected tabs</option>' +
    '<option value="all">All</option></select>';
  const btn = document.createElement("button");
  btn.id = "recalc-btn";
  btn.type = "button";
  btn.textContent = "⟳ Recalculate";
  btn.title = "Stage edits, validate the active client, re-run the calculation modules in dependency order, refresh every affected view, and record the run";
  btn.className = "text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 px-2.5 py-1 rounded-md transition-colors";
  btn.addEventListener("click", () => {
    const sel = document.getElementById("recalc-scope");
    recalcRun(sel ? sel.value : "affected");
  });
  wrap.appendChild(btn);
  if (right) right.insertBefore(wrap, right.firstChild);

  const strip = document.createElement("div");
  strip.id = "recalc-strip";
  strip.setAttribute("role", "status");
  header.insertAdjacentElement("afterend", strip);
  recalcStrip({ ok: true, client: typeof activeClient === "function" ? activeClient() : null });
});

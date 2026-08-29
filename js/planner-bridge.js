/* ============================================================================
   SCENARIOS TAB ↔ 1040 PLANNER BRIDGE
   ============================================================================

   The Scenarios tab hosts the 1040 Planner (TY2026) module, which replaced the
   static side-by-side attribute table that used to live here. The planner runs
   in an iframe (planner/index.html) and owns every calculation: this file only
   translates scenario FACTS from the library registry (js/scenarios.js) into
   the planner's input schema, pushes them across, and renders the numbers the
   planner's engine sends back.

   Nothing in this file computes tax. If a figure appears on screen it came out
   of window.TaxEngine inside the planner frame.

   MAPPING NOTES (registry scenario → planner inputs)
   -------------------------------------------------
   · Sole proprietor / partnership — one `businesses` entry. The registry's
     netIncome is authoritative, so expenses are derived as
     grossRevenue − netIncome; SE tax and §199A then follow from it.
   · S-Corporation — reasonable compensation becomes a `wages` entry (payroll
     taxes withheld at the statutory employee rates) and the remaining profit
     becomes a `k1Ordinary` other-income entry, which is not subject to SE tax
     but does carry the business's SSTB status and W-2 wage / UBIA facts into
     the §199A computation.
   · C-Corporation — only the shareholder's own W-2 compensation reaches the
     1040; retained corporate profit does not, and is left out with a note.
   · Investment income is split into interest and qualified dividends on the
     registry's stated 50/50 planning convention; rentals use the registry's
     net figure with depreciation stated separately.

   Every mapped scenario carries a description recording these assumptions so a
   preparer reading the planner can see what was assumed and what was not.
   ========================================================================== */

/* The planner's own TY2026 parameters are the source of truth. These fallbacks
   are only used if the mapping runs before the frame's engine is reachable;
   they mirror planner/js/engine.js PARAMS (Rev. Proc. 2025-32 / SSA 2026). */
const PLANNER_PARAM_FALLBACK = {
  socialSecurityWageBase: 184500,
  ssRateEmployee: 0.062,
  medicareRateEmployee: 0.0145
};

const PLANNER_FRAME_ID = 'scenarios-frame';
const PLANNER_FRAME_SRC = 'planner/index.html';

/* Live engine-computed summaries, most recently received from the planner. */
let PLANNER_SUMMARIES = [];
let PLANNER_LAST_ERROR = '';

function plannerFrame() {
  return document.getElementById(PLANNER_FRAME_ID);
}

/* The planner's bridge API, or null while the frame is still loading. Same
   origin, so the direct handle is available; postMessage stays the fallback. */
function plannerApi() {
  const f = plannerFrame();
  try {
    return f && f.contentWindow && f.contentWindow.TaxPlannerHost ? f.contentWindow.TaxPlannerHost : null;
  } catch (e) {
    return null;
  }
}

function plannerParams() {
  const f = plannerFrame();
  try {
    const p = f && f.contentWindow && f.contentWindow.TaxEngine && f.contentWindow.TaxEngine.PARAMS;
    if (p && typeof p.socialSecurityWageBase === 'number') return p;
  } catch (e) { /* frame not ready */ }
  return PLANNER_PARAM_FALLBACK;
}

function pbNum(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function pbId(prefix, key) {
  return prefix + '-' + String(key).replace(/[^a-z0-9]+/gi, '').slice(0, 12);
}

/* ---------------------------------------------------------------------------
   FACT MAPPING — registry scenario → planner inputs.
   Pure: same scenario in, same inputs out. Exposed for the acceptance tests.
   ------------------------------------------------------------------------- */
function plannerInputsFromScenario(s) {
  if (!s || typeof s !== 'object') throw new Error('plannerInputsFromScenario needs a scenario object.');
  const P = plannerParams();
  const biz = s.business || {};
  const comp = s.compensation || {};
  const other = s.otherIncome || {};
  const entity = s.entityType || 'sole';
  const isScorp = entity === 'scorp';
  const isCcorp = entity === 'ccorp';

  const netIncome = pbNum(biz.netIncome);
  const grossRevenue = pbNum(biz.grossRevenue);
  const notes = [];

  /* ---- profile ---- */
  const filingStatus = ['single', 'mfj', 'mfs', 'hoh', 'qss'].includes(s.filingStatus) ? s.filingStatus : 'single';
  const age = pbNum(s.age) || 45;
  const profile = {
    filingStatus: filingStatus,
    taxpayerAge: age,
    /* The registry carries one age; for a joint return the spouse is modeled at
       the same age, which only matters for the additional standard deduction. */
    spouseAge: filingStatus === 'mfj' ? age : null,
    dependentsUnder17: 0,
    otherDependents: 0,
    blindTaxpayer: false,
    blindSpouse: false,
    state: typeof s.state === 'string' ? s.state : ''
  };

  /* ---- wages ---- */
  const wages = [];
  function addWage(employer, amount, key) {
    if (!(amount > 0)) return;
    const ssWages = Math.min(amount, P.socialSecurityWageBase);
    wages.push({
      id: pbId('wage', key),
      employer: employer,
      wages: amount,
      /* Withholding is modeled at the statutory FICA rates. Federal income tax
         withholding is left at zero: the registry states no W-4 position, and
         guessing one would move the balance due without any factual basis. */
      federalWithholding: 0,
      socialSecurityWages: ssWages,
      medicareWages: amount,
      socialSecurityWithheld: Math.round(ssWages * P.ssRateEmployee * 100) / 100,
      medicareWithheld: Math.round(amount * P.medicareRateEmployee * 100) / 100,
      retirementDeferral: 0,
      hsa: 0
    });
  }
  addWage(s.name ? s.name + ' — household W-2' : 'Household W-2', pbNum(other.w2Wages), 'w2');
  addWage('Spouse W-2', pbNum(other.spouseW2), 'spousew2');

  /* ---- the business itself ---- */
  const businesses = [];
  const otherIncome = [];

  if (isScorp) {
    const salary = Math.min(pbNum(comp.reasonableComp), Math.max(0, netIncome));
    const passthrough = Math.round((netIncome - salary) * 100) / 100;
    addWage((s.name || 'S-Corporation') + ' — reasonable compensation', salary, 'scorpsalary');
    if (passthrough !== 0) {
      otherIncome.push({
        id: pbId('k1', s.id || 'scorp'),
        description: (s.profession || s.name || 'S-Corporation') + ' — K-1 ordinary income',
        kind: 'k1Ordinary',
        amount: passthrough,
        /* Carried through to §199A so the SSTB test and the W-2 wage / UBIA
           limits apply to the passthrough, not just to Schedule C income. */
        isSSTB: biz.sstb === true,
        w2Wages: pbNum(biz.w2WagesPaid) || salary,
        ubia: pbNum(biz.ubia),
        isQualifiedTradeOrBusiness: true
      });
    }
    notes.push('S-Corporation: ' + fmtPB(salary) + ' reasonable compensation is modeled as W-2 wages (FICA withheld at statutory rates) and ' +
      fmtPB(passthrough) + ' as K-1 ordinary income — not subject to self-employment tax.');
    if (pbNum(comp.overhead) > 0) {
      notes.push('Payroll and administration overhead of ' + fmtPB(comp.overhead) +
        ' is a corporate-level cost and is assumed already reflected in net income.');
    }
  } else if (isCcorp) {
    addWage((s.name || 'C-Corporation') + ' — officer compensation', pbNum(comp.reasonableComp), 'ccorpsalary');
    notes.push('C-Corporation: only officer compensation reaches Form 1040. Retained corporate profit of ' +
      fmtPB(Math.max(0, netIncome - pbNum(comp.reasonableComp))) + ' is taxed at the entity level and is not modeled here.');
  } else {
    /* Sole proprietor and partnership both land on the individual return as
       self-employment income; netIncome is the authoritative figure, so
       expenses are derived from it rather than summed from the expense detail
       (which the registry states is illustrative and not exhaustive). */
    const gross = grossRevenue >= netIncome && grossRevenue > 0 ? grossRevenue : Math.max(0, netIncome);
    businesses.push({
      id: pbId('biz', s.id || 'schedc'),
      name: (s.profession || s.name || 'Schedule C business'),
      grossReceipts: gross,
      expenses: Math.round(Math.max(0, gross - netIncome) * 100) / 100,
      isSSTB: biz.sstb === true,
      w2Wages: pbNum(biz.w2WagesPaid),
      unadjustedBasis: pbNum(biz.ubia),
      materialParticipation: true
    });
    if (entity === 'partnership') {
      notes.push('Partnership interest is modeled as self-employment income on Schedule C, which matches a general partner\'s SE tax treatment under IRC §1402(a).');
    }
  }

  /* ---- interest & dividends ----
     The registry states a single "investment income" figure. Splitting it
     evenly between taxable interest and qualified dividends is the app's
     stated planning convention; it is disclosed in the scenario note because
     it changes both the preferential-rate stack and NIIT. */
  const interestDividends = [];
  const investment = pbNum(other.investment);
  if (investment > 0) {
    const half = Math.round(investment * 50) / 100;
    /* The engine's line 3b is the sum of the ordinaryDividend and
       qualifiedDividend entries — an ordinaryDividend entry holds only the
       NON-qualified portion. Modeling the dividend half as fully qualified
       therefore needs one qualifiedDividend entry and no ordinary entry. */
    interestDividends.push(
      { id: pbId('int', s.id || 'inv'), payer: 'Portfolio interest', kind: 'interest', amount: half, federalWithholding: 0 },
      { id: pbId('qd', s.id || 'inv'), payer: 'Portfolio dividends', kind: 'qualifiedDividend', amount: investment - half, federalWithholding: 0 }
    );
    notes.push('Investment income of ' + fmtPB(investment) + ' is split 50/50 between taxable interest and qualified dividends — a planning convention, not a stated fact.');
  }

  /* ---- rentals ----
     The registry's rental figure is net of operating expenses but stated
     before depreciation, so it is carried as rents with depreciation zero and
     the assumption disclosed. */
  const rentals = [];
  const rental = pbNum(other.rental);
  if (rental !== 0) {
    rentals.push({
      id: pbId('rent', s.id || 'rental'),
      property: 'Rental portfolio',
      rents: rental,
      expenses: 0,
      depreciation: 0,
      activelyParticipates: true,
      isQualifiedTradeOrBusiness: (s.flags || {}).realEstatePro === true
    });
    notes.push('Rental income of ' + fmtPB(rental) + ' is stated net of operating expenses; no separate depreciation is modeled.');
  }

  /* ---- capital gains ---- */
  const capitalGains = [];
  const gains = pbNum(other.capitalGains);
  if (gains !== 0) {
    capitalGains.push({
      id: pbId('cg', s.id || 'gains'),
      description: 'Net long-term capital gains',
      shortTermGain: 0,
      longTermGain: gains,
      section1250Gain: 0,
      collectiblesGain: 0
    });
    notes.push('Capital gains of ' + fmtPB(gains) + ' are modeled as long-term; holding periods are not stated in the scenario.');
  }

  /* ---- retirement contribution ----
     Only a self-employed plan contribution is an above-the-line deduction on
     Form 1040 (Schedule 1). Inside a corporation the employer contribution is
     an entity-level deduction that reaches the shareholder through the K-1 and
     an elective deferral reduces W-2 wages — neither is a 1040 adjustment — so
     for those entities the contribution is disclosed rather than deducted. */
  const planningStrategies = [];
  const ret = s.retirement || {};
  const contribution = pbNum(ret.currentContribution);
  if (contribution > 0) {
    if (isScorp || isCcorp) {
      notes.push((ret.currentPlan || 'Retirement plan') + ' contribution of ' + fmtPB(contribution) +
        ' is a corporate-level deduction, assumed already reflected in the stated compensation and net income; ' +
        'model a specific deferral or employer split in the planner’s Planning Strategies drawer.');
    } else {
      planningStrategies.push({
        id: pbId('ret', s.id || 'plan'),
        label: (ret.currentPlan || 'Retirement plan') + ' contribution',
        kind: 'solo401k',
        amount: contribution,
        enabled: true,
        note: 'Self-employed plan contribution carried from the scenario library (Schedule 1 adjustment).'
      });
    }
  }

  return {
    inputs: {
      profile: profile,
      wages: wages,
      interestDividends: interestDividends,
      businesses: businesses,
      rentals: rentals,
      capitalGains: capitalGains,
      otherIncome: otherIncome,
      /* The registry states no Schedule A detail, so the planner starts from
         the standard deduction and the preparer adds itemized amounts there. */
      itemizedDeductions: {
        medical: 0, stateLocalIncomeTax: 0, realEstateTax: 0, personalPropertyTax: 0,
        mortgageInterest: 0, investmentInterest: 0, charitableCash: 0, charitableNonCash: 0, other: 0
      },
      planningStrategies: planningStrategies,
      payments: {
        federalWithholdingOther: 0, estimatedPayments: [0, 0, 0, 0],
        priorYearOverpayment: 0, priorYearTax: 0, priorYearAgi: 0,
        extensionPayment: 0, refundableCredits: 0
      }
    },
    notes: notes
  };
}

function fmtPB(v) {
  return '$' + Math.round(pbNum(v)).toLocaleString();
}

/* Scenario objects in the shape the planner's host bridge accepts. */
function plannerScenariosFromLibrary(list) {
  return list.map(s => {
    const mapped = plannerInputsFromScenario(s);
    return {
      hostId: s.id,
      name: s.name,
      description: [
        (s.profession ? s.profession + ' · ' : '') + (s.entityLabel || '') + ' · ' + (s.state || ''),
        'Mapped from the Scenario Library. ' + mapped.notes.join(' ')
      ].join(' — '),
      inputs: mapped.inputs
    };
  });
}

/* ---------------------------------------------------------------------------
   PUSH / PULL
   ------------------------------------------------------------------------- */

/* Which library scenarios to model. Falls back to the loaded scenario so the
   planner is never empty, and caps at four — the planner's comparison view
   takes 2–4 columns and more than that stops being readable. */
function plannerSelection() {
  const all = typeof allScenarios === 'function' ? allScenarios() : [];
  if (!all.length) return [];
  const picked = (typeof comparisonSelection === 'function' ? comparisonSelection() : [])
    .map(id => all.find(x => x.id === id))
    .filter(Boolean);
  if (picked.length) return picked.slice(0, 4);
  const active = typeof ACTIVE_SCENARIO !== 'undefined' && ACTIVE_SCENARIO
    ? all.find(x => x.id === ACTIVE_SCENARIO.id)
    : null;
  return [active || all[0]];
}

/* Send the current selection into the planner. Returns true when it reached
   the frame; false while the frame is still booting (the ready handshake
   retries it). */
function sendScenariosToPlanner(opts) {
  const api = plannerApi();
  if (!api) return false;
  const selection = plannerSelection();
  if (!selection.length) return false;
  try {
    PLANNER_LAST_ERROR = '';
    PLANNER_SUMMARIES = api.importScenarios(plannerScenariosFromLibrary(selection), opts || {});
    renderPlannerComparison();
    return true;
  } catch (e) {
    PLANNER_LAST_ERROR = String(e && e.message ? e.message : e);
    renderPlannerComparison();
    return false;
  }
}

function refreshPlannerSummaries() {
  const api = plannerApi();
  if (!api) return false;
  try {
    PLANNER_SUMMARIES = api.summaries();
    renderPlannerComparison();
    return true;
  } catch (e) {
    return false;
  }
}

/* The planner posts `ready` once its engine has run, and `summaries` after
   every state change, so the host panel tracks the engine without polling. */
window.addEventListener('message', e => {
  const msg = e.data;
  if (!msg || typeof msg !== 'object' || msg.source !== 'tax-planner-1040') return;
  if (msg.type === 'ready') {
    PLANNER_SUMMARIES = Array.isArray(msg.summaries) ? msg.summaries : [];
    /* First boot: seed the planner with whatever the library has selected. */
    sendScenariosToPlanner();
  } else if (msg.type === 'summaries') {
    PLANNER_SUMMARIES = Array.isArray(msg.summaries) ? msg.summaries : [];
    renderPlannerComparison();
  } else if (msg.type === 'error') {
    PLANNER_LAST_ERROR = String(msg.message || 'The planner rejected the scenarios.');
    renderPlannerComparison();
  }
});

/* ---------------------------------------------------------------------------
   VIEW SWITCHING — the tab holds the planner and the library side by side.
   ------------------------------------------------------------------------- */
const SCENARIO_VIEW_KEY = 'tap-scenarios-view';

function scenarioView() {
  try {
    const v = localStorage.getItem(SCENARIO_VIEW_KEY);
    if (v === 'planner' || v === 'library') return v;
  } catch (e) { /* private mode */ }
  return 'planner';
}

function showScenarioView(view) {
  const v = view === 'library' ? 'library' : 'planner';
  try { localStorage.setItem(SCENARIO_VIEW_KEY, v); } catch (e) { /* private mode */ }
  const planner = document.getElementById('scenarios-view-planner');
  const library = document.getElementById('scenarios-view-library');
  if (planner) planner.style.display = v === 'planner' ? 'flex' : 'none';
  if (library) library.style.display = v === 'library' ? 'block' : 'none';
  ['planner', 'library'].forEach(k => {
    const btn = document.getElementById('scenarios-viewbtn-' + k);
    if (!btn) return;
    const on = k === v;
    btn.className = on
      ? 'px-3 py-1.5 text-xs font-semibold rounded-md border border-blue-200 bg-blue-50 text-blue-700'
      : 'px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50';
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  /* Only fetch the planner once the tab is actually on screen — switching
     views before that just records the preference. */
  const section = document.getElementById('section-scenarios');
  if (v === 'planner' && section && section.classList.contains('active')) ensurePlannerFrame();
  return v;
}

/* The planner is lazy-loaded: the first time the Scenarios tab shows it, the
   iframe gets its src and the ready handshake seeds it with the selection. */
function ensurePlannerFrame() {
  const f = plannerFrame();
  if (f && !f.getAttribute('src')) f.src = PLANNER_FRAME_SRC;
  return f;
}

/* ---------------------------------------------------------------------------
   ENGINE-COMPUTED COMPARISON — what replaced the static attribute table.
   Every figure here is produced by the planner's TY2026 engine.
   ------------------------------------------------------------------------- */
function renderPlannerComparison() {
  const host = document.getElementById('scenario-compare');
  const strip = document.getElementById('scenarios-engine-strip');
  const rows = PLANNER_SUMMARIES || [];

  if (strip) {
    strip.textContent = PLANNER_LAST_ERROR
      ? 'Planner: ' + PLANNER_LAST_ERROR
      : rows.length
        ? rows.length + ' scenario' + (rows.length === 1 ? '' : 's') + ' modeled · lowest total tax ' +
          fmtPB(Math.min.apply(null, rows.map(r => pbNum(r.totalTax))))
        : 'Loading the 1040 Planner…';
  }
  if (!host) return;

  if (PLANNER_LAST_ERROR) {
    host.innerHTML = '<p class="text-sm text-red-600">The planner could not model the selection: ' +
      escPB(PLANNER_LAST_ERROR) + '</p>';
    return;
  }
  if (!rows.length) {
    host.innerHTML = '<p class="text-sm text-slate-500">Open the 1040 Planner view to model the selected scenarios. ' +
      'Tick “Include in comparison” on any card to change what is modeled.</p>';
    return;
  }

  const base = rows[0];
  const cells = [
    ['AGI', r => fmtPB(r.agi)],
    ['Taxable income', r => fmtPB(r.taxableIncome)],
    ['QBI deduction', r => fmtPB(r.qbiDeduction)],
    ['Self-employment tax', r => fmtPB(r.seTax)],
    ['Total tax', r => fmtPB(r.totalTax)],
    ['Δ vs. ' + base.name, r => (r.id === base.id ? '—' : signedPB(r.totalTax - base.totalTax))],
    ['Effective rate', r => pctPB(r.effectiveRate)],
    ['Marginal rate', r => pctPB(r.marginalRate)]
  ];

  host.innerHTML =
    '<div class="overflow-x-auto"><table class="ttable"><thead><tr><th class="whitespace-nowrap">Engine result (TY2026)</th>' +
    rows.map(r => '<th class="whitespace-nowrap">' + escPB(r.name) + (r.hostId ? '' : ' <span class="text-slate-400 font-normal">(planner)</span>') + '</th>').join('') +
    '</tr></thead><tbody>' +
    cells.map(([label, get]) =>
      '<tr><td class="font-semibold text-slate-600 whitespace-nowrap">' + escPB(label) + '</td>' +
      rows.map(r => { let v; try { v = get(r); } catch (e) { v = '—'; } return '<td>' + escPB(v) + '</td>'; }).join('') +
      '</tr>').join('') +
    '</tbody></table></div>' +
    '<p class="text-xs text-slate-400 mt-2">Computed by the 1040 Planner engine (Rev. Proc. 2025-32 · P.L. 119-21). ' +
    'Open the planner view for the full Form 1040 build-up, line authorities and what-if scenarios.</p>';
}

function signedPB(v) {
  const n = pbNum(v);
  if (Math.round(n) === 0) return '—';
  return (n > 0 ? '+' : '−') + '$' + Math.abs(Math.round(n)).toLocaleString();
}
function pctPB(v) {
  const n = pbNum(v);
  /* The engine reports rates as fractions. */
  return (n * 100).toFixed(1) + '%';
}
function escPB(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Recalculation service hook: re-push the selection and re-read the engine. */
function recalcScenariosPlanner() {
  if (!sendScenariosToPlanner()) refreshPlannerSummaries();
}

document.addEventListener('DOMContentLoaded', () => {
  showScenarioView(scenarioView());
  renderPlannerComparison();
});

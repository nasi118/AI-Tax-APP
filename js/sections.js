// v2-sections.js — injects the new v2 sections into the content wrapper
(function(){
const wrap = document.querySelector('#main-content > .px-8');
if(!wrap) return;
wrap.insertAdjacentHTML('beforeend', `
<!-- SECTION: CLIENTS -->
<div id="section-clients" class="content-section">
<div class="mb-6 flex items-end justify-between">
<div><h1 class="text-2xl font-extrabold text-slate-900">Clients</h1>
<p class="text-slate-500 text-sm mt-1">Manage client profiles — switch the active client to drive every calculator and report</p></div>
<button onclick="exportToExcel()" class="px-4 py-2.5 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"></path></svg>Export to Excel</button>
<button onclick="clearAppData()" class="px-4 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold text-sm hover:border-red-300 hover:text-red-700 transition-colors">Clear data</button>
</div>
<div id="clients-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6"></div>
<div class="card" style="max-width:720px;">
<h3 class="font-bold text-slate-800 mb-4">Add a Client</h3>
<div class="grid grid-cols-2 gap-4">
<div class="col-span-2"><label class="form-label">Full Name</label><input class="form-input" id="nc-name" placeholder="e.g. Jordan Lee, DPT"></div>
<div><label class="form-label">Occupation</label><input class="form-input" id="nc-occupation" placeholder="Physical Therapist"></div>
<div><label class="form-label">Age</label><input class="form-input" id="nc-age" type="number" value="45"></div>
<div><label class="form-label">Filing Status</label><select class="form-select" id="nc-filing"><option value="single">Single</option><option value="mfj">Married Filing Jointly</option></select></div>
<div><label class="form-label">State</label><select class="form-select" id="nc-state"></select></div>
<div><label class="form-label">Net Business Income</label><input class="form-input" id="nc-income" type="number" value="120000"></div>
<div><label class="form-label">Investment Income</label><input class="form-input" id="nc-invest" type="number" value="0"></div>
<div><label class="form-label">Rental Income (gross)</label><input class="form-input" id="nc-rental" type="number" value="0"></div>
<div><label class="form-label">Business Miles / Year</label><input class="form-input" id="nc-miles" type="number" value="8000"></div>
</div>
<div class="flex items-center gap-3 mt-5">
<button onclick="addClient()" class="px-5 py-2.5 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors">Add Client</button>
<span class="text-xs text-slate-400">Clients are saved in this browser. Demo clients can't be deleted.</span>
</div>
</div>
</div>

<!-- SECTION: WHAT-IF PLANNER -->
<div id="section-whatif" class="content-section">
<div class="mb-6 flex items-start justify-between gap-4"><div><h1 class="text-2xl font-extrabold text-slate-900">What-If Planner</h1>
<p class="text-slate-500 text-sm mt-1">Drag the levers and watch the total tax picture respond — federal, SE/FICA, and state combined</p></div><button onclick="calcWhatIf()" class="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Recalculate</button></div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="lg:col-span-1 space-y-4">
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Income &amp; Situation</h3>
<div class="space-y-5">
<div><label class="form-label">Net Business Income: <span class="text-blue-700 font-bold" id="wi-income-label">$145,000</span></label>
<input type="range" id="wi-income" min="30000" max="600000" step="5000" value="145000" oninput="calcWhatIf()"></div>
<div><label class="form-label">Filing Status</label><select class="form-select" id="wi-filing" onchange="calcWhatIf()"><option value="single">Single</option><option value="mfj">Married Filing Jointly</option></select></div>
<div><label class="form-label">State</label><select class="form-select" id="wi-state" onchange="calcWhatIf()"></select></div>
</div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Strategy Levers</h3>
<div class="space-y-5">
<div><label class="form-label">Retirement Contribution: <span class="text-blue-700 font-bold" id="wi-ret-label">$0</span></label>
<input type="range" id="wi-ret" min="0" max="70000" step="500" value="0" oninput="calcWhatIf()">
<div class="text-xs text-slate-400 mt-1">Solo 401(k) / SEP-IRA deductible contribution</div></div>
<label class="flex items-center justify-between cursor-pointer">
<div><div class="text-sm font-semibold text-slate-700">S-Corp Election</div><div class="text-xs text-slate-400">FICA on salary only, not distributions</div></div>
<input type="checkbox" id="wi-scorp" class="accent-blue-700 w-4 h-4" onchange="calcWhatIf()"></label>
<div id="wi-scorp-controls" style="display:none;">
<label class="form-label">Reasonable Compensation: <span class="text-blue-700 font-bold" id="wi-comp-label">30%</span></label>
<input type="range" id="wi-comp" min="25" max="40" value="30" oninput="calcWhatIf()">
</div>
<label class="flex items-center justify-between cursor-pointer">
<div><div class="text-sm font-semibold text-slate-700">Max HSA Contribution</div><div class="text-xs text-slate-400">$4,300 self-only / $8,550 family</div></div>
<input type="checkbox" id="wi-hsa" class="accent-blue-700 w-4 h-4" onchange="calcWhatIf()"></label>
</div>
</div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
<div class="kpi" style="border-left-color:#0b1526;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Tax</div><div class="kpi-value text-slate-900" id="wi-k-total">—</div><div class="text-xs text-slate-400 mt-1">Fed + SE/FICA + state</div></div>
<div class="kpi" style="border-left-color:#475569;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Effective Rate</div><div class="kpi-value text-slate-700" id="wi-k-rate">—</div><div class="text-xs text-slate-400 mt-1">Of net business income</div></div>
<div class="kpi" style="border-left-color:#047857;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Saved vs Baseline</div><div class="kpi-value" style="color:#047857;" id="wi-k-saved">—</div><div class="text-xs text-slate-400 mt-1">No-strategy comparison</div></div>
<div class="kpi" style="border-left-color:#1e40af;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">After-Tax Income</div><div class="kpi-value" style="color:#1e40af;" id="wi-k-net">—</div><div class="text-xs text-slate-400 mt-1">Before living expenses</div></div>
</div>
<div class="card card-chart">
<h3 class="text-sm font-semibold text-slate-700 mb-2">Baseline vs. Your Plan</h3>
<div style="position:relative;height:230px;"><canvas id="chartWhatIf"></canvas></div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Breakdown</h3>
<table class="ttable">
<thead><tr><th>Component</th><th class="text-right">Baseline</th><th class="text-right">Your Plan</th><th class="text-right">Δ</th></tr></thead>
<tbody id="wi-table"></tbody>
</table>
<div class="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-slate-500">Estimates only. Federal uses 2026 brackets, standard deduction and 20% QBI (§199A); state uses simplified rate tables; ignores itemizing, credits and local taxes. S-Corp plan includes ~$3,200/yr overhead.</div>
</div>
</div>
</div>
</div>

<!-- SECTION: QUARTERLY PAYMENTS -->
<div id="section-quarterly" class="content-section">
<div class="mb-6 flex items-start justify-between gap-4"><div><h1 class="text-2xl font-extrabold text-slate-900">Quarterly Estimated Payments</h1>
<p class="text-slate-500 text-sm mt-1">Track 2026 estimated tax payments against the safe harbor — per client, saved in this browser</p></div><button onclick="renderQuarterly()" class="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Recalculate</button></div>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
<div class="kpi" style="border-left-color:#1e3a8a;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Safe Harbor Target</div><div class="kpi-value text-slate-900" id="qt-k-target">—</div><div class="text-xs text-slate-400 mt-1" id="qt-k-target-note">—</div></div>
<div class="kpi" style="border-left-color:#047857;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Paid to Date</div><div class="kpi-value" style="color:#047857;" id="qt-k-paid">—</div><div class="text-xs text-slate-400 mt-1" id="qt-k-paid-note">—</div></div>
<div class="kpi" style="border-left-color:#b45309;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Remaining</div><div class="kpi-value" style="color:#b45309;" id="qt-k-remaining">—</div><div class="text-xs text-slate-400 mt-1">To reach safe harbor</div></div>
<div class="kpi" style="border-left-color:#b91c1c;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Next Due</div><div class="kpi-value text-slate-900" style="font-size:1.25rem;" id="qt-k-next">—</div><div class="text-xs text-slate-400 mt-1" id="qt-k-next-note">—</div></div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="lg:col-span-2 card">
<h3 class="font-bold text-slate-800 mb-4">2026 Payment Schedule</h3>
<table class="ttable"><thead><tr><th>Quarter</th><th>Due Date</th><th class="text-right" style="width:140px;">Amount</th><th class="text-center">Paid</th><th>Status</th></tr></thead>
<tbody id="qt-rows"></tbody></table>
<div class="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800"><strong>Safe harbor (IRC §6654):</strong> no underpayment penalty if timely payments total 100% of prior-year tax (110% if prior AGI &gt; $150k) or 90% of current-year tax, whichever is smaller.</div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Safe Harbor Inputs</h3>
<div class="space-y-3">
<div><label class="form-label">Prior Year Total Tax (2025)</label><input class="form-input" id="qt-prior-tax" type="number" value="35000" oninput="renderQuarterly()"></div>
<div><label class="form-label">Prior Year AGI (2025)</label><input class="form-input" id="qt-prior-agi" type="number" value="148000" oninput="renderQuarterly()"></div>
<div><label class="form-label">Current Year Estimated Tax</label><input class="form-input" id="qt-current-tax" type="number" value="38257" oninput="renderQuarterly()"></div>
</div>
<button onclick="applyEvenSplit()" class="w-full mt-4 py-2.5 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">Split target evenly across quarters</button>
<div class="text-xs text-slate-400 mt-3">Amounts and paid status are stored per client in this browser.</div>
</div>
</div>
</div>

<!-- SECTION: DOCUMENT CHECKLIST -->
<div id="section-documents" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Document Checklist</h1>
<p class="text-slate-500 text-sm mt-1">Track tax-prep documents received from the active client</p></div>
<div class="card mb-5">
<div class="flex items-center justify-between mb-2">
<div class="text-sm font-semibold text-slate-700" id="doc-progress-label">0 of 0 received</div>
<button onclick="copyMissingDocs()" class="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">Copy request list for missing items</button>
</div>
<div class="progress-track"><div class="progress-fill" id="doc-progress-fill" style="width:0%;"></div></div>
</div>
<div id="doc-groups" class="grid grid-cols-1 md:grid-cols-2 gap-5"></div>
</div>

<!-- SECTION: DEADLINE CALENDAR -->
<div id="section-deadlines" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Deadline Calendar</h1>
<p class="text-slate-500 text-sm mt-1">Key federal dates for tax year 2026 — countdowns update daily</p></div>
<div class="flex flex-wrap gap-2 mb-5" id="dl-filters">
<button class="chip active" data-type="all" onclick="filterDeadlines('all',this)">All</button>
<button class="chip" data-type="estimated" onclick="filterDeadlines('estimated',this)">Estimated Taxes</button>
<button class="chip" data-type="filing" onclick="filterDeadlines('filing',this)">Filing</button>
<button class="chip" data-type="retirement" onclick="filterDeadlines('retirement',this)">Retirement</button>
<button class="chip" data-type="payroll" onclick="filterDeadlines('payroll',this)">Payroll</button>
</div>
<div class="card"><div id="dl-list" class="relative pl-6 border-l-2 border-blue-100 space-y-4"></div></div>
</div>

<!-- SECTION: STATE TAX BREAKDOWN -->
<div id="section-state-tax" class="content-section">
<div class="mb-6 flex items-start justify-between gap-4"><div><h1 class="text-2xl font-extrabold text-slate-900">State Tax Breakdown</h1>
<p class="text-slate-500 text-sm mt-1">Estimated state income tax layered on the federal picture — and what a move would change</p></div><button onclick="calcStateSection()" class="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Recalculate</button></div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="card lg:col-span-1">
<h3 class="font-bold text-slate-800 mb-4">Inputs</h3>
<div class="space-y-3">
<div><label class="form-label">State</label><select class="form-select" id="st-state" onchange="calcStateSection()"></select></div>
<div><label class="form-label">Filing Status</label><select class="form-select" id="st-filing" onchange="calcStateSection()"><option value="single">Single</option><option value="mfj">Married Filing Jointly</option></select></div>
<div><label class="form-label">Net Business Income</label><input class="form-input" id="st-income" type="number" value="145000" oninput="calcStateSection()"></div>
</div>
<div class="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
<div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated State Income Tax</div>
<div class="text-3xl font-extrabold mt-1" style="color:#1e40af;font-variant-numeric:tabular-nums;" id="st-result">—</div>
<div class="text-xs text-slate-400 mt-1" id="st-result-note">—</div>
</div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Combined Burden</h3>
<table class="ttable"><thead><tr><th>Component</th><th class="text-right">Amount</th><th class="text-right">% of Income</th></tr></thead>
<tbody id="st-table"></tbody></table>
</div>
<div class="card card-chart">
<h3 class="text-sm font-semibold text-slate-700 mb-2">Same Income, Different State — Total State Tax</h3>
<div style="position:relative;height:220px;"><canvas id="chartStates"></canvas></div>
<div class="text-xs text-slate-400 mt-2">Simplified progressive/flat rate tables; ignores state standard deductions, credits and local/city taxes (e.g. NYC adds up to 3.876%).</div>
</div>
</div>
</div>
</div>

<!-- SECTION: CLIENT REPORT -->
<div id="section-client-report" class="content-section">
<div class="mb-6 flex items-end justify-between no-print">
<div><h1 class="text-2xl font-extrabold text-slate-900">Client Report</h1>
<p class="text-slate-500 text-sm mt-1">A client-ready strategy summary — print or save as PDF to share</p></div>
<button onclick="window.print()" class="px-5 py-2.5 bg-blue-700 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2">
<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
Print / Save PDF</button>
</div>
<div class="card mb-5 no-print">
<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-slate-800">Customize Report</h3><span class="text-xs text-slate-400">Only checked sections appear on screen and in print</span></div>
<div class="flex flex-wrap gap-x-6 gap-y-2" id="report-opts"></div>
</div>
<div class="report-sheet mx-auto" id="report-body"></div>
</div>
`);
})();

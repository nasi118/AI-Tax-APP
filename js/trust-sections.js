// v2-trust-sections.js — Trust & Estate module markup
(function(){
const wrap = document.querySelector('#main-content > .px-8');
if(!wrap) return;
wrap.insertAdjacentHTML('beforeend', `
<!-- SECTION: TRUST CLASSIFICATION -->
<div id="section-trust-center" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Trust Classification</h1>
<p class="text-slate-500 text-sm mt-1">Answer the questions to classify the entity — grantor status (§§671–679), domestic vs. foreign (Reg. §301.7701-7), simple vs. complex — and see the filing consequences</p></div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="space-y-4">
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">1 · Entity</h3>
<div><label class="form-label">Entity type</label><select class="form-select" id="tc-entity" onchange="classifyTrust()">
<option value="trust">Trust</option><option value="estate">Decedent's Estate</option></select></div>
</div>
<div class="card" id="tc-grantor-card">
<h3 class="font-bold text-slate-800 mb-1">2 · Grantor Trust Powers</h3>
<p class="text-xs text-slate-500 mb-3">Check any power retained by the grantor (or spouse). Any one makes it a grantor trust — income reports on the grantor's own 1040.</p>
<div class="space-y-1" id="tc-powers">
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="676"><span class="text-sm"><strong>§676 — Power to revoke.</strong> Trust is revocable (incl. revocable living trusts)</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="677"><span class="text-sm"><strong>§677 — Income for grantor.</strong> Income is or may be paid to grantor or spouse</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="675"><span class="text-sm"><strong>§675 — Administrative powers.</strong> Borrow without adequate security, swap assets, vote closely-held stock</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="673"><span class="text-sm"><strong>§673 — Reversionary interest</strong> worth &gt;5% of trust value at inception</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="674"><span class="text-sm"><strong>§674 — Control of beneficial enjoyment</strong> without an adverse party</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="678"><span class="text-sm"><strong>§678 — Third-party power.</strong> Someone other than the grantor can vest corpus/income in themselves</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" onchange="classifyTrust()" data-p="679"><span class="text-sm"><strong>§679 — Foreign trust</strong> with a U.S. transferor and U.S. beneficiary</span></label>
</div>
</div>
<div class="card" id="tc-situs-card">
<h3 class="font-bold text-slate-800 mb-1">3 · Domestic or Foreign — Reg. §301.7701-7</h3>
<p class="text-xs text-slate-500 mb-3">A trust is domestic only if it passes BOTH tests. Fail either and it is a foreign trust.</p>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" id="tc-court" checked onchange="classifyTrust()"><span class="text-sm"><strong>Court test:</strong> a U.S. court can exercise primary supervision over administration</span></label>
<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-blue-700" id="tc-control" checked onchange="classifyTrust()"><span class="text-sm"><strong>Control test:</strong> U.S. persons control ALL substantial decisions (distributions, trustee changes, investments)</span></label>
</div>
<div class="card" id="tc-dist-card">
<h3 class="font-bold text-slate-800 mb-3">4 · Distribution Terms</h3>
<select class="form-select" id="tc-dist" onchange="classifyTrust()">
<option value="simple">All income required to be distributed annually · no charitable amounts · no corpus distributions this year</option>
<option value="complex" selected>Discretionary distributions, accumulates income, distributes corpus, or pays charity</option>
</select>
</div>
</div>
<div class="space-y-4">
<div class="card" style="border-width:2px;border-color:#1e40af;" id="tc-result"></div>
<div class="card" id="tc-consequences"></div>
</div>
</div>
</div>

<!-- SECTION: FORM 1041 WORKBENCH -->
<div id="section-form-1041" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Form 1041 Workbench</h1>
<p class="text-slate-500 text-sm mt-1">DNI build-up (IRC §643(a)), Schedule B income distribution deduction, and fiduciary tax at 2026 compressed brackets</p></div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="space-y-4">
<div class="card">
<h3 class="font-bold text-slate-800 mb-1">DNI Build-Up — §643(a)</h3>
<p class="text-xs text-slate-500 mb-4">Start from taxable income before the distribution deduction (Sch. B, line 1)</p>
<div class="space-y-3">
<div><label class="form-label">Taxable income before dist. deduction</label><input class="form-input" id="dni-ti" type="number" value="85000" oninput="calc1041()"></div>
<div><label class="form-label">Personal exemption (add back)</label><select class="form-select" id="dni-exempt" onchange="calc1041()"><option value="300">$300 — simple trust</option><option value="100" selected>$100 — complex trust</option><option value="600">$600 — estate</option></select></div>
<div><label class="form-label">Tax-exempt interest (line 2a)</label><input class="form-input" id="dni-exemptint" type="number" value="0" oninput="calc1041()"></div>
<div><label class="form-label">Expenses allocable to tax-exempt</label><input class="form-input" id="dni-exemptexp" type="number" value="0" oninput="calc1041()"></div>
<div><label class="form-label">Capital gains allocated to corpus (subtract)</label><input class="form-input" id="dni-capgain" type="number" value="20000" oninput="calc1041()"><div class="text-xs text-slate-400 mt-1">Default rule: gains stay in corpus unless the instrument or Reg. §1.643(a)-3 authority includes them in DNI</div></div>
<div><label class="form-label">Charitable deduction §642(c)</label><input class="form-input" id="dni-charity" type="number" value="0" oninput="calc1041()"></div>
</div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-3">Distributions — Schedule B</h3>
<div class="space-y-3">
<div><label class="form-label">Income required to be distributed (line 9 — FAI)</label><input class="form-input" id="dni-req" type="number" value="40000" oninput="calc1041()"></div>
<div><label class="form-label">Other amounts paid or credited (line 10)</label><input class="form-input" id="dni-other" type="number" value="0" oninput="calc1041()"></div>
</div>
<div class="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800"><strong>65-day election (§663(b)):</strong> distributions made within the first 65 days of the following year (by March 6) can be treated as made in the prior year. Check box 6 and file Form 1041-T timing correctly.</div>
</div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="grid grid-cols-3 gap-4">
<div class="card text-center"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">DNI</div><div class="text-xl font-extrabold text-blue-700 mt-1" id="dni-k-dni">—</div></div>
<div class="card text-center"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Distribution Deduction</div><div class="text-xl font-extrabold mt-1" style="color:#047857;" id="dni-k-deduct">—</div></div>
<div class="card text-center"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trust Tax Due</div><div class="text-xl font-extrabold text-red-600 mt-1" id="dni-k-tax">—</div></div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Computation</h3>
<table class="ttable"><tbody id="dni-table"></tbody></table>
<div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800" id="dni-note"></div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">2026 Estate &amp; Trust Income Tax Brackets (est.)</h3>
<table class="ttable"><thead><tr><th>Rate</th><th>Taxable Income</th><th class="text-right">Note</th></tr></thead><tbody>
<tr><td><span class="badge bg-green-100 text-green-700">10%</span></td><td>$0 – $3,300</td><td class="text-right text-slate-500">Compressed — hits 37% at ~$16k</td></tr>
<tr><td><span class="badge bg-yellow-100 text-yellow-700">24%</span></td><td>$3,301 – $11,900</td><td class="text-right text-slate-500">vs. $103k+ for single filers</td></tr>
<tr><td><span class="badge bg-orange-100 text-orange-700">35%</span></td><td>$11,901 – $16,250</td><td class="text-right text-slate-500"></td></tr>
<tr><td><span class="badge bg-red-100 text-red-700">37%</span></td><td>Over $16,250</td><td class="text-right text-slate-500">+3.8% NIIT above ~$16k AGI</td></tr>
</tbody></table>
<div class="mt-3 text-xs text-slate-500">The compressed schedule is why distributing income to beneficiaries in lower individual brackets (carried out via K-1 with DNI character) is a core fiduciary planning move. Estates are exempt from estimated tax for their first two taxable years (§6654(l)).</div>
</div>
</div>
</div>
</div>

<!-- SECTION: 1041 REVIEW CHECKLIST -->
<div id="section-review-1041" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Form 1041 Review Checklist</h1>
<p class="text-slate-500 text-sm mt-1">Authority-based review workflow — adapted from the Form 1041 Review Intelligence Guide · progress saved per client</p></div>
<div class="card mb-5">
<div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-slate-700" id="rv-progress-label">—</div>
<button onclick="resetReview1041()" class="text-xs font-semibold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">Reset checklist</button></div>
<div class="progress-track"><div class="progress-fill" id="rv-progress-fill" style="width:0%;"></div></div>
</div>
<div id="rv-groups" class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5"></div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-3">Escalation Red Flags — stop and consult before filing</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
<div class="alert alert-danger">Grantor trust box checked but dollar amounts entered on lines 1–26 — critical error</div>
<div class="alert alert-danger">Distributions exceed DNI with no corpus explanation or §643(e) election</div>
<div class="alert alert-danger">Foreign grantor trust with U.S. owner and no Forms 3520/3520-A — severe penalties (§6048/§6677)</div>
<div class="alert alert-danger">K-1 issued to the grantor of a grantor trust — grantor reports on their own 1040</div>
<div class="alert alert-danger">Capital gains in DNI without trust-instrument or Reg. §1.643(a)-3 authority</div>
<div class="alert alert-danger">Final-year §642(h) excess deductions missing from K-1 Box 11</div>
</div>
</div>
</div>

<!-- SECTION: GST PLANNER -->
<div id="section-gst" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">GST Tax Planner</h1>
<p class="text-slate-500 text-sm mt-1">Generation-skipping transfer tax (IRC §§2601–2663) — exemption allocation, inclusion ratio, and tax by transfer type</p></div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="space-y-4">
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">Exemption Tracker — §2631</h3>
<div class="space-y-3">
<div><label class="form-label">GST exemption (2026, per person)</label><input class="form-input" id="gst-exemption" type="number" value="15000000" oninput="calcGST()"><div class="text-xs text-slate-400 mt-1">Equals the §2010(c) basic exclusion — $15M under OBBBA</div></div>
<div><label class="form-label">Exemption previously allocated</label><input class="form-input" id="gst-used" type="number" value="0" oninput="calcGST()"></div>
</div>
<div class="mt-4 p-4 bg-slate-50 rounded-lg flex justify-between items-center"><span class="text-sm text-slate-600">Remaining exemption</span><span class="text-xl font-extrabold" style="color:#047857;font-variant-numeric:tabular-nums;" id="gst-remaining">—</span></div>
</div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-4">This Transfer</h3>
<div class="space-y-3">
<div><label class="form-label">Transfer type</label><select class="form-select" id="gst-type" onchange="calcGST()">
<option value="direct">Direct skip — outright to skip person</option>
<option value="distribution">Taxable distribution — from trust to skip person</option>
<option value="termination">Taxable termination — interest ends, skips remain</option></select></div>
<div><label class="form-label">Value transferred</label><input class="form-input" id="gst-value" type="number" value="2000000" oninput="calcGST()"></div>
<div><label class="form-label">Exemption allocated to this transfer</label><input class="form-input" id="gst-alloc" type="number" value="1000000" oninput="calcGST()"></div>
</div>
</div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
<div class="kpi" style="border-left-color:#1e3a8a;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Inclusion Ratio</div><div class="kpi-value text-slate-900" id="gst-k-ir">—</div><div class="text-xs text-slate-400 mt-1">1 − (exemption ÷ value)</div></div>
<div class="kpi" style="border-left-color:#475569;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Applicable Rate</div><div class="kpi-value text-slate-700" id="gst-k-rate">—</div><div class="text-xs text-slate-400 mt-1">40% × inclusion ratio</div></div>
<div class="kpi" style="border-left-color:#b91c1c;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">GST Tax</div><div class="kpi-value" style="color:#b91c1c;" id="gst-k-tax">—</div><div class="text-xs text-slate-400 mt-1" id="gst-k-payer">—</div></div>
<div class="kpi" style="border-left-color:#047857;"><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Net to Skip Person</div><div class="kpi-value" style="color:#047857;" id="gst-k-net">—</div><div class="text-xs text-slate-400 mt-1" id="gst-k-form">—</div></div>
</div>
<div class="card"><h3 class="font-bold text-slate-800 mb-3" id="gst-detail-title">How this transfer is taxed</h3><div class="text-sm text-slate-600 leading-relaxed" id="gst-detail"></div>
<div class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800"><strong>Zero-inclusion goal:</strong> allocate enough exemption to drive the inclusion ratio to zero — the trust is then permanently GST-exempt, including all future appreciation. This is why exemption is best allocated to trusts expected to grow.</div></div>
<div class="card">
<h3 class="font-bold text-slate-800 mb-3">Skip Person Quick Reference — §§2612–2651</h3>
<table class="ttable"><thead><tr><th>Person</th><th>Skip Person?</th><th>Why</th></tr></thead><tbody>
<tr><td>Child</td><td><span class="badge bg-green-100 text-green-700">No</span></td><td class="text-slate-500">One generation below — regular gift/estate tax only</td></tr>
<tr><td>Grandchild</td><td><span class="badge bg-red-100 text-red-700">Yes</span></td><td class="text-slate-500">Two generations below the transferor</td></tr>
<tr><td>Grandchild (parent deceased)</td><td><span class="badge bg-green-100 text-green-700">No</span></td><td class="text-slate-500">Predeceased-parent rule §2651(e) moves them up a generation</td></tr>
<tr><td>Grandniece / grandnephew</td><td><span class="badge bg-red-100 text-red-700">Yes</span></td><td class="text-slate-500">Collateral relatives two+ generations down</td></tr>
<tr><td>Unrelated person &gt;37.5 yrs younger</td><td><span class="badge bg-red-100 text-red-700">Yes</span></td><td class="text-slate-500">Generation assignment by age gap §2651(d)</td></tr>
<tr><td>Trust — all interests held by skip persons</td><td><span class="badge bg-red-100 text-red-700">Yes</span></td><td class="text-slate-500">Trust itself is a skip person §2613(a)(2)</td></tr>
<tr><td>Spouse (any age)</td><td><span class="badge bg-green-100 text-green-700">No</span></td><td class="text-slate-500">Always the transferor's generation §2651(c)</td></tr>
</tbody></table>
</div>
</div>
</div>
</div>

<!-- SECTION: FIDUCIARY REFERENCE -->
<div id="section-trust-ref" class="content-section">
<div class="mb-6"><h1 class="text-2xl font-extrabold text-slate-900">Fiduciary Reference</h1>
<p class="text-slate-500 text-sm mt-1">Distilled from the uploaded library — Subchapter J concepts, foreign trust reporting, elections, and compliance red flags</p></div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
<div class="space-y-3" id="tr-col1"></div>
<div class="space-y-3">
<div id="tr-col2"></div>
<div class="card" style="border:2px solid #fecaca;">
<div class="flex items-center gap-2 mb-3"><span class="badge bg-red-100 text-red-700">Compliance</span><h3 class="font-bold text-slate-800">Abusive Trust Arrangements — Red Flags</h3></div>
<p class="text-sm text-slate-600 mb-3">Promoted "private trust" structures claiming a non-grantor trust plus pass-through LLC eliminates personal tax (e.g. "only fun, food &amp; fashion is taxed") are on the IRS Dirty Dozen list. The claims fail under settled law:</p>
<div class="space-y-2 text-xs text-slate-600">
<div class="p-2.5 bg-red-50 rounded-lg"><strong>Assignment of income doctrine</strong> — income is taxed to whoever earns or controls it, regardless of the entity that receives it (<em>Lucas v. Earl</em>; <em>Helvering v. Clifford</em>).</div>
<div class="p-2.5 bg-red-50 rounded-lg"><strong>Grantor trust rules §§671–679</strong> — retained control, benefit, or ability to reach income pulls it straight back onto the individual's 1040, whatever the trust is labeled.</div>
<div class="p-2.5 bg-red-50 rounded-lg"><strong>§262 personal expenses</strong> — a trust paying the beneficiary's home, vehicle, or lifestyle costs is making distributions or nondeductible personal payments, not "operational expenses."</div>
<div class="p-2.5 bg-red-50 rounded-lg"><strong>"Constitutional trust" / private contract theories</strong> — rejected in every court; promoters and participants face civil fraud penalties (§6663) and promoter injunctions (§§6700–6701).</div>
<div class="p-2.5 bg-amber-50 rounded-lg border border-amber-200"><strong>Legitimate uses stand apart:</strong> probate avoidance, asset protection with real transfer of control, GST/estate exemption leverage, income shifting to beneficiaries who actually receive distributions — all documented and reported on 1041/K-1.</div>
</div>
</div>
</div>
</div>
</div>
`);
})();

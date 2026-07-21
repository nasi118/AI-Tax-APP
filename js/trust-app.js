// v2-trust-app.js — Trust & Estate module logic
'use strict';
Object.assign(sectionTitles, {
  'trust-center':'Trust Classification','form-1041':'Form 1041 Workbench','review-1041':'1041 Review Checklist',
  'gst':'GST Tax Planner','trust-ref':'Fiduciary Reference'
});

// ---------- Trust classification ----------
function classifyTrust(){
  const entity = document.getElementById('tc-entity');
  if(!entity) return;
  const isEstate = entity.value === 'estate';
  ['tc-grantor-card','tc-situs-card','tc-dist-card'].forEach(id => document.getElementById(id).style.display = isEstate ? 'none' : '');
  const res = document.getElementById('tc-result'), cons = document.getElementById('tc-consequences');
  if(isEstate){
    res.innerHTML = `<div class="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Classification</div>
<div class="flex flex-wrap gap-2 mb-4"><span class="badge" style="background:#eff6ff;color:#1e40af;">Decedent's Estate</span><span class="badge">$600 exemption</span></div>
<div class="text-sm text-slate-600 leading-relaxed">A separate taxpayer from date of death until final distribution. Files <strong>Form 1041</strong> if gross income ≥ $600 (or any beneficiary is a nonresident alien). May elect a fiscal year — a key deferral tool trusts don't get.</div>`;
    cons.innerHTML = `<h3 class="font-bold text-slate-800 mb-3">Filing Consequences</h3><div class="space-y-2 text-sm text-slate-600">
<div class="p-2.5 bg-slate-50 rounded-lg"><strong>§645 election (Form 8855):</strong> a qualified revocable trust can elect to be taxed as part of the estate — one 1041, fiscal-year option, 2-year estimated tax exemption.</div>
<div class="p-2.5 bg-slate-50 rounded-lg"><strong>§6654(l):</strong> no estimated tax payments required for the estate's first two taxable years.</div>
<div class="p-2.5 bg-slate-50 rounded-lg"><strong>IRD — §691:</strong> income in respect of a decedent keeps its character; if estate tax was paid, the §691(c) deduction applies.</div>
<div class="p-2.5 bg-slate-50 rounded-lg"><strong>Final year — §642(h):</strong> unused losses and excess deductions pass through to beneficiaries on the final K-1 (Box 11).</div></div>`;
    return;
  }
  const powers = [...document.querySelectorAll('#tc-powers input:checked')].map(el => el.dataset.p);
  const isGrantor = powers.length > 0;
  const domestic = document.getElementById('tc-court').checked && document.getElementById('tc-control').checked;
  const simple = document.getElementById('tc-dist').value === 'simple';
  const chips = [];
  chips.push(isGrantor ? '<span class="badge" style="background:#fffbeb;color:#b45309;">Grantor Trust §§671–679</span>' : '<span class="badge" style="background:#eff6ff;color:#1e40af;">Non-Grantor Trust</span>');
  chips.push(domestic ? '<span class="badge" style="background:#f0fdf4;color:#047857;">Domestic §7701-7</span>' : '<span class="badge" style="background:#fef2f2;color:#b91c1c;">FOREIGN TRUST</span>');
  if(!isGrantor) chips.push(simple ? '<span class="badge">Simple Trust · $300 exemption</span>' : '<span class="badge">Complex Trust · $100 exemption</span>');
  let summary;
  if(isGrantor) summary = `Powers triggered: <strong>§${powers.join(', §')}</strong>. All income, deductions and credits are treated as the grantor's own and reported on the grantor's 1040. File Form 1041 with <strong>Item A "Grantor type trust" checked and NO dollar amounts on lines 1–26</strong>, attaching a grantor statement (Reg. §1.671-4) — or use an optional reporting method. Do <strong>not</strong> issue a K-1 to the grantor.`;
  else if(simple) summary = `A simple trust must distribute all fiduciary accounting income currently. Beneficiaries are taxed on DNI carried out (§652) whether or not actually paid; the trust deducts it (§651). Compare line 9 to the FAI statement — using taxable income instead of FAI is a top review error (§643(b)).`;
  else summary = `A complex trust may accumulate income, distribute corpus, or pay charity. Distribution deduction under §661; beneficiaries taxed under §662 with tier rules. Accumulated income is taxed to the trust at compressed brackets — model distributions in the Form 1041 Workbench.`;
  if(!domestic) summary += `<br><br><strong class="text-red-700">Foreign trust consequences:</strong> taxed like a nonresident alien on U.S.-source income (§641(b)); U.S. owners/beneficiaries face Forms 3520/3520-A with penalties of the greater of $10,000 or 35% of the gross reportable amount (§6677); §679 usually makes a U.S. transferor the grantor.`;
  res.innerHTML = `<div class="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Classification</div><div class="flex flex-wrap gap-2 mb-4">${chips.join('')}</div><div class="text-sm text-slate-600 leading-relaxed">${summary}</div>`;
  const items = [];
  if(isGrantor){
    items.push(['Reporting method','Standard method: 1041 shell + grantor statement with grantor\'s name, TIN and all items. Optional Methods 1/2 skip the 1041 entirely (payor reporting via W-9).','Reg §1.671-4']);
    if(powers.includes('676')) items.push(['Revocable living trust','Becomes irrevocable (non-grantor) at death — consider the §645 election with the estate.','§645; Form 8855']);
    items.push(['S corporation stock','A grantor trust is an eligible S shareholder while the grantor lives; after death, QSST or ESBT election needed within ~2 years.','§1361(c)-(d)']);
  } else {
    items.push(['DNI mechanics','Compute DNI per §643(a); the distribution deduction and K-1 character allocation both flow from it. Use the Form 1041 Workbench.','§§643, 651-663']);
    items.push(['Compressed brackets','Trust hits the 37% bracket at ~$16k of retained income — plus 3.8% NIIT. Distribution timing (incl. the 65-day election) is the main lever.','§1(e); §663(b)']);
    items.push(['State taxation','Trust residency rules differ by state (grantor domicile, trustee location, beneficiary residence) — check for state-level filing.','']);
  }
  if(!domestic) items.push(['Foreign reporting','Form 3520 (transactions/distributions), 3520-A (trust return with U.S. owner), FBAR/8938 for accounts. Late-filing penalties are severe and automatic.','§6048; §6677']);
  cons.innerHTML = `<h3 class="font-bold text-slate-800 mb-3">Filing Consequences</h3><div class="space-y-2 text-sm text-slate-600">${items.map(([t,d,c]) => `<div class="p-2.5 bg-slate-50 rounded-lg"><strong>${t}:</strong> ${d} ${c?`<span class="badge ml-1">${c}</span>`:''}</div>`).join('')}</div>`;
}

// ---------- Form 1041 workbench ----------
function trustTax(ti){
  const b = [[0,3300,.10],[3300,11900,.24],[11900,16250,.35],[16250,Infinity,.37]];
  let tax = 0;
  for(const [lo,hi,r] of b){ if(ti <= lo) break; tax += (Math.min(ti,hi)-lo)*r; }
  return tax;
}
function calc1041(){
  const g = id => +document.getElementById(id).value || 0;
  if(!document.getElementById('dni-ti')) return;
  const ti = g('dni-ti'), exempt = g('dni-exempt'), ei = g('dni-exemptint'), ee = g('dni-exemptexp'),
        cg = g('dni-capgain'), charity = g('dni-charity'), req = g('dni-req'), other = g('dni-other');
  const netExempt = Math.max(0, ei - ee);
  const dni = Math.max(0, ti + exempt + netExempt - cg - charity);
  const dists = req + other;
  // deduction excludes tax-exempt portion
  const exemptShare = dni > 0 ? netExempt/dni : 0;
  const deduction = Math.min(Math.max(0, dists*(1-exemptShare)), Math.max(0, dni - netExempt));
  const taxable = Math.max(0, ti - deduction - 0); // exemption already inside ti per Sch B line 1 convention
  const tax = trustTax(taxable);
  const carryout = Math.min(dists, dni);
  document.getElementById('dni-k-dni').textContent = fmt$(dni);
  document.getElementById('dni-k-deduct').textContent = fmt$(deduction);
  document.getElementById('dni-k-tax').textContent = fmt$(tax);
  const rows = [
    ['Taxable income before distribution deduction (Sch B, ln 1)', fmt$(ti)],
    ['+ Personal exemption add-back — §643(a)(2)', fmt$(exempt)],
    ['+ Net tax-exempt interest — §643(a)(5)', fmt$(netExempt)],
    ['− Capital gains allocated to corpus — §643(a)(3)', '('+fmt$(cg)+')'],
    ['− Charitable deduction — §642(c)', '('+fmt$(charity)+')'],
    ['<strong>Distributable Net Income (Sch B, ln 7)</strong>', '<strong>'+fmt$(dni)+'</strong>'],
    ['Total distributions (lns 9 + 10)', fmt$(dists)],
    ['<strong>Income distribution deduction (ln 15)</strong>', '<strong>'+fmt$(deduction)+'</strong>'],
    ['Taxable income retained by trust', fmt$(taxable)],
    ['<strong>Fiduciary tax (2026 est. brackets)</strong>', '<strong class="text-red-600">'+fmt$(tax)+'</strong>'],
    ['DNI carried out to beneficiaries (K-1s)', fmt$(carryout)]
  ];
  document.getElementById('dni-table').innerHTML = rows.map(([l,v]) => `<tr><td>${l}</td><td class="text-right">${v}</td></tr>`).join('');
  const note = dists > dni
    ? 'Distributions exceed DNI — the excess is a tax-free distribution of corpus to beneficiaries (or requires a §643(e) election review). Verify the trust instrument authorizes corpus distributions.'
    : (taxable > 16250
      ? 'The trust retains income in the 37% bracket. Every additional dollar distributed to a beneficiary below 37% saves the spread — model the 65-day election before March 6.'
      : 'K-1s carry out DNI proportionately by character (interest, dividends, etc.) under §662(b) — verify the allocation matches DNI composition.');
  document.getElementById('dni-note').innerHTML = '<strong>Review note:</strong> ' + note;
}

// ---------- 1041 review checklist ----------
const RV_GROUPS = [
  {g:'Step 0 — Gather', items:[
    ['Trust instrument / will obtained and read for income, corpus and charitable provisions',''],
    ['Prior-year Form 1041 with all carryovers (capital loss, NOL, excess deductions)',''],
    ['All 1099s, bank statements, distribution records and ES payment confirmations',''],
    ['Fiduciary accounting income (FAI) statement obtained — do not substitute taxable income','§643(b)']]},
  {g:'Grantor Trust Checks', items:[
    ['Trust instrument reviewed for §§671–679 grantor provisions (revocable = always grantor)','§§671-679'],
    ['If grantor: Item A box checked and NO dollar amounts on lines 1–26','1041 Instr.'],
    ['Grantor statement attached with name / TIN / all income and deductions','Reg §1.671-4'],
    ['No Schedule K-1 issued to the grantor',''],
    ['Foreign grantor trust: Forms 3520 / 3520-A filed','§6048'],
    ['Trust holds S corp stock: QSST / ESBT election in place','§1361(d)']]},
  {g:'Income & Deductions', items:[
    ['Sum of 1099-INT box 1 equals line 1; box 8 amounts on line 2a not line 1',''],
    ['1099-DIV box 2a capital gain distributions on Schedule D, not line 2b',''],
    ['All 1099-B activity through Form 8949 → Schedule D; line 16 = page 1 line 4',''],
    ['Trustee fees (ln 12), legal/accounting (ln 14), state tax (ln 11) supported by invoices',''],
    ['Charitable deduction paid from income, reduced for tax-exempt share','§642(c)'],
    ['§691(c) deduction computed if estate paid estate tax on IRD','§691(c)']]},
  {g:'Schedule B & K-1s', items:[
    ['Schedule B line 1 equals page 1 line 17; line 7 = DNI ≥ 0','§643(a)'],
    ['Line 9 uses FAI for required distributions; line 15 ≤ DNI',''],
    ['Distributions > DNI explained (corpus) or §643(e) considered',''],
    ['K-1 character allocation proportionate to DNI components','§662(b)'],
    ['65-day election: distributions by March 6 and box 6 checked','§663(b)'],
    ['Form 1041-T allocates only estimated payments, never withholding','§643(g)'],
    ['Final year: §642(h) excess deductions and loss carryovers on K-1 Box 11','§642(h)'],
    ['Estate within 2 years of death: no ES penalty applies','§6654(l)']]}
];
function rvKey(){ return 'tap-1041rv-' + activeClientId(); }
function rvState(){ try{ return JSON.parse(localStorage.getItem(rvKey())||'{}'); }catch(e){ return {}; } }
function toggleRv(id, checked){
  const s = rvState(); s[id] = checked;
  localStorage.setItem(rvKey(), JSON.stringify(s));
  renderReview1041();
}
function resetReview1041(){ localStorage.removeItem(rvKey()); renderReview1041(); }
function renderReview1041(){
  const host = document.getElementById('rv-groups');
  if(!host) return;
  const s = rvState();
  let total = 0, done = 0;
  host.innerHTML = RV_GROUPS.map((grp,gi) => `<div class="card"><h3 class="font-bold text-slate-800 mb-3">${grp.g}</h3><div class="space-y-1">${grp.items.map((item,ii) => {
    const id = gi+'-'+ii; total++; const on = !!s[id]; if(on) done++;
    return `<label class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="mt-0.5 accent-emerald-600 flex-shrink-0" ${on?'checked':''} onchange="toggleRv('${id}', this.checked)"><span class="text-sm ${on?'text-slate-400':'text-slate-700'}">${item[0]}${item[1]?` <span class="badge ml-1">${item[1]}</span>`:''}</span></label>`;
  }).join('')}</div></div>`).join('');
  document.getElementById('rv-progress-label').textContent = `${done} of ${total} verified — ${activeClient().name}`;
  document.getElementById('rv-progress-fill').style.width = (total ? done/total*100 : 0) + '%';
}

// ---------- GST planner ----------
function calcGST(){
  const g = id => +document.getElementById(id).value || 0;
  if(!document.getElementById('gst-value')) return;
  const exemption = g('gst-exemption'), used = g('gst-used'), value = g('gst-value'), type = document.getElementById('gst-type').value;
  const remaining = Math.max(0, exemption - used);
  let alloc = Math.min(g('gst-alloc'), value, remaining);
  document.getElementById('gst-remaining').textContent = fmt$(remaining);
  const ir = value > 0 ? Math.max(0, 1 - alloc/value) : 0;
  const rate = .40 * ir;
  const tax = value * rate;
  const info = {
    direct: { payer:'Transferor pays (tax-exclusive)', form:'Form 709, Sch. D', net: value,
      detail:`An outright transfer to a skip person. The <strong>transferor</strong> pays the GST tax on top of the amount transferred (tax-exclusive — the cheapest form of GST). Reported on Form 709 with automatic exemption allocation under §2632(b) unless elected out. Gift tax also applies to the same transfer.` },
    distribution: { payer:'Beneficiary pays (tax-inclusive)', form:'Form 706-GS(D)', net: value - tax,
      detail:`A distribution from a trust to a skip person that isn't a direct skip or termination. The <strong>transferee</strong> pays the tax out of what they receive (tax-inclusive). If the trust pays the tax for them, that payment is itself an additional taxable distribution. Trustee files 706-GS(D-1); beneficiary files 706-GS(D).` },
    termination: { payer:'Trustee pays (tax-inclusive)', form:'Form 706-GS(T)', net: value - tax,
      detail:`An interest terminates (e.g. the child-beneficiary dies) leaving only skip persons. The <strong>trustee</strong> pays the tax from trust property (tax-inclusive). Watch for the predeceased-parent exception §2651(e) and qualified severances §2642(a)(3) that can isolate exempt shares.` }
  }[type];
  document.getElementById('gst-k-ir').textContent = ir.toFixed(3);
  document.getElementById('gst-k-rate').textContent = (rate*100).toFixed(1)+'%';
  document.getElementById('gst-k-tax').textContent = fmt$(tax);
  document.getElementById('gst-k-payer').textContent = info.payer;
  document.getElementById('gst-k-net').textContent = fmt$(Math.max(0, info.net));
  document.getElementById('gst-k-form').textContent = info.form;
  document.getElementById('gst-detail').innerHTML = info.detail + `<br><br>Inclusion ratio = 1 − (${fmt$(alloc)} ÷ ${fmt$(value)}) = <strong>${ir.toFixed(3)}</strong> · Applicable rate = 40% × ${ir.toFixed(3)} = <strong>${(rate*100).toFixed(1)}%</strong>${ir===0?' — this transfer is fully GST-exempt.':''}`;
}

// ---------- Fiduciary reference accordions ----------
const TR_ITEMS_1 = [
  ['DNI — the central concept','Distributable net income (§643(a)) caps the trust\'s distribution deduction and the amount beneficiaries include, and fixes the character of what they include. Build-up: taxable income before the deduction, add back the exemption and net tax-exempt interest, remove corpus capital gains, extraordinary corpus dividends (simple trusts) and the charitable deduction. DNI can never be negative.'],
  ['Simple vs. complex trusts','Simple (§§651–652): all income required to be distributed currently, no charity, no corpus distributions that year — $300 exemption; beneficiaries taxed on required income whether or not paid. Complex (§§661–663): everything else — $100 exemption, tier system (first-tier required income, second-tier other amounts), separate share rule §663(c). The same trust can flip between simple and complex year to year.'],
  ['Grantor trust powers — §§671–679','§673 reversion >5% · §674 control of beneficial enjoyment · §675 administrative powers (swap, borrow) · §676 revocation · §677 income for grantor/spouse (incl. insurance premiums) · §678 third-party vesting power · §679 foreign trust with U.S. beneficiary. Intentionally defective grantor trusts (IDGTs) exploit this on purpose: grantor pays income tax (a tax-free gift to the trust) while assets grow outside the estate.'],
  ['Fiduciary accounting income vs. taxable income','FAI (§643(b)) is defined by the instrument and state principal-and-income law — it governs what a simple trust must distribute. Substituting taxable income for FAI on Schedule B line 9 is a top practitioner error. Get the accounting income statement.'],
  ['Capital gains in DNI','Default: gains are corpus, taxed to the trust. Reg. §1.643(a)-3 allows inclusion in DNI if the instrument and/or a consistent practice allocates gains to income, deems them distributed, or uses them to determine distributions. Document the authority — reviewers flag gains in DNI without it.']
];
const TR_ITEMS_2 = [
  ['Foreign trusts — classification & reporting','Domestic only if a U.S. court supervises administration (court test) AND U.S. persons control all substantial decisions (control test) — Reg. §301.7701-7. Foreign trusts are taxed like nonresident aliens (§641(b)). U.S. owners: Form 3520-A (trust) + 3520 (owner/beneficiary); penalties are the greater of $10,000 or 35% of the gross reportable amount (§6677). §679 makes most U.S. transferors grantors of their foreign trusts. Watch the throwback rules on accumulation distributions to U.S. beneficiaries.'],
  ['§645 election — trust + estate combined','A qualified revocable trust can elect (Form 8855) to be taxed as part of the decedent\'s estate: single 1041, fiscal-year availability, the estate\'s 2-year estimated-tax holiday (§6654(l)), and the $25,000 rental loss allowance. Election runs for a limited period (generally 2 years without an estate tax return).'],
  ['Final year — §642(h) & K-1 Box 11','On termination, unused capital-loss and NOL carryovers plus excess deductions pass to beneficiaries. Post-TCJA, §67(e) excess deductions are an above-the-line adjustment for beneficiaries. Missing Box 11 codes on the final K-1 is a recurring review failure.'],
  ['IRD — income in respect of a decedent (§691)','Untaxed income earned before death (final paychecks, IRAs, accrued interest, installment gains) is taxed to whoever receives it, with no basis step-up. If federal estate tax was paid, the recipient claims the §691(c) deduction for the estate tax attributable to the IRD — frequently missed.'],
  ['Initial-and-final 1041 in one year','A short first-and-only year (estate opened and closed within one taxable year) still files: check both Initial and Final boxes, no ES requirement (§6654(l)), all income carried out to beneficiaries with §642(h) items on the K-1s, fiscal year end elected on the first (only) return.']
];
function renderTrustRef(){
  const mk = (items, prefix) => items.map((it,i) => `<div class="acc-item"><div class="acc-header" onclick="toggleAcc('${prefix}${i}')">${it[0]}<svg class="w-4 h-4 flex-shrink-0 transition-transform" id="acc-icon-${prefix}${i}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></div><div class="acc-body" id="acc-${prefix}${i}"><p>${it[1]}</p></div></div>`).join('');
  const c1 = document.getElementById('tr-col1'), c2 = document.getElementById('tr-col2');
  if(c1) c1.innerHTML = mk(TR_ITEMS_1,'trA');
  if(c2) c2.innerHTML = '<div class="space-y-3">'+mk(TR_ITEMS_2,'trB')+'</div>';
}

// ---------- wire into client refresh + init ----------
if(typeof refreshClientViews === 'function'){
  const _rcv = refreshClientViews;
  refreshClientViews = function(){ _rcv(); renderReview1041(); };
}
document.addEventListener('DOMContentLoaded', () => {
  classifyTrust();
  calc1041();
  calcGST();
  renderTrustRef();
  renderReview1041();
});

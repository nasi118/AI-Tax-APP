// v2-app.js — clients, what-if planner, quarterly tracker, documents, deadlines, state tax, report
/* global sectionTitles, calcFederalTax, showToast, showSection, chartTaxBreakdown, Chart */
'use strict';

Object.assign(sectionTitles, {
  'clients':'Clients','whatif':'What-If Planner','quarterly':'Quarterly Payments',
  'documents':'Document Checklist','deadlines':'Deadline Calendar','state-tax':'State Tax Breakdown','client-report':'Client Report'
});

// ---------- Nav groups ----------
function toggleNavGroup(btn){
  const g = btn.parentElement;
  g.classList.toggle('closed');
  const state = {};
  document.querySelectorAll('.nav-group').forEach(el => state[el.dataset.group] = el.classList.contains('closed'));
  localStorage.setItem('tap-navgroups', JSON.stringify(state));
}
(function restoreNav(){
  try{
    const state = JSON.parse(localStorage.getItem('tap-navgroups')||'null');
    if(!state) return;
    document.querySelectorAll('.nav-group').forEach(el => { if(el.dataset.group in state) el.classList.toggle('closed', state[el.dataset.group]); });
  }catch(e){}
})();

// ---------- Sidebar pin ----------
// Unpinned: sidebar auto-hides (peeks 6px at the edge, expands on hover) — desktop only, see CSS.
// Pinned: sidebar stays open and docked, same as the original fixed layout.
function setSidebarPin(pinned, opts){
  opts = opts || {};
  document.body.classList.toggle('sidebar-pinned', pinned);
  const btn = document.getElementById('sidebar-pin-btn');
  if(btn){
    btn.classList.toggle('active', pinned);
    btn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
    const label = pinned ? 'Unpin sidebar' : 'Pin sidebar open';
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }
  if(!opts.skipSave){
    try{ localStorage.setItem('tap-sidebar-pinned', pinned ? '1' : '0'); }catch(e){}
  }
}
function toggleSidebarPin(){
  setSidebarPin(!document.body.classList.contains('sidebar-pinned'));
}
(function restoreSidebarPin(){
  let pinned = false;
  try{ pinned = localStorage.getItem('tap-sidebar-pinned') === '1'; }catch(e){}
  setSidebarPin(pinned, {skipSave:true});
})();

// ---------- State tax model ----------
const STATES = [['CA','California'],['NY','New York'],['TX','Texas'],['FL','Florida'],['WA','Washington'],['NV','Nevada'],['TN','Tennessee'],['AZ','Arizona'],['CO','Colorado'],['GA','Georgia'],['IL','Illinois'],['MA','Massachusetts'],['MI','Michigan'],['NC','North Carolina'],['NJ','New Jersey'],['OH','Ohio'],['OR','Oregon'],['PA','Pennsylvania'],['VA','Virginia'],['OTHER','Other (5% est.)']];
const STATE_NAMES = Object.fromEntries(STATES);
const STATE_TAX = {
  CA:[[0,10412,.01],[10412,24684,.02],[24684,38959,.04],[38959,54081,.06],[54081,68350,.08],[68350,349137,.093],[349137,418961,.103],[418961,698271,.113],[698271,Infinity,.123]],
  NY:[[0,8500,.04],[8500,11700,.045],[11700,13900,.0525],[13900,80650,.055],[80650,215400,.06],[215400,1077550,.0685],[1077550,Infinity,.0965]],
  NJ:[[0,20000,.014],[20000,35000,.0175],[35000,40000,.035],[40000,75000,.05525],[75000,500000,.0637],[500000,Infinity,.0897]],
  OR:[[0,4300,.0475],[4300,10750,.0675],[10750,125000,.0875],[125000,Infinity,.099]],
  TX:0, FL:0, WA:0, NV:0, TN:0,
  AZ:.025, CO:.044, GA:.0539, IL:.0495, MA:.05, MI:.0425, NC:.0425, OH:.035, PA:.0307, VA:.0575, OTHER:.05
};
function calcStateTax(state, taxable, filing){
  const def = STATE_TAX[state] !== undefined ? STATE_TAX[state] : STATE_TAX.OTHER;
  taxable = Math.max(0, taxable);
  if(typeof def === 'number') return taxable * def;
  const mult = filing === 'mfj' ? 2 : 1;
  let tax = 0;
  for(const [lo,hi,rate] of def){
    if(taxable <= lo*mult) break;
    tax += (Math.min(taxable, hi*mult) - lo*mult) * rate;
  }
  return tax;
}
function fillStateSelect(sel, val){
  if(!sel) return;
  sel.innerHTML = STATES.map(([k,n]) => `<option value="${k}">${n}</option>`).join('');
  if(val) sel.value = val;
}

// ---------- Tax engine ----------
const FICA_BASE = 176100;
function taxEngine(o){
  const std = o.filing==='mfj' ? 30000 : 15000;
  const hsaAmt = o.hsa ? (o.filing==='mfj' ? 8550 : 4300) : 0;
  const ret = o.ret || 0;
  let seFica, seDeduct, qbiBase, overhead = 0;
  if(o.scorp){
    const salary = o.income * (o.compPct || .30);
    seFica = Math.min(salary,FICA_BASE)*.124 + salary*.029;
    seDeduct = seFica/2; qbiBase = o.income - salary; overhead = 3200;
  } else {
    const seBase = Math.max(0,o.income)*.9235;
    seFica = Math.min(seBase,FICA_BASE)*.124 + seBase*.029;
    seDeduct = seFica/2; qbiBase = o.income;
  }
  const agi = o.income - overhead - seDeduct - ret - hsaAmt + (o.invest||0);
  const qbi = Math.max(0, qbiBase*.20);
  const ti = Math.max(0, agi - std - qbi);
  const fed = calcFederalTax(ti, o.filing);
  const state = calcStateTax(o.state, Math.max(0, agi - std), o.filing);
  const niitThresh = o.filing==='mfj' ? 250000 : 200000;
  const niit = agi > niitThresh ? Math.min(o.invest||0, agi-niitThresh)*.038 : 0;
  return { fed, seFica, state, niit, overhead, agi, ti, qbi, total: fed+seFica+state+niit };
}
const fmt$ = n => '$' + Math.round(n).toLocaleString();

// ---------- Clients ----------
const DEMO_CLIENTS = [
  {id:'s1',demo:1,name:'Sarah Mitchell, RN, MSN',occupation:'Mental Health Nurse Consultant',filing:'single',state:'CA',age:42,income:145000,invest:8500,rental:24000,miles:12000,entity:'Sole Proprietor'},
  {id:'s2',demo:2,name:'James Rodriguez, MD',occupation:'Physician — Private Practice',filing:'mfj',state:'TX',age:48,income:285000,invest:22000,rental:0,miles:22000,entity:'Sole Prop → S-Corp candidate'},
  {id:'s3',demo:3,name:'Linda Park, APRN-NP',occupation:'Nurse Practitioner',filing:'single',state:'NY',age:55,income:485000,invest:48000,rental:72000,miles:28000,entity:'S-Corporation'}
];
function customClients(){ try{ return JSON.parse(localStorage.getItem('tap-clients')||'[]'); }catch(e){ return []; } }
function clientOverrides(){ try{ return JSON.parse(localStorage.getItem('tap-overrides')||'{}'); }catch(e){ return {}; } }
function allClients(){
  const ov = clientOverrides();
  return DEMO_CLIENTS.concat(customClients()).map(c => ov[c.id] ? Object.assign({}, c, ov[c.id]) : c);
}
function activeClientId(){ return localStorage.getItem('tap-active-client') || 's1'; }
function activeClient(){ return allClients().find(c => c.id === activeClientId()) || DEMO_CLIENTS[0]; }

function renderSwitcher(){
  const sel = document.getElementById('client-switcher');
  if(!sel) return;
  sel.innerHTML = allClients().map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  sel.value = activeClientId();
}

const _origLoadScenario = typeof loadScenario === 'function' ? loadScenario : null;
loadScenario = function(n){
  if(_origLoadScenario) _origLoadScenario(n);
  localStorage.setItem('tap-active-client', 's'+n);
  if(clientOverrides()['s'+n]) applyCustomClient(activeClient());
  refreshClientViews();
};

function switchClient(id){
  const c = allClients().find(x => x.id === id);
  if(!c) return;
  localStorage.setItem('tap-active-client', id);
  if(c.demo){ if(_origLoadScenario) _origLoadScenario(c.demo); if(clientOverrides()[c.id]) applyCustomClient(c); }
  else applyCustomClient(c);
  refreshClientViews();
}

function applyCustomClient(c){
  const setVal = (id,v) => { const el = document.getElementById(id); if(el) el.value = v; };
  setVal('cp-name', c.name); setVal('cp-age', c.age); setVal('cp-filing', c.filing);
  const cpState = document.getElementById('cp-state');
  if(cpState){ cpState.value = ['CA','TX','FL','NY','WA'].includes(c.state) ? c.state : 'other'; }
  setVal('cp-occupation', c.occupation||''); setVal('cp-biz-income', c.income);
  setVal('cp-invest-income', c.invest); setVal('cp-rental', c.rental); setVal('cp-miles', c.miles);
  setVal('sc-gross', c.income);
  ['sc-returns','sc-cogs','sc-advertising','sc-vehicle','sc-commissions','sc-contract','sc-insurance','sc-legal','sc-office','sc-homeoffice','sc-supplies','sc-phone','sc-travel','sc-meals','sc-education','sc-licenses','sc-other'].forEach(id => setVal(id,0));
  setVal('sc2-profit', c.income); setVal('ret-income', c.income); setVal('ret-age', c.age);
  setVal('ret-status', c.filing); setVal('veh-biz-miles', c.miles);
  setVal('sa-agi', Math.round(estimateClientAGI(c))); setVal('sa-filing', c.filing);
  setVal('re-agi', Math.round(estimateClientAGI(c)));
  [calcScheduleC, calcHomeOffice, calcVehicle, calcScorp, calcRetirement, calcScheduleA, calcRealEstate, calcInvestmentIncome, calcSchedule1]
    .forEach(fn => { try{ if(typeof fn === 'function') fn(); }catch(e){} });
  const nameEl = document.getElementById('sidebar-client-name'); if(nameEl) nameEl.textContent = c.name;
  showToast('Loaded: ' + c.name);
}

function addClient(){
  const val = id => document.getElementById(id).value;
  const name = val('nc-name').trim();
  if(!name){ showToast('Client name is required'); return; }
  const c = { id:'c'+Date.now(), name, occupation:val('nc-occupation').trim(), filing:val('nc-filing'), state:val('nc-state'),
    age:+val('nc-age')||40, income:+val('nc-income')||0, invest:+val('nc-invest')||0, rental:+val('nc-rental')||0, miles:+val('nc-miles')||0, entity:'Sole Proprietor' };
  const list = customClients(); list.push(c);
  localStorage.setItem('tap-clients', JSON.stringify(list));
  document.getElementById('nc-name').value = '';
  switchClient(c.id);
  showToast('Client added: ' + c.name);
}
function deleteClient(id){
  localStorage.setItem('tap-clients', JSON.stringify(customClients().filter(c => c.id !== id)));
  if(activeClientId() === id) switchClient('s1'); else refreshClientViews();
}

function renderClients(){
  const grid = document.getElementById('clients-grid');
  if(!grid) return;
  const act = activeClientId();
  grid.innerHTML = allClients().map(c => {
    const base = taxEngine({income:c.income,filing:c.filing,state:c.state,invest:c.invest});
    const isActive = c.id === act;
    return `<div class="card" style="${isActive?'border-color:#1e40af;border-width:2px;':''}">
<div class="flex items-start justify-between mb-1">
<div><div class="font-bold text-slate-900">${c.name}</div><div class="text-xs text-slate-500 mt-0.5">${c.occupation||'—'}</div></div>
${isActive?'<span class="badge" style="background:#eff6ff;color:#1e40af;">Active</span>':''}
</div>
<div class="flex flex-wrap gap-1.5 my-3">
<span class="badge">${c.filing==='mfj'?'MFJ':'Single'}</span><span class="badge">${STATE_NAMES[c.state]||c.state}</span><span class="badge">Age ${c.age}</span>${c.demo?'<span class="badge" style="background:#fffbeb;color:#b45309;">Demo</span>':''}
</div>
<div class="space-y-1.5 text-sm">
<div class="flex justify-between"><span class="text-slate-500">Net Business Income</span><span class="font-semibold">${fmt$(c.income)}</span></div>
<div class="flex justify-between"><span class="text-slate-500">Est. Total Tax</span><span class="font-semibold text-red-600">${fmt$(base.total)}</span></div>
<div class="flex justify-between"><span class="text-slate-500">Entity</span><span class="font-semibold">${c.entity||'Sole Proprietor'}</span></div>
</div>
<div class="flex gap-2 mt-4">
${isActive?'':`<button onclick="switchClient('${c.id}')" class="flex-1 py-2 bg-blue-700 text-white rounded-lg font-semibold text-xs hover:bg-blue-800 transition-colors">Set Active</button>`}
${c.demo?'':`<button onclick="deleteClient('${c.id}')" class="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg font-semibold text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">Delete</button>`}
</div></div>`;
  }).join('');
}

// ---------- Dashboard ----------
function updateDashboard(){
  const c = activeClient();
  const incomeInput = document.getElementById('cp-biz-income');
  const income = incomeInput && +incomeInput.value ? +incomeInput.value : c.income;
  const base = taxEngine({income, filing:c.filing, state:c.state, invest:c.invest});
  const opt = taxEngine({income, filing:c.filing, state:c.state, invest:c.invest, ret:Math.min(36250, Math.round(income*.25)), scorp:income>60000, compPct:.30, hsa:true});
  const kpis = document.querySelectorAll('#section-dashboard .kpi-value');
  if(kpis.length >= 4){
    kpis[0].textContent = fmt$(base.total);
    kpis[1].textContent = (base.total/Math.max(1,income+c.invest)*100).toFixed(1)+'%';
    kpis[2].textContent = fmt$(Math.max(0, base.total-opt.total))+'+';
    kpis[3].textContent = fmt$(base.seFica);
  }
  const subs = document.querySelectorAll('#section-dashboard .kpi .text-xs.text-slate-400');
  if(subs.length >= 2){
    subs[0].textContent = 'Federal + SE + state estimated';
    subs[1].textContent = 'On ' + fmt$(income+c.invest) + ' gross income';
  }
  const subtitle = document.querySelector('#section-dashboard > .mb-6 > p');
  if(subtitle) subtitle.innerHTML = `${c.name} &nbsp;·&nbsp; ${c.occupation||''} &nbsp;·&nbsp; Tax Year 2026`;
  if(typeof chartTaxBreakdown !== 'undefined' && chartTaxBreakdown){
    chartTaxBreakdown.data.labels = ['Federal Income Tax','SE / FICA Tax', (STATE_NAMES[c.state]||c.state)+' State Tax','NIIT'];
    chartTaxBreakdown.data.datasets[0].data = [Math.round(base.fed), Math.round(base.seFica), Math.round(base.state), Math.round(base.niit)];
    chartTaxBreakdown.update();
  }
  renderDashWidgets();
}

function renderDashWidgets(){
  let host = document.getElementById('dash-widgets');
  if(!host){
    const kpiRow = document.querySelector('#section-dashboard .grid.grid-cols-2');
    if(!kpiRow) return;
    kpiRow.insertAdjacentHTML('afterend', '<div id="dash-widgets" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5"></div>');
    host = document.getElementById('dash-widgets');
  }
  const upcoming = DEADLINES.filter(d => new Date(d.d) >= TODAY).slice(0,3);
  const q = quarterlyState();
  const target = safeHarborTarget();
  const paid = q.amounts.reduce((s,a,i) => s + (q.paid[i] ? a : 0), 0);
  host.innerHTML = `
<div class="card"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-semibold text-slate-700">Upcoming Deadlines</h3><button onclick="showSection('deadlines')" class="text-xs font-semibold text-blue-700 hover:underline" style="background:none;border:none;cursor:pointer;font-family:inherit;">View calendar →</button></div>
<div class="space-y-2">${upcoming.map(d => `<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg"><div class="text-sm"><span class="font-semibold text-slate-700">${fmtDate(d.d)}</span><span class="text-slate-500"> — ${d.t}</span></div>${dueChip(d.d)}</div>`).join('')}</div></div>
<div class="card"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-semibold text-slate-700">Quarterly Payments — 2026</h3><button onclick="showSection('quarterly')" class="text-xs font-semibold text-blue-700 hover:underline" style="background:none;border:none;cursor:pointer;font-family:inherit;">Manage →</button></div>
<div class="flex items-center gap-3 mb-2"><div class="progress-track flex-1"><div class="progress-fill" style="width:${target?Math.min(100,paid/target*100):0}%;"></div></div><span class="text-xs font-semibold text-slate-600">${fmt$(paid)} / ${fmt$(target)}</span></div>
<div class="grid grid-cols-4 gap-2 mt-3">${QUARTERS.map((qq,i) => `<div class="p-2 rounded-lg text-center ${q.paid[i]?'bg-emerald-50':'bg-slate-50'}"><div class="text-xs font-semibold ${q.paid[i]?'text-emerald-700':'text-slate-500'}">${qq.q}</div><div class="text-xs font-bold ${q.paid[i]?'text-emerald-700':'text-slate-700'}" style="font-variant-numeric:tabular-nums;">${q.paid[i]?'Paid':fmt$(q.amounts[i])}</div></div>`).join('')}</div></div>`;
}

// ---------- Deadlines ----------
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const DEADLINES = [
  {d:'2026-03-16', t:'Form 2553 S-Corp election deadline for TY2026 · 2025 Forms 1120-S / 1065 due', type:'filing'},
  {d:'2026-04-15', t:'2025 Form 1040 due · Q1 2026 estimated payment · 2025 IRA & HSA funding deadline', type:'estimated'},
  {d:'2026-06-15', t:'Q2 2026 estimated payment due', type:'estimated'},
  {d:'2026-09-15', t:'Q3 2026 estimated payment due · extended 1120-S / 1065 due', type:'estimated'},
  {d:'2026-10-15', t:'Extended 2025 Form 1040 due · SEP-IRA funding deadline (extended filers)', type:'filing'},
  {d:'2026-12-31', t:'Solo 401(k) must be established · deductible purchases must clear · Roth conversions final', type:'retirement'},
  {d:'2027-01-15', t:'Q4 2026 estimated payment due', type:'estimated'},
  {d:'2027-02-01', t:'W-2s & 1099-NECs must be issued · Q4 2026 Form 941 due', type:'payroll'},
  {d:'2027-03-15', t:'2026 Forms 1120-S / 1065 due · Form 2553 deadline for TY2027', type:'filing'},
  {d:'2027-04-15', t:'2026 Form 1040 due · Q1 2027 estimated payment · 2026 IRA & HSA funding deadline', type:'filing'}
];
function fmtDate(iso){ return new Date(iso+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function daysUntil(iso){ return Math.round((new Date(iso+'T00:00:00') - TODAY)/86400000); }
function dueChip(iso){
  const n = daysUntil(iso);
  if(n < 0) return '<span class="due-chip due-past">Past</span>';
  if(n === 0) return '<span class="due-chip due-soon">Today</span>';
  if(n <= 14) return `<span class="due-chip due-soon">${n}d</span>`;
  if(n <= 45) return `<span class="due-chip due-near">${n}d</span>`;
  return `<span class="due-chip due-far">${n}d</span>`;
}
let dlFilter = 'all';
function filterDeadlines(type, btn){
  dlFilter = type;
  document.querySelectorAll('#dl-filters .chip').forEach(c => c.classList.toggle('active', c === btn));
  renderDeadlines();
}
function renderDeadlines(){
  const list = document.getElementById('dl-list');
  if(!list) return;
  const items = DEADLINES.filter(d => dlFilter==='all' || d.type===dlFilter);
  const dots = {estimated:'#1e40af', filing:'#b45309', retirement:'#047857', payroll:'#7c3aed'};
  list.innerHTML = items.map(d => {
    const past = daysUntil(d.d) < 0;
    return `<div class="relative ${past?'opacity-45':''}"><div class="absolute -left-7 w-4 h-4 rounded-full border-2 border-white" style="background:${dots[d.type]};top:2px;"></div>
<div class="flex items-start justify-between gap-4"><div class="text-sm"><div class="font-semibold text-slate-800">${fmtDate(d.d)} <span class="badge ml-1" style="text-transform:capitalize;">${d.type}</span></div><div class="text-slate-500 mt-0.5">${d.t}</div></div>${dueChip(d.d)}</div></div>`;
  }).join('');
}

// ---------- Quarterly tracker ----------
const QUARTERS = [
  {q:'Q1', due:'2026-04-15'},{q:'Q2', due:'2026-06-15'},{q:'Q3', due:'2026-09-15'},{q:'Q4', due:'2027-01-15'}
];
function quarterlyKey(){ return 'tap-quarterly-' + activeClientId(); }
function quarterlyState(){
  try{
    const s = JSON.parse(localStorage.getItem(quarterlyKey())||'null');
    if(s && s.amounts) return s;
  }catch(e){}
  const c = activeClient();
  const base = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest});
  const cur = Math.round(base.fed + base.seFica + base.niit);
  const prior = Math.round(cur*.92);
  const target = Math.round(Math.min(prior*(c.income+c.invest > 150000 ? 1.10 : 1.00), cur*.90));
  return { priorTax:prior, priorAgi:c.income+c.invest, currentTax:cur, amounts:[1,1,1,1].map(()=>Math.ceil(target/4)), paid:[false,false,false,false], dates:['','','',''] };
}
function saveQuarterly(s){ localStorage.setItem(quarterlyKey(), JSON.stringify(s)); }
function safeHarborTarget(){
  const s = quarterlyState();
  const rule = s.priorAgi > 150000 ? 1.10 : 1.00;
  return Math.round(Math.min(s.priorTax*rule, s.currentTax*.90));
}
function qtSetAmount(i, v){ const s = quarterlyState(); s.amounts[i] = +v||0; saveQuarterly(s); renderQuarterly(false); }
function qtTogglePaid(i, checked){
  const s = quarterlyState();
  s.paid[i] = checked;
  s.dates[i] = checked ? new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
  saveQuarterly(s); renderQuarterly();
}
function qtInput(id, v){ const s = quarterlyState(); s[id] = +v||0; saveQuarterly(s); }
function applyEvenSplit(){
  const s = quarterlyState();
  const t = safeHarborTarget();
  s.amounts = [0,1,2,3].map(() => Math.ceil(t/4));
  saveQuarterly(s); renderQuarterly();
}
function renderQuarterly(redrawInputs = true){
  const rows = document.getElementById('qt-rows');
  if(!rows) return;
  const s = quarterlyState();
  if(redrawInputs){
    document.getElementById('qt-prior-tax').value = s.priorTax;
    document.getElementById('qt-prior-agi').value = s.priorAgi;
    document.getElementById('qt-current-tax').value = s.currentTax;
  } else {
    s.priorTax = +document.getElementById('qt-prior-tax').value||0;
    s.priorAgi = +document.getElementById('qt-prior-agi').value||0;
    s.currentTax = +document.getElementById('qt-current-tax').value||0;
    saveQuarterly(s);
  }
  const target = safeHarborTarget();
  const paid = s.amounts.reduce((sum,a,i) => sum + (s.paid[i] ? a : 0), 0);
  rows.innerHTML = QUARTERS.map((q,i) => {
    let status;
    if(s.paid[i]) status = `<span class="due-chip due-paid">Paid ${s.dates[i]||''}</span>`;
    else if(daysUntil(q.due) < 0) status = '<span class="due-chip due-soon">Overdue</span>';
    else status = dueChip(q.due);
    return `<tr><td class="font-semibold">${q.q} 2026</td><td>${fmtDate(q.due)}</td>
<td class="text-right"><input class="form-input text-right" style="width:120px;display:inline-block;padding:.3rem .55rem;" type="number" value="${s.amounts[i]}" onchange="qtSetAmount(${i}, this.value)"></td>
<td class="text-center"><input type="checkbox" class="accent-emerald-600 w-4 h-4" ${s.paid[i]?'checked':''} onchange="qtTogglePaid(${i}, this.checked)"></td>
<td>${status}</td></tr>`;
  }).join('');
  document.getElementById('qt-k-target').textContent = fmt$(target);
  document.getElementById('qt-k-target-note').textContent = (s.priorAgi > 150000 ? '110% of prior year' : '100% of prior year') + ' vs 90% of current — lesser';
  document.getElementById('qt-k-paid').textContent = fmt$(paid);
  document.getElementById('qt-k-paid-note').textContent = s.paid.filter(Boolean).length + ' of 4 payments made';
  document.getElementById('qt-k-remaining').textContent = fmt$(Math.max(0, target-paid));
  const next = QUARTERS.findIndex((q,i) => !s.paid[i] && daysUntil(q.due) >= 0);
  document.getElementById('qt-k-next').textContent = next === -1 ? 'All set' : QUARTERS[next].q + ' — ' + fmtDate(QUARTERS[next].due);
  document.getElementById('qt-k-next-note').textContent = next === -1 ? 'No upcoming payments' : daysUntil(QUARTERS[next].due) + ' days away';
}
// keep safe-harbor inputs synced to storage
document.addEventListener('input', e => {
  if(['qt-prior-tax','qt-prior-agi','qt-current-tax'].includes(e.target.id)) renderQuarterly(false);
});

// ---------- Documents ----------
const DOC_GROUPS = [
  {g:'Income', items:['Prior-year tax return (2025)','1099-NEC / 1099-K forms','Business bank & merchant statements','Brokerage 1099-B / DIV / INT','Schedule K-1s (if any)','Rental income records']},
  {g:'Expenses & Deductions', items:['Mileage log (contemporaneous)','Home office sq ft & utility bills','Receipts for expenses over $75','Health insurance premium statements','Retirement contribution confirmations','Charitable contribution receipts']},
  {g:'Entity & Payroll', items:['Payroll reports / Forms 941','W-2 issued to shareholder-employee','Board resolution — reasonable comp','Operating agreement / bylaws']},
  {g:'Payments & Accounts', items:['Estimated payment confirmations','HSA Form 5498-SA','Property tax statements','Mortgage interest Form 1098']}
];
function docsKey(){ return 'tap-docs-' + activeClientId(); }
function docsState(){ try{ return JSON.parse(localStorage.getItem(docsKey())||'{}'); }catch(e){ return {}; } }
function toggleDoc(id, checked){
  const s = docsState(); s[id] = checked;
  localStorage.setItem(docsKey(), JSON.stringify(s));
  renderDocs();
}
function renderDocs(){
  const host = document.getElementById('doc-groups');
  if(!host) return;
  const s = docsState();
  let total = 0, done = 0;
  host.innerHTML = DOC_GROUPS.map((grp,gi) => `<div class="card"><h3 class="font-bold text-slate-800 mb-3">${grp.g}</h3><div class="space-y-1">${grp.items.map((item,ii) => {
    const id = gi+'-'+ii; total++; const on = !!s[id]; if(on) done++;
    return `<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" class="accent-emerald-600 w-4 h-4 flex-shrink-0" ${on?'checked':''} onchange="toggleDoc('${id}', this.checked)"><span class="text-sm ${on?'text-slate-400 line-through':'text-slate-700'}">${item}</span></label>`;
  }).join('')}</div></div>`).join('');
  document.getElementById('doc-progress-label').textContent = `${done} of ${total} received — ${activeClient().name}`;
  document.getElementById('doc-progress-fill').style.width = (total ? done/total*100 : 0) + '%';
}
function copyMissingDocs(){
  const s = docsState();
  const missing = [];
  DOC_GROUPS.forEach((grp,gi) => grp.items.forEach((item,ii) => { if(!s[gi+'-'+ii]) missing.push('• ' + item); }));
  const text = `Hi ${activeClient().name.split(',')[0]},\n\nTo complete your 2026 tax preparation, we still need the following documents:\n\n${missing.join('\n')}\n\nYou can upload them to the secure portal at your convenience. Thank you!`;
  navigator.clipboard.writeText(text).then(() => showToast('Request list copied to clipboard')).catch(() => showToast('Copy failed — clipboard unavailable'));
}

// ---------- What-If Planner ----------
let chartWhatIf;
function whatIfInputs(){
  return {
    income: +document.getElementById('wi-income').value,
    filing: document.getElementById('wi-filing').value,
    state: document.getElementById('wi-state').value,
    ret: +document.getElementById('wi-ret').value,
    scorp: document.getElementById('wi-scorp').checked,
    compPct: (+document.getElementById('wi-comp').value)/100,
    hsa: document.getElementById('wi-hsa').checked
  };
}
function calcWhatIf(){
  if(!document.getElementById('wi-income')) return;
  const o = whatIfInputs();
  document.getElementById('wi-income-label').textContent = fmt$(o.income);
  document.getElementById('wi-ret-label').textContent = fmt$(o.ret);
  document.getElementById('wi-comp-label').textContent = Math.round(o.compPct*100)+'%';
  document.getElementById('wi-scorp-controls').style.display = o.scorp ? '' : 'none';
  const base = taxEngine({income:o.income, filing:o.filing, state:o.state});
  const plan = taxEngine(o);
  const saved = base.total - plan.total - plan.overhead;
  document.getElementById('wi-k-total').textContent = fmt$(plan.total);
  document.getElementById('wi-k-rate').textContent = (plan.total/Math.max(1,o.income)*100).toFixed(1)+'%';
  document.getElementById('wi-k-saved').textContent = (saved>=0?'':'−')+fmt$(Math.abs(saved));
  document.getElementById('wi-k-net').textContent = fmt$(o.income - plan.total - plan.overhead);
  const rows = [
    ['Federal income tax', base.fed, plan.fed],
    ['SE / FICA tax', base.seFica, plan.seFica],
    ['State income tax (est.)', base.state, plan.state],
    ['S-Corp overhead', 0, plan.overhead]
  ];
  document.getElementById('wi-table').innerHTML = rows.map(([l,b,p]) => {
    const d = b - p;
    return `<tr><td>${l}</td><td class="text-right">${fmt$(b)}</td><td class="text-right">${fmt$(p)}</td><td class="text-right ${d>0?'text-emerald-600 font-semibold':d<0?'text-red-600':'text-slate-400'}">${d===0?'—':(d>0?'−':'+')+fmt$(Math.abs(d))}</td></tr>`;
  }).join('') + `<tr class="total"><td>Total</td><td class="text-right">${fmt$(base.total)}</td><td class="text-right">${fmt$(plan.total+plan.overhead)}</td><td class="text-right ${saved>=0?'text-emerald-700':'text-red-600'} font-bold">${(saved>=0?'−':'+')+fmt$(Math.abs(saved))}</td></tr>`;
  const data = {
    labels: ['Baseline', 'Your Plan'],
    datasets: [
      {label:'Federal', data:[base.fed, plan.fed], backgroundColor:'#1e40af', borderRadius:4},
      {label:'SE / FICA', data:[base.seFica, plan.seFica], backgroundColor:'#dc2626', borderRadius:4},
      {label:'State', data:[base.state, plan.state], backgroundColor:'#b45309', borderRadius:4}
    ]
  };
  if(chartWhatIf){ chartWhatIf.data = data; chartWhatIf.update(); }
  else if(typeof Chart !== 'undefined' && document.getElementById('chartWhatIf')){
    chartWhatIf = new Chart(document.getElementById('chartWhatIf'), { type:'bar', data,
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'bottom', labels:{boxWidth:12, font:{size:11}}}, tooltip:{callbacks:{label:c => ' '+c.dataset.label+': $'+Math.round(c.raw).toLocaleString()}} },
        scales:{ x:{stacked:true, ticks:{callback:v => '$'+(v/1000)+'k', font:{size:11}}, grid:{color:'#f1f3f6'}}, y:{stacked:true, grid:{display:false}} } } });
  }
}
function syncWhatIfFromClient(){
  const c = activeClient();
  const el = document.getElementById('wi-income');
  if(!el) return;
  el.value = Math.min(600000, Math.max(30000, c.income));
  document.getElementById('wi-filing').value = c.filing;
  document.getElementById('wi-state').value = STATE_TAX[c.state] !== undefined ? c.state : 'OTHER';
  calcWhatIf();
}

// ---------- State tax section ----------
let chartStates;
function calcStateSection(){
  const st = document.getElementById('st-state');
  if(!st) return;
  const state = st.value, filing = document.getElementById('st-filing').value;
  const income = +document.getElementById('st-income').value || 0;
  const r = taxEngine({income, filing, state});
  document.getElementById('st-result').textContent = fmt$(r.state);
  const flat = typeof (STATE_TAX[state] !== undefined ? STATE_TAX[state] : .05) === 'number';
  document.getElementById('st-result-note').textContent = STATE_TAX[state] === 0 ? 'No state income tax' : (flat ? 'Flat rate' : 'Progressive brackets') + ' — simplified estimate';
  const rows = [['Federal income tax', r.fed], ['Self-employment tax', r.seFica], ['State income tax (est.)', r.state]];
  const total = r.fed + r.seFica + r.state;
  document.getElementById('st-table').innerHTML = rows.map(([l,v]) =>
    `<tr><td>${l}</td><td class="text-right">${fmt$(v)}</td><td class="text-right text-slate-500">${(v/Math.max(1,income)*100).toFixed(1)}%</td></tr>`).join('')
    + `<tr class="total"><td>Total burden</td><td class="text-right">${fmt$(total)}</td><td class="text-right">${(total/Math.max(1,income)*100).toFixed(1)}%</td></tr>`;
  const compare = ['CA','NY','MA','CO','NC','AZ','TX'];
  if(!compare.includes(state)) compare.unshift(state);
  const vals = compare.map(s => Math.round(calcStateTax(s, Math.max(0, r.agi - (filing==='mfj'?30000:15000)), filing)));
  const data = { labels: compare.map(s => STATE_NAMES[s]||s),
    datasets:[{ data:vals, backgroundColor: compare.map(s => s===state ? '#1e40af' : '#cbd5e1'), borderRadius:5 }] };
  if(chartStates){ chartStates.data = data; chartStates.update(); }
  else if(typeof Chart !== 'undefined' && document.getElementById('chartStates')){
    chartStates = new Chart(document.getElementById('chartStates'), { type:'bar', data,
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:c => ' $'+c.raw.toLocaleString()+' state tax'}}},
        scales:{ y:{ticks:{callback:v => '$'+(v/1000)+'k', font:{size:11}}, grid:{color:'#f1f3f6'}}, x:{grid:{display:false}, ticks:{font:{size:10}}} } } });
  }
}
function syncStateSectionFromClient(){
  const c = activeClient();
  const st = document.getElementById('st-state');
  if(!st) return;
  st.value = STATE_TAX[c.state] !== undefined ? c.state : 'OTHER';
  document.getElementById('st-filing').value = c.filing;
  document.getElementById('st-income').value = c.income;
  calcStateSection();
}

// ---------- Client report ----------
const REPORT_SECTIONS = [['position','Current Position'],['charts','Charts & Visuals'],['savings','Savings Opportunities'],['quarterly','Payment Schedule'],['docs','Document Status'],['steps','Next Steps'],['disclaimer','Disclaimer']];
function reportOpts(){
  try{ const o = JSON.parse(localStorage.getItem('tap-report-opts')||'null'); if(o) return o; }catch(e){}
  return Object.fromEntries(REPORT_SECTIONS.map(([k]) => [k, true]));
}
function toggleReportOpt(k, on){
  const o = reportOpts(); o[k] = on;
  localStorage.setItem('tap-report-opts', JSON.stringify(o));
  renderReport();
}
function renderReportOpts(){
  const host = document.getElementById('report-opts');
  if(!host) return;
  const o = reportOpts();
  host.innerHTML = REPORT_SECTIONS.map(([k,label]) => `<label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" class="accent-blue-600 w-4 h-4" ${o[k]?'checked':''} onchange="toggleReportOpt('${k}', this.checked)">${label}</label>`).join('');
}
let chartRptComp, chartRptSave;
function renderReport(){
  const host = document.getElementById('report-body');
  if(!host) return;
  const c = activeClient();
  const base = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest});
  const retMax = Math.min(70000, 24500 + Math.round(c.income*.25));
  const scorpPlan = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest, scorp:true, compPct:.30});
  const retPlan = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest, ret:retMax});
  const hsaPlan = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest, hsa:true});
  const allPlan = taxEngine({income:c.income, filing:c.filing, state:c.state, invest:c.invest, scorp:c.income>60000, compPct:.30, ret:retMax, hsa:true});
  const scorpSave = Math.max(0, base.total - scorpPlan.total - scorpPlan.overhead);
  const retSave = Math.max(0, base.total - retPlan.total);
  const hsaSave = Math.max(0, base.total - hsaPlan.total);
  const allSave = Math.max(0, base.total - allPlan.total - allPlan.overhead);
  const q = quarterlyState();
  const today = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const opts = reportOpts();
  const ds = docsState(); let dTotal = 0, dDone = 0; const dMissing = [];
  DOC_GROUPS.forEach((g,gi) => g.items.forEach((it,ii) => { dTotal++; if(ds[gi+'-'+ii]) dDone++; else dMissing.push(it); }));
  host.innerHTML = `
<div class="flex items-start justify-between pb-5 mb-6" style="border-bottom:3px solid #0b1526;">
<div><div class="text-xl font-extrabold" style="color:#0b1526;">Tax Advisory Pro</div><div class="text-xs text-slate-500 mt-0.5">2026 Tax Strategy Summary — Prepared ${today}</div></div>
<div class="text-right text-xs text-slate-500"><div class="font-bold text-slate-800 text-sm">${c.name}</div><div>${c.occupation||''}</div><div>${c.filing==='mfj'?'Married Filing Jointly':'Single'} · ${STATE_NAMES[c.state]||c.state} · Age ${c.age}</div></div>
</div>
${opts.position?`<h3 class="font-bold text-slate-800 mb-3">Current Position — Tax Year 2026</h3>
<table class="ttable mb-6"><tbody>
<tr><td>Net Business Income</td><td class="text-right font-semibold">${fmt$(c.income)}</td></tr>
<tr><td>Investment Income</td><td class="text-right font-semibold">${fmt$(c.invest)}</td></tr>
<tr><td>Federal Income Tax (est.)</td><td class="text-right">${fmt$(base.fed)}</td></tr>
<tr><td>Self-Employment / FICA Tax</td><td class="text-right">${fmt$(base.seFica)}</td></tr>
<tr><td>State Income Tax (est.)</td><td class="text-right">${fmt$(base.state)}</td></tr>
${base.niit>0?`<tr><td>Net Investment Income Tax</td><td class="text-right">${fmt$(base.niit)}</td></tr>`:''}
<tr class="total"><td>Total Estimated Tax — No Strategies</td><td class="text-right">${fmt$(base.total)}</td></tr>
<tr><td>Effective Rate</td><td class="text-right">${(base.total/Math.max(1,c.income+c.invest)*100).toFixed(1)}%</td></tr>
</tbody></table>`:''}
${opts.charts?`<h3 class="font-bold text-slate-800 mb-3">Visual Summary</h3>
<div class="grid grid-cols-2 gap-8 mb-6" style="page-break-inside:avoid;">
<div><div class="text-xs font-semibold text-slate-500 mb-2">Where the ${fmt$(base.total)} goes</div><div style="height:210px;"><canvas id="rpt-chart-comp"></canvas></div></div>
<div><div class="text-xs font-semibold text-slate-500 mb-2">Estimated savings by strategy</div><div style="height:210px;"><canvas id="rpt-chart-save"></canvas></div></div>
</div>`:''}
${opts.savings?`<h3 class="font-bold text-slate-800 mb-3">Savings Opportunities</h3>
<table class="ttable mb-6"><thead><tr><th>Strategy</th><th>Key Action</th><th class="text-right">Est. Annual Savings</th></tr></thead><tbody>
${c.income>60000?`<tr><td class="font-semibold">S-Corp Election</td><td class="text-slate-500">File Form 2553 by March 15 · 30% reasonable comp</td><td class="text-right font-semibold" style="color:#047857;">${fmt$(scorpSave)}</td></tr>`:''}
<tr><td class="font-semibold">Solo 401(k) — ${fmt$(retMax)}</td><td class="text-slate-500">Establish by Dec 31 · fund by filing deadline</td><td class="text-right font-semibold" style="color:#047857;">${fmt$(retSave)}</td></tr>
<tr><td class="font-semibold">HSA Contribution</td><td class="text-slate-500">Requires HDHP enrollment · triple tax benefit</td><td class="text-right font-semibold" style="color:#047857;">${fmt$(hsaSave)}</td></tr>
<tr class="hl"><td colspan="2" class="font-bold">Combined (strategies interact — not additive)</td><td class="text-right font-bold">${fmt$(allSave)}</td></tr>
</tbody></table>`:''}
${opts.quarterly?`<h3 class="font-bold text-slate-800 mb-3">2026 Estimated Payment Schedule</h3>
<table class="ttable mb-6"><thead><tr><th>Quarter</th><th>Due Date</th><th class="text-right">Amount</th><th>Status</th></tr></thead><tbody>
${QUARTERS.map((qq,i) => `<tr><td>${qq.q} 2026</td><td>${fmtDate(qq.due)}</td><td class="text-right">${fmt$(q.amounts[i])}</td><td>${q.paid[i]?'Paid '+(q.dates[i]||''):'Scheduled'}</td></tr>`).join('')}
</tbody></table>`:''}
${opts.docs?`<h3 class="font-bold text-slate-800 mb-3">Document Status</h3>
<div class="mb-6 text-sm text-slate-600">
<div class="mb-2"><span class="font-semibold text-slate-800">${dDone} of ${dTotal}</span> tax-prep documents received.</div>
${dMissing.length?`<div class="text-xs font-semibold text-slate-500 mb-1">Still outstanding:</div><ul class="text-sm space-y-0.5" style="list-style:disc;padding-left:1.25rem;">${dMissing.slice(0,8).map(m => `<li>${m}</li>`).join('')}${dMissing.length>8?`<li class="text-slate-400">…and ${dMissing.length-8} more</li>`:''}</ul>`:'<div style="color:#047857;">All documents received — ready for preparation.</div>'}
</div>`:''}
${opts.steps?`<h3 class="font-bold text-slate-800 mb-3">Next Steps</h3>
<ol class="text-sm text-slate-600 space-y-1.5 mb-6" style="list-style:decimal;padding-left:1.25rem;">
${c.income>60000?'<li>Confirm S-Corp election decision and reasonable compensation documentation before the Form 2553 deadline.</li>':''}
<li>Open a Solo 401(k) account before December 31, 2026 to preserve the contribution window.</li>
<li>Stay current on quarterly estimated payments to remain within the safe harbor.</li>
<li>Deliver outstanding documents from the checklist so year-end projections stay accurate.</li>
<li>Schedule a Q4 planning session to time income and deductions before year-end.</li>
</ol>`:''}
${opts.disclaimer?`<div class="p-3 bg-slate-50 rounded-lg text-xs text-slate-500" style="border:1px solid #e4e7ec;">All figures are planning estimates based on 2026 federal brackets, OBBBA provisions and simplified state rate tables. They are not a tax return, projection of record, or legal/tax advice. Please review with your licensed CPA before acting.</div>`:''}`;
  if(opts.charts && typeof Chart !== 'undefined'){
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1d4ed8';
    const deep = getComputedStyle(document.documentElement).getPropertyValue('--accent-deep').trim() || '#1e40af';
    if(chartRptComp) chartRptComp.destroy();
    if(chartRptSave) chartRptSave.destroy();
    const compEl = document.getElementById('rpt-chart-comp');
    const saveEl = document.getElementById('rpt-chart-save');
    if(compEl){
      const dl = [['Federal income tax',base.fed,accent],['SE / FICA',base.seFica,deep],['State tax',base.state,'#94a3b8']];
      if(base.niit>0) dl.push(['NIIT',base.niit,'#b45309']);
      chartRptComp = new Chart(compEl, { type:'doughnut',
        data:{ labels:dl.map(d=>d[0]), datasets:[{ data:dl.map(d=>Math.round(d[1])), backgroundColor:dl.map(d=>d[2]), borderWidth:2, borderColor:'#fff' }] },
        options:{ responsive:true, maintainAspectRatio:false, animation:false, cutout:'58%',
          plugins:{ legend:{ position:'right', labels:{ boxWidth:10, font:{ size:11 } } },
            tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${fmt$(ctx.parsed)}` } } } } });
    }
    if(saveEl){
      const bars = [];
      if(c.income>60000) bars.push(['S-Corp election',scorpSave]);
      bars.push(['Solo 401(k)',retSave],['HSA',hsaSave],['Combined',allSave]);
      chartRptSave = new Chart(saveEl, { type:'bar',
        data:{ labels:bars.map(b=>b[0]), datasets:[{ data:bars.map(b=>Math.round(b[1])), backgroundColor:bars.map((b,i)=> b[0]==='Combined' ? '#047857' : accent), borderRadius:4, maxBarThickness:44 }] },
        options:{ responsive:true, maintainAspectRatio:false, animation:false,
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ' ' + fmt$(ctx.parsed.y) } } },
          scales:{ y:{ ticks:{ callback:v=>'$'+(v/1000)+'k', font:{ size:11 } }, grid:{ color:'#f1f3f6' } }, x:{ ticks:{ font:{ size:11 } }, grid:{ display:false } } } } });
    }
  }
}

// ---------- Refresh + init ----------
// ---------- Excel export ----------
function exportToExcel(){
  if(typeof XLSX === 'undefined'){ if(typeof showToast==='function') showToast('Excel library not loaded'); return; }
  const wb = XLSX.utils.book_new();
  const rows = allClients().map(c => {
    const r = taxEngine({income:c.income,filing:c.filing,state:c.state,invest:c.invest});
    return {
      'Client':c.name,'Occupation':c.occupation,'Filing':c.filing==='mfj'?'Married Filing Jointly':'Single','State':STATE_NAMES[c.state]||c.state,'Age':c.age,
      'Business Income':c.income,'Investment Income':c.invest,'Rental Income':c.rental,'Business Miles':c.miles,'Entity':c.entity,
      'AGI (est.)':Math.round(r.agi),'Taxable Income (est.)':Math.round(r.ti),'Federal Tax':Math.round(r.fed),'SE/FICA':Math.round(r.seFica),'State Tax':Math.round(r.state),'NIIT':Math.round(r.niit),'Total Tax (est.)':Math.round(r.total)
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1['!cols'] = Object.keys(rows[0]).map(k => ({wch: Math.max(k.length+2, 14)}));
  XLSX.utils.book_append_sheet(wb, ws1, 'Clients');
  const q = quarterlyState(), c = activeClient();
  const qRows = ['Q1 (Apr 15)','Q2 (Jun 15)','Q3 (Sep 15)','Q4 (Jan 15)'].map((label,i) => ({
    'Quarter':label,'Scheduled Amount':q.amounts[i],'Paid':q.paid[i]?'Yes':'No','Date Paid':q.dates[i]||''
  }));
  qRows.push({'Quarter':'Safe harbor basis','Scheduled Amount':Math.round(q.priorTax),'Paid':'','Date Paid':''});
  const ws2 = XLSX.utils.json_to_sheet(qRows);
  ws2['!cols'] = [{wch:18},{wch:18},{wch:8},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Quarterly — ' + (c.name.split(',')[0].slice(0,20)));
  XLSX.writeFile(wb, 'Tax Advisory Pro — Clients.xlsx');
  if(typeof showToast==='function') showToast('Excel workbook downloaded');
}
window.exportToExcel = exportToExcel;

// ---------- Clear data ----------
function clearAppData(){
  if(!confirm('Clear all saved data in this browser? This removes custom clients, quarterly payment records, document checklists, and report settings. Demo clients are kept.')) return;
  Object.keys(localStorage).filter(k => k.indexOf('tap-') === 0).forEach(k => localStorage.removeItem(k));
  if(typeof showToast === 'function') showToast('Saved data cleared');
  setTimeout(() => location.reload(), 400);
}
window.clearAppData = clearAppData;

// ---------- Live recalculation across tabs ----------
// every tab re-computes from current state each time it is shown
if(typeof showSection === 'function'){
  const _origShowSection = showSection;
  showSection = function(id){
    _origShowSection(id);
    const recalc = {
      'dashboard': updateDashboard,
      'client-profile': () => { updateDashboard(); renderProfileSummary(); },
      'clients': renderClients,
      'quarterly': renderQuarterly,
      'documents': renderDocs,
      'deadlines': renderDeadlines,
      'whatif': calcWhatIf,
      'state-tax': calcStateSection,
      'client-report': () => { renderReportOpts(); renderReport(); },
      'schedule-a': () => { if(typeof calcScheduleA === 'function') calcScheduleA(); },
      'schedule-1': () => { if(typeof calcSchedule1 === 'function') calcSchedule1(); },
      'investment-income': () => { if(typeof calcInvestmentIncome === 'function') calcInvestmentIncome(); },
      'schedule-e': () => { if(typeof calcRealEstate === 'function') calcRealEstate(); }
    };
    if(recalc[id]) recalc[id]();
  };
}
// AGI estimate shared with the Client Profile summary table, used to seed Schedule A
function estimateClientAGI(c){
  const rentNet = Math.round((c.rental||0) * 0.30);
  const seBase = Math.max(0, c.income) * .9235;
  const seTax = Math.min(seBase, FICA_BASE) * .124 + seBase * .029;
  const halfSE = seTax / 2;
  return c.income + (c.invest||0) + rentNet - halfSE;
}
// live "Estimated 2026 Tax Profile Summary" table on the Client Profile tab
function renderProfileSummary(){
  const body = document.getElementById('profile-summary-body');
  if(!body) return;
  const c = activeClient();
  const mfj = c.filing === 'mfj';
  const rentNet = Math.round((c.rental||0) * 0.30);
  const seBase = Math.max(0, c.income) * .9235;
  const seTax = Math.min(seBase, FICA_BASE) * .124 + seBase * .029;
  const halfSE = seTax / 2;
  const agi = c.income + (c.invest||0) + rentNet - halfSE;
  const std = mfj ? 30000 : 15000;
  const qbi = Math.max(0, c.income * .20);
  const ti = Math.max(0, agi - std - qbi);
  const fed = calcFederalTax(ti, c.filing);
  const niitThresh = mfj ? 250000 : 200000;
  const niit = agi > niitThresh ? Math.min(c.invest||0, agi - niitThresh) * .038 : 0;
  body.innerHTML = `
<tr><td>Gross Business Income</td><td class="font-semibold">${fmt$(c.income)}</td><td class="text-slate-500">Schedule C net profit</td></tr>
<tr><td>Investment Income</td><td class="font-semibold">${fmt$(c.invest||0)}</td><td class="text-slate-500">Dividends &amp; interest</td></tr>
<tr><td>Rental Income (net)</td><td class="font-semibold">~${fmt$(rentNet)}</td><td class="text-slate-500">After expenses &amp; depreciation (est. 30% of gross)</td></tr>
<tr><td>½ SE Tax Deduction</td><td class="font-semibold text-red-600">(${fmt$(halfSE)})</td><td class="text-slate-500">Above-the-line deduction</td></tr>
<tr><td>Adjusted Gross Income (AGI)</td><td class="font-semibold text-blue-700">${fmt$(agi)}</td><td class="text-slate-500">Before standard or itemized deductions</td></tr>
<tr><td>Standard Deduction (${mfj?'MFJ':'Single'} 2026)</td><td class="font-semibold text-red-600">(${fmt$(std)})</td><td class="text-slate-500">Assumed standard deduction</td></tr>
<tr><td>QBI Deduction §199A</td><td class="font-semibold text-red-600">(${fmt$(qbi)})</td><td class="text-slate-500">20% of qualified business income (OBBBA permanent)</td></tr>
<tr class="hl"><td>Taxable Income</td><td class="font-bold">${fmt$(ti)}</td><td class="text-slate-500">Subject to federal income tax rates</td></tr>
<tr><td>Federal Income Tax</td><td class="font-semibold">${fmt$(fed)}</td><td class="text-slate-500">2026 ${mfj?'MFJ':'single'} brackets</td></tr>
<tr><td>Self-Employment Tax</td><td class="font-semibold">${fmt$(seTax)}</td><td class="text-slate-500">${fmt$(c.income)} × 0.9235 × 15.3%</td></tr>
<tr><td>NIIT (3.8% on investment income)</td><td class="font-semibold">${fmt$(niit)}</td><td class="text-slate-500">${agi>niitThresh?'AGI above':'Below'} ${fmt$(niitThresh)} threshold</td></tr>
<tr class="total"><td>Total Federal Tax Burden</td><td>${fmt$(fed + seTax + niit)}</td><td>Before any additional strategies</td></tr>`;
}

const SC_EXP_IDS = ['sc-returns','sc-cogs','sc-advertising','sc-vehicle','sc-commissions','sc-contract','sc-insurance','sc-legal','sc-office','sc-homeoffice','sc-supplies','sc-phone','sc-travel','sc-meals','sc-education','sc-licenses','sc-other'];
function scExpensesTotal(){ return SC_EXP_IDS.reduce((s,id) => { const el = document.getElementById(id); return s + (el ? +el.value||0 : 0); }, 0); }

// push the active client's numbers into every downstream calculator and recompute
function syncCalculatorsFromClient(c){
  const setVal = (id,v) => { const el = document.getElementById(id); if(el) el.value = v; };
  // keep Schedule C consistent: gross = target net profit + current expenses
  setVal('sc-gross', c.income + scExpensesTotal());
  setVal('sc2-profit', c.income);
  setVal('ret-income', c.income); setVal('ret-age', c.age); setVal('ret-status', c.filing);
  setVal('veh-biz-miles', c.miles);
  setVal('sa-agi', Math.round(estimateClientAGI(c))); setVal('sa-filing', c.filing);
  setVal('re-agi', Math.round(estimateClientAGI(c)));
  [calcScheduleC, calcHomeOffice, calcVehicle, calcScorp, calcRetirement, calcScheduleA, calcRealEstate, calcInvestmentIncome, calcSchedule1]
    .forEach(fn => { try{ if(typeof fn === 'function') fn(); }catch(e){} });
  renderProfileSummary();
  const nameEl = document.getElementById('sidebar-client-name'); if(nameEl) nameEl.textContent = c.name;
}

// any committed form change refreshes the report + client cards so no tab goes stale
const CP_FIELDS = {'cp-name':'name','cp-age':'age','cp-filing':'filing','cp-occupation':'occupation','cp-biz-income':'income','cp-invest-income':'invest','cp-rental':'rental','cp-miles':'miles'};
document.addEventListener('change', e => {
  if(!e.target.closest('.content-section')) return;
  // persist dashboard client-profile edits onto the active client so every tab recomputes from them
  const f = CP_FIELDS[e.target.id], isState = e.target.id === 'cp-state';
  if(f || isState){
    const ov = clientOverrides(), id = activeClientId();
    ov[id] = ov[id] || {};
    if(isState) ov[id].state = e.target.value === 'other' ? 'OTHER' : e.target.value;
    else if(['age','income','invest','rental','miles'].includes(f)) ov[id][f] = +e.target.value || 0;
    else ov[id][f] = e.target.value;
    localStorage.setItem('tap-overrides', JSON.stringify(ov));
    const c = activeClient();
    syncCalculatorsFromClient(c);
    try{ updateDashboard(); renderQuarterly(); syncWhatIfFromClient(); syncStateSectionFromClient(); renderProfileSummary(); renderSwitcher(); }catch(err){}
  }
  // Schedule C edits flow back: net profit becomes the client's business income everywhere
  if(e.target.id === 'sc-gross' || SC_EXP_IDS.includes(e.target.id)){
    const gross = +((document.getElementById('sc-gross')||{}).value) || 0;
    const netProfit = Math.max(0, Math.round(gross - scExpensesTotal()));
    const ov = clientOverrides(), id = activeClientId();
    ov[id] = ov[id] || {}; ov[id].income = netProfit;
    localStorage.setItem('tap-overrides', JSON.stringify(ov));
    const el = document.getElementById('cp-biz-income'); if(el) el.value = netProfit;
    const c = activeClient();
    const setVal = (i,v) => { const n = document.getElementById(i); if(n) n.value = v; };
    setVal('sc2-profit', netProfit); setVal('ret-income', netProfit);
    try{ calcScorp(); calcRetirement(); updateDashboard(); renderQuarterly(); syncWhatIfFromClient(); syncStateSectionFromClient(); renderProfileSummary(); }catch(err){}
  }
  if(e.target.closest('#section-client-report')) return;
  renderClients(); renderReport();
});

function refreshClientViews(){
  renderSwitcher();
  renderClients();
  updateDashboard();
  renderQuarterly();
  renderDocs();
  renderDeadlines();
  syncWhatIfFromClient();
  syncStateSectionFromClient();
  renderProfileSummary();
  renderReportOpts();
  renderReport();
}

document.addEventListener('DOMContentLoaded', () => {
  fillStateSelect(document.getElementById('wi-state'), 'CA');
  fillStateSelect(document.getElementById('st-state'), 'CA');
  fillStateSelect(document.getElementById('nc-state'), 'CA');
  const act = activeClient();
  if(act.demo && act.demo !== 1 && _origLoadScenario) _origLoadScenario(act.demo);
  else if(!act.demo) applyCustomClient(act);
  refreshClientViews();
});

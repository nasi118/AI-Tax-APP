/* ============================================================================
   SCENARIO REGISTRY — single source of truth for demo and custom scenarios
   ============================================================================

   HOW TO ADD A NEW BUILT-IN SCENARIO
   ----------------------------------
   Append one object to BUILT_IN_SCENARIOS below. Nothing else needs to change:
   the sidebar client switcher, the scenario library grid, the comparison
   table, the dashboard, the Client Report and the recalculation pipeline all
   read from this array. Only `id`, `name` and `business.netIncome` are truly
   required — every other field has a safe default (see normalizeScenario).

   SCENARIO SHAPE
   --------------
   {
     id            's12'          unique, stable, never reused (localStorage key)
     name          string         full client name as it appears in the UI
     shortLabel    string         compact label for chips/toasts ("S12 — ...")
     profession    string
     age           number
     filingStatus  'single' | 'mfj' | 'mfs' | 'hoh'
     state         two-letter code ('CA'); anything outside the app's state
                   list falls back to "other" on the Client Profile
     entityType    'sole' | 'scorp' | 'partnership' | 'ccorp'
     entityLabel   string         display text ("Sole Proprietor")

     business: {
       grossRevenue  number
       netIncome     number       drives SE tax, QBI and the S-Corp analyzer
       expenses: { advertising, vehicle, insurance, legal, office, homeoffice,
                   supplies, phone, travel, meals, education, licenses,
                   cogs, commissions, contract, returns, other }
       w2WagesPaid   number       W-2 wages paid BY the business (QBI wage limit)
       ubia          number       unadjusted basis of qualified property
       sstb          boolean      specified service trade or business
     }

     compensation: {              S-Corp only; ignored for sole props
       reasonableComp     number  actual W-2 salary taken
       reasonableCompPct  number  salary as % of net profit (analyzer slider)
       overhead           number  payroll/admin cost of running the S-Corp
     }

     otherIncome: { investment, rental, w2Wages, spouseW2, capitalGains }
     homeOffice:  { officeSqft, homeSqft }
     vehicle:     { businessMiles, totalMiles, vehicleBasis }
     retirement:  { currentPlan, currentContribution, candidatePlan }

     flags: {                     surface planning angles in the UI + AI context
       sstbPhaseout, niitExposure, saltCapPressure, realEstatePro,
       bonusDepreciation, backdoorRoth, trustPlanning, multiState,
       reasonableCompRisk, w2PlusSchedC
     }

     keyIssues   [string]         short bullets shown on the card
     focusAreas  [string]         planning checklist shown on the card
     assumptions string           one paragraph of stated assumptions
     authorities [{cite, note}]   primary-authority tags surfaced in the UI

     source      'builtin' | 'custom'   set automatically; do not hand-write
   }

   All dollar figures are TY2026 planning estimates for illustration. The
   scenarios carry FACTS only — every tax result is computed by the app's
   engine when the scenario loads, so nothing here can go stale.
   ========================================================================== */

const SCENARIO_STORE_KEY = 'tap-scenarios-v1';
const SCENARIO_SCHEMA_VERSION = 1;

const BUILT_IN_SCENARIOS = [
  {
    id: 's1',
    name: 'Sarah Mitchell, RN, MSN',
    shortLabel: 'S1 — Sole Prop, Single, CA',
    profession: 'Mental Health Nursing Consultant',
    age: 42, filingStatus: 'single', state: 'CA',
    entityType: 'sole', entityLabel: 'Sole Proprietor',
    business: {
      grossRevenue: 168000, netIncome: 145000,
      expenses: { advertising: 1200, vehicle: 8400, insurance: 2400, legal: 1800, office: 600,
                  homeoffice: 900, supplies: 1500, phone: 1200, travel: 2000, meals: 500,
                  education: 1500, licenses: 800 },
      w2WagesPaid: 0, ubia: 0, sstb: false
    },
    compensation: { reasonableComp: 43500, reasonableCompPct: 30, overhead: 3200 },
    otherIncome: { investment: 8500, rental: 24000 },
    homeOffice: { officeSqft: 180, homeSqft: 1800 },
    vehicle: { businessMiles: 12000, totalMiles: 18000, vehicleBasis: 32000 },
    retirement: { currentPlan: 'SEP IRA', currentContribution: 12000, candidatePlan: 'Solo 401(k)' },
    flags: { niitExposure: false, saltCapPressure: true },
    keyIssues: [
      'Full self-employment tax on $145,000 of net profit',
      'S-Corp election timing — is the profit level high enough yet?',
      'Home office and vehicle substantiation',
      'Rental property depreciation and passive-loss limits'
    ],
    focusAreas: [
      'Solo 401(k) instead of SEP — larger deduction at the same income',
      'S-Corp break-even analysis with payroll overhead priced in',
      'Home office regular method vs simplified',
      'Quarterly estimate right-sizing to avoid §6654 penalties'
    ],
    assumptions: 'Single, no dependents, rents her primary residence and uses a dedicated 180 sq ft office. One rental condo held three years. Consulting is non-SSTB nursing services, so the full §199A deduction is available below the threshold.',
    authorities: [
      { cite: 'IRC §199A', note: 'QBI deduction — non-SSTB, below threshold' },
      { cite: 'IRC §280A(c)(1)', note: 'Home office — exclusive and regular use' },
      { cite: 'IRC §1401', note: 'Self-employment tax on net earnings' }
    ]
  },
  {
    id: 's2',
    name: 'James Rodriguez, MD',
    shortLabel: 'S2 — Growing Practice, MFJ, TX',
    profession: 'Physician — Private Practice',
    age: 48, filingStatus: 'mfj', state: 'TX',
    entityType: 'sole', entityLabel: 'Sole Proprietor → S-Corp candidate',
    business: {
      grossRevenue: 320000, netIncome: 285000,
      expenses: { advertising: 3500, vehicle: 12600, insurance: 5400, legal: 3200, office: 1800,
                  homeoffice: 1500, supplies: 4200, phone: 2400, travel: 6500, meals: 1200,
                  education: 3000, licenses: 1200 },
      w2WagesPaid: 0, ubia: 0, sstb: true
    },
    compensation: { reasonableComp: 79800, reasonableCompPct: 28, overhead: 4500 },
    otherIncome: { investment: 22000, rental: 0 },
    homeOffice: { officeSqft: 300, homeSqft: 3000 },
    vehicle: { businessMiles: 22000, totalMiles: 30000, vehicleBasis: 58000 },
    retirement: { currentPlan: 'SEP IRA', currentContribution: 40000, candidatePlan: 'Solo 401(k) + Cash Balance' },
    flags: { sstbPhaseout: true, niitExposure: false },
    keyIssues: [
      'SE tax on $285,000 — the largest single planning lever',
      'Medicine is an SSTB; QBI phases out above $394,600 MFJ',
      'S-Corp election could save meaningful Medicare tax',
      'No state income tax in Texas — federal planning dominates'
    ],
    focusAreas: [
      'S-Corp election with a defensible reasonable-compensation study',
      'Cash balance plan layered on a Solo 401(k)',
      'Keep taxable income under the SSTB phase-out ceiling',
      'Entity-level retirement funding to protect §199A'
    ],
    assumptions: 'Married filing jointly, spouse does not work outside the home, two dependents. Practice operates from leased clinical space with a 300 sq ft home administrative office. No state income tax. Considering S-Corp election effective next January.',
    authorities: [
      { cite: 'IRC §199A(d)(2)', note: 'SSTB definition — health services' },
      { cite: 'Rev. Rul. 74-44', note: 'S-Corp reasonable compensation' },
      { cite: 'IRC §401(a)', note: 'Qualified plan deduction limits' }
    ]
  },
  {
    id: 's3',
    name: 'Linda Park, APRN-NP',
    shortLabel: 'S3 — High Income, S-Corp, NY',
    profession: 'Nurse Practitioner — High Income',
    age: 55, filingStatus: 'single', state: 'NY',
    entityType: 'scorp', entityLabel: 'S-Corporation (elected)',
    business: {
      grossRevenue: 550000, netIncome: 485000,
      expenses: { advertising: 8500, vehicle: 22000, insurance: 12000, legal: 8500, office: 4200,
                  homeoffice: 1500, supplies: 9500, phone: 4800, travel: 15000, meals: 3200,
                  education: 6000, licenses: 2400 },
      w2WagesPaid: 155000, ubia: 180000, sstb: true
    },
    compensation: { reasonableComp: 155000, reasonableCompPct: 32, overhead: 6500 },
    otherIncome: { investment: 48000, rental: 72000 },
    homeOffice: { officeSqft: 400, homeSqft: 4000 },
    vehicle: { businessMiles: 28000, totalMiles: 34000, vehicleBasis: 72000 },
    retirement: { currentPlan: 'Solo 401(k)', currentContribution: 70000, candidatePlan: 'Defined Benefit + Solo 401(k)' },
    flags: { niitExposure: true, trustPlanning: true, saltCapPressure: true, sstbPhaseout: true },
    keyIssues: [
      'NIIT exposure on investment and rental income',
      'New York State plus New York City income tax',
      'Above the SSTB threshold — §199A largely unavailable',
      'Estate planning becoming relevant as assets accumulate'
    ],
    focusAreas: [
      'Reasonable compensation documentation for the existing S-Corp',
      'Defined benefit plan layered on the Solo 401(k)',
      'NIIT mitigation — grouping elections and real estate',
      'Rental portfolio depreciation and §1031 exchanges',
      'Trust structures for New York estate exposure',
      'Age 55 catch-up contributions across all accounts'
    ],
    assumptions: 'Single, no dependents, age 55 and catch-up eligible. Owns a primary residence in New York City and two mortgaged rentals. S-Corp elected three years ago at $155,000 reasonable compensation. Combined net worth approaching $2 million.',
    authorities: [
      { cite: 'IRC §1411', note: 'Net investment income tax — 3.8%' },
      { cite: 'IRC §469(c)(7)', note: 'Rental activities and material participation' },
      { cite: 'IRC §2010', note: 'Basic exclusion amount — estate planning' }
    ]
  },
  {
    id: 's4',
    name: 'Priya Raman',
    shortLabel: 'S4 — SSTB in the phase-out, Single, IL',
    profession: 'Independent Management Consultant',
    age: 44, filingStatus: 'single', state: 'IL',
    entityType: 'sole', entityLabel: 'Sole Proprietor (single-member LLC)',
    business: {
      grossRevenue: 268000, netIncome: 236000,
      expenses: { advertising: 4200, vehicle: 3800, insurance: 3600, legal: 2800, office: 3600,
                  homeoffice: 1200, supplies: 2200, phone: 1800, travel: 9500, meals: 2100,
                  education: 4500, licenses: 900 },
      w2WagesPaid: 0, ubia: 0, sstb: true
    },
    compensation: { reasonableComp: 82600, reasonableCompPct: 35, overhead: 3800 },
    otherIncome: { investment: 14000, rental: 0 },
    homeOffice: { officeSqft: 220, homeSqft: 2000 },
    vehicle: { businessMiles: 5200, totalMiles: 14000, vehicleBasis: 34000 },
    retirement: { currentPlan: 'None', currentContribution: 0, candidatePlan: 'Solo 401(k)' },
    flags: { sstbPhaseout: true },
    keyIssues: [
      'Consulting is an SSTB and taxable income sits inside the $197,300–$247,300 single phase-out band',
      'Every dollar of deduction inside the band restores QBI as well as reducing tax',
      'No retirement plan in place — the largest untapped lever',
      'Illinois flat state tax adds to the marginal cost of income'
    ],
    focusAreas: [
      'Solo 401(k) to pull taxable income back below the SSTB threshold',
      'Model the marginal benefit of each deduction inside the phase-out band',
      'Consider deferring December billings into January',
      'Health savings account if an HDHP is available'
    ],
    assumptions: 'Single, no dependents. Home-based consultancy with a 220 sq ft dedicated office and modest business driving. No qualified plan yet; contributions would come entirely from business cash flow.',
    authorities: [
      { cite: 'IRC §199A(e)(2)', note: 'Threshold amount and phase-in range' },
      { cite: 'IRC §199A(d)(2)(B)', note: 'Consulting as a specified service' },
      { cite: 'IRC §401(k)', note: 'Elective deferrals — one-participant plan' }
    ]
  },
  {
    id: 's5',
    name: 'Daniel & Renata Alves',
    shortLabel: 'S5 — High SALT, multi-state, MFJ, NJ',
    profession: 'Software Architect (W-2) + Design Consultancy',
    age: 47, filingStatus: 'mfj', state: 'NJ',
    entityType: 'sole', entityLabel: 'W-2 employment + spousal Schedule C',
    business: {
      grossRevenue: 142000, netIncome: 118000,
      expenses: { advertising: 5200, vehicle: 2600, insurance: 2400, legal: 1800, office: 4800,
                  homeoffice: 1400, supplies: 3200, phone: 1500, travel: 3400, meals: 900,
                  education: 2000, licenses: 600 },
      w2WagesPaid: 0, ubia: 0, sstb: false
    },
    compensation: { reasonableComp: 41300, reasonableCompPct: 35, overhead: 3000 },
    otherIncome: { investment: 38000, rental: 0, w2Wages: 505000 },
    homeOffice: { officeSqft: 240, homeSqft: 2600 },
    vehicle: { businessMiles: 3600, totalMiles: 15000, vehicleBasis: 41000 },
    retirement: { currentPlan: '401(k) at employer', currentContribution: 24500, candidatePlan: 'Solo 401(k) profit sharing on the Schedule C' },
    flags: { saltCapPressure: true, multiState: true, niitExposure: true },
    keyIssues: [
      'Household AGI above $505,000 triggers the OBBBA SALT cap phase-down',
      'New Jersey resident working in New York — credit for taxes paid to other states',
      'NIIT applies to investment income above the $250,000 MFJ threshold',
      'Two income sources with very different planning levers'
    ],
    focusAreas: [
      'Quantify the SALT phase-down and test whether deductions can pull AGI back',
      'Resident-credit mechanics for the NY/NJ commute',
      'Second retirement plan on the consultancy — separate §415(c) limit',
      'Bunching charitable contributions into alternating years'
    ],
    assumptions: 'Married filing jointly, two dependents. One spouse is a W-2 software architect working in New York while the household is domiciled in New Jersey; the other runs a non-SSTB design consultancy from a 240 sq ft home office. Property taxes alone exceed $22,000.',
    authorities: [
      { cite: 'IRC §164(b)(6)', note: 'SALT cap and income-based phase-down' },
      { cite: 'IRC §1411', note: 'Net investment income tax threshold' },
      { cite: 'IRC §415(c)', note: 'Separate annual additions limit per employer' }
    ]
  },
  {
    id: 's6',
    name: 'Marcus Whitfield',
    shortLabel: 'S6 — Real estate professional, MFJ, TX',
    profession: 'Real Estate Professional — Rental Portfolio',
    age: 52, filingStatus: 'mfj', state: 'TX',
    entityType: 'sole', entityLabel: 'Sole Proprietor + rental portfolio',
    business: {
      grossRevenue: 96000, netIncome: 74000,
      expenses: { advertising: 4800, vehicle: 9200, insurance: 2600, legal: 3400, office: 1200,
                  homeoffice: 1100, supplies: 1800, phone: 1400, travel: 2600, meals: 800,
                  education: 1800, licenses: 1400 },
      w2WagesPaid: 0, ubia: 1450000, sstb: false
    },
    compensation: { reasonableComp: 25900, reasonableCompPct: 35, overhead: 2800 },
    otherIncome: { investment: 26000, rental: 284000 },
    homeOffice: { officeSqft: 200, homeSqft: 2400 },
    vehicle: { businessMiles: 19500, totalMiles: 26000, vehicleBasis: 62000 },
    retirement: { currentPlan: 'SEP IRA', currentContribution: 14000, candidatePlan: 'Solo 401(k)' },
    flags: { realEstatePro: true, bonusDepreciation: true, niitExposure: true },
    keyIssues: [
      'Real estate professional status governs whether rental losses are non-passive',
      'Six-property portfolio with substantial depreciable basis',
      'Cost segregation could accelerate deductions materially',
      'Material participation must be documented contemporaneously'
    ],
    focusAreas: [
      'Time logs supporting the 750-hour and more-than-half tests',
      'Grouping election to aggregate rental activities',
      'Cost segregation study on the two most recent acquisitions',
      'NIIT treatment of rental income for a qualifying professional',
      '§1031 exchange planning on the property with the lowest basis'
    ],
    assumptions: 'Married filing jointly. Full-time real estate professional managing six residential rentals with roughly $1.45 million of depreciable basis. Spouse has no earned income. A brokerage Schedule C supplements rental cash flow. No state income tax.',
    authorities: [
      { cite: 'IRC §469(c)(7)', note: 'Real estate professional exception' },
      { cite: 'Treas. Reg. §1.469-9(g)', note: 'Election to aggregate rental activities' },
      { cite: 'IRC §168(k)', note: 'Bonus depreciation — cost segregation components' },
      { cite: 'IRC §1031', note: 'Like-kind exchange of real property' }
    ]
  },
  {
    id: 's7',
    name: 'Chloe Bennett',
    shortLabel: 'S7 — Early S-Corp, low salary risk, FL',
    profession: 'Digital Marketing Agency Owner',
    age: 34, filingStatus: 'single', state: 'FL',
    entityType: 'scorp', entityLabel: 'S-Corporation (elected last year)',
    business: {
      grossRevenue: 224000, netIncome: 182000,
      expenses: { advertising: 9500, vehicle: 3200, insurance: 2200, legal: 3600, office: 6000,
                  homeoffice: 900, supplies: 2400, phone: 1600, travel: 3800, meals: 1400,
                  education: 3200, licenses: 700 },
      w2WagesPaid: 45000, ubia: 24000, sstb: true
    },
    compensation: { reasonableComp: 45000, reasonableCompPct: 25, overhead: 4200 },
    otherIncome: { investment: 6200, rental: 0 },
    homeOffice: { officeSqft: 160, homeSqft: 1500 },
    vehicle: { businessMiles: 4800, totalMiles: 13000, vehicleBasis: 28000 },
    retirement: { currentPlan: 'None', currentContribution: 0, candidatePlan: 'Solo 401(k) through the S-Corp' },
    flags: { reasonableCompRisk: true, sstbPhaseout: true },
    keyIssues: [
      'Salary of $45,000 on $182,000 of profit is aggressive and invites reclassification',
      'Marketing consulting is an SSTB — W-2 wages paid matter for §199A above the threshold',
      'Raising salary increases payroll tax but strengthens both the audit position and the QBI wage limit',
      'No retirement plan despite strong cash flow'
    ],
    focusAreas: [
      'Commission a reasonable-compensation study and document the conclusion',
      'Model salary levels against payroll tax, §199A wage limit and audit exposure together',
      'Adopt a Solo 401(k) — employee deferral plus employer contribution on W-2 wages',
      'Keep an accountable plan for home office and mileage reimbursement'
    ],
    assumptions: 'Single, no dependents, no state income tax in Florida. S-Corp elected last year with salary set at $45,000 without a formal study. Agency work is client-facing consulting, treated as an SSTB. Two contractors, no other employees.',
    authorities: [
      { cite: 'Rev. Rul. 74-44', note: 'Distributions recharacterized as wages' },
      { cite: 'IRC §199A(b)(2)(B)', note: 'W-2 wage and UBIA limitation' },
      { cite: 'Treas. Reg. §1.62-2', note: 'Accountable plan reimbursements' }
    ]
  },
  {
    id: 's8',
    name: 'Erin & Todd Halvorsen',
    shortLabel: 'S8 — W-2 plus side Schedule C, MFJ, WA',
    profession: 'Public School Teacher + Software Engineer (W-2) with side consulting',
    age: 38, filingStatus: 'mfj', state: 'WA',
    entityType: 'sole', entityLabel: 'W-2 household with side Schedule C',
    business: {
      grossRevenue: 46000, netIncome: 38000,
      expenses: { advertising: 900, vehicle: 1800, insurance: 600, legal: 400, office: 1600,
                  homeoffice: 800, supplies: 1200, phone: 900, travel: 1100, meals: 300,
                  education: 1400, licenses: 300 },
      w2WagesPaid: 0, ubia: 0, sstb: false
    },
    compensation: { reasonableComp: 13300, reasonableCompPct: 35, overhead: 2000 },
    otherIncome: { investment: 5400, rental: 0, w2Wages: 165000 },
    homeOffice: { officeSqft: 120, homeSqft: 1900 },
    vehicle: { businessMiles: 2400, totalMiles: 12000, vehicleBasis: 26000 },
    retirement: { currentPlan: '403(b) + employer 401(k)', currentContribution: 31000, candidatePlan: 'Add a SEP or Solo 401(k) on the side income' },
    flags: { w2PlusSchedC: true },
    keyIssues: [
      'Side consulting carries full SE tax on top of W-2 withholding',
      'Withholding may not cover the side-income liability — estimated payments or a W-4 adjustment is needed',
      'Small but real §199A deduction on the non-SSTB side income',
      'No state income tax in Washington'
    ],
    focusAreas: [
      'Increase W-4 withholding instead of making quarterly estimates',
      'Solo 401(k) employer contribution on the side income — deferrals already used at the day job',
      'Educator expense deduction and classroom supplies',
      'Home office for the consulting activity only, not the teaching role'
    ],
    assumptions: 'Married filing jointly with two children. One spouse teaches public school, the other is a salaried software engineer; combined W-2 wages are $165,000. Side consulting is non-SSTB technical work run from a 120 sq ft office. Elective deferrals are already maximized through employer plans.',
    authorities: [
      { cite: 'IRC §1401', note: 'SE tax on side-business net earnings' },
      { cite: 'IRC §6654', note: 'Estimated tax underpayment — withholding safe harbors' },
      { cite: 'IRC §199A', note: 'QBI on non-SSTB side income below the threshold' }
    ]
  },
  {
    id: 's9',
    name: 'Dr. Helen & Robert Osei',
    shortLabel: 'S9 — High net worth, NIIT + trusts, MFJ, CA',
    profession: 'Surgeon winding down practice + investment portfolio',
    age: 63, filingStatus: 'mfj', state: 'CA',
    entityType: 'scorp', entityLabel: 'S-Corporation (practice wind-down)',
    business: {
      grossRevenue: 214000, netIncome: 176000,
      expenses: { advertising: 2400, vehicle: 5600, insurance: 9800, legal: 6400, office: 3200,
                  homeoffice: 1200, supplies: 3800, phone: 1800, travel: 2600, meals: 900,
                  education: 2400, licenses: 1900 },
      w2WagesPaid: 120000, ubia: 95000, sstb: true
    },
    compensation: { reasonableComp: 120000, reasonableCompPct: 68, overhead: 5800 },
    otherIncome: { investment: 520000, rental: 96000, capitalGains: 310000 },
    homeOffice: { officeSqft: 260, homeSqft: 3800 },
    vehicle: { businessMiles: 6800, totalMiles: 16000, vehicleBasis: 88000 },
    retirement: { currentPlan: 'Defined Benefit + Solo 401(k)', currentContribution: 210000, candidatePlan: 'Maintain DB through wind-down' },
    flags: { niitExposure: true, trustPlanning: true, saltCapPressure: true, sstbPhaseout: true },
    keyIssues: [
      'Large investment and capital gain income drives full NIIT exposure',
      'California top marginal rates apply to every additional dollar',
      'Practice wind-down creates a narrow window for defined benefit funding',
      'Estate and gifting strategy needed before the exclusion changes'
    ],
    focusAreas: [
      'Charitable remainder or donor-advised fund to manage the gain year',
      'Tax-loss harvesting and asset location across taxable and IRA accounts',
      'Defined benefit funding while practice income still supports it',
      'Grantor trust planning and lifetime gifting',
      'Roth conversion runway between retirement and required distributions'
    ],
    assumptions: 'Married filing jointly, both spouses over 60. Surgical practice is winding down over three years while a $6 million taxable portfolio produces the majority of income. One rental property. California residents facing top state rates. Estate planning is active.',
    authorities: [
      { cite: 'IRC §1411', note: 'Net investment income tax on portfolio and gains' },
      { cite: 'IRC §664', note: 'Charitable remainder trusts' },
      { cite: 'IRC §2010(c)', note: 'Basic exclusion amount and portability' },
      { cite: 'IRC §408A(d)(3)', note: 'Roth conversion ordering rules' }
    ]
  },
  {
    id: 's10',
    name: 'Jordan Ellis, DPT',
    shortLabel: 'S10 — Young professional, max deferral, AZ',
    profession: 'Physical Therapist — Mobile Practice',
    age: 31, filingStatus: 'single', state: 'AZ',
    entityType: 'sole', entityLabel: 'Sole Proprietor (single-member LLC)',
    business: {
      grossRevenue: 158000, netIncome: 134000,
      expenses: { advertising: 3600, vehicle: 7400, insurance: 2800, legal: 1200, office: 1800,
                  homeoffice: 700, supplies: 4200, phone: 1400, travel: 1800, meals: 600,
                  education: 2600, licenses: 1100 },
      w2WagesPaid: 0, ubia: 0, sstb: true
    },
    compensation: { reasonableComp: 46900, reasonableCompPct: 35, overhead: 3000 },
    otherIncome: { investment: 3200, rental: 0 },
    homeOffice: { officeSqft: 140, homeSqft: 1400 },
    vehicle: { businessMiles: 14500, totalMiles: 21000, vehicleBasis: 36000 },
    retirement: { currentPlan: 'Roth IRA only', currentContribution: 7000, candidatePlan: 'Solo 401(k) + HSA + backdoor Roth' },
    flags: { backdoorRoth: true },
    keyIssues: [
      'Well below the SSTB threshold, so §199A is fully available',
      'Long runway makes tax-free compounding unusually valuable',
      'Income is approaching the Roth IRA contribution phase-out',
      'Mobile practice generates substantial deductible mileage'
    ],
    focusAreas: [
      'Solo 401(k) with Roth deferrals while the marginal rate is moderate',
      'HSA triple-tax benefit if enrolled in a high-deductible plan',
      'Backdoor Roth mechanics once direct contributions phase out',
      'Mileage log discipline — the largest single deduction',
      'Balance deferral against keeping QBI intact'
    ],
    assumptions: 'Single, no dependents, age 31. Mobile physical therapy practice driving to patients, with a small 140 sq ft home office for administration. Currently contributes only to a Roth IRA. No traditional IRA balance, so the pro-rata rule would not impede a backdoor Roth.',
    authorities: [
      { cite: 'IRC §408A(c)(3)', note: 'Roth IRA contribution phase-out' },
      { cite: 'IRC §223', note: 'Health savings account contributions' },
      { cite: 'Notice 2014-54', note: 'Allocation of after-tax amounts on rollover' },
      { cite: 'IRC §274(d)', note: 'Substantiation of mileage' }
    ]
  },
  {
    id: 's11',
    name: 'Ray & Denise Kowalczyk',
    shortLabel: 'S11 — Equipment-heavy, OBBBA bonus, MFJ, OH',
    profession: 'Specialty Contracting Company',
    age: 49, filingStatus: 'mfj', state: 'OH',
    entityType: 'scorp', entityLabel: 'S-Corporation',
    business: {
      grossRevenue: 1180000, netIncome: 395000,
      expenses: { advertising: 12000, vehicle: 48000, insurance: 34000, legal: 9500, office: 14000,
                  homeoffice: 0, supplies: 96000, phone: 6400, travel: 8200, meals: 4600,
                  education: 5200, licenses: 7800, cogs: 420000, contract: 86000 },
      w2WagesPaid: 340000, ubia: 940000, sstb: false
    },
    compensation: { reasonableComp: 165000, reasonableCompPct: 42, overhead: 12000 },
    otherIncome: { investment: 18000, rental: 0 },
    homeOffice: { officeSqft: 0, homeSqft: 2800 },
    vehicle: { businessMiles: 38000, totalMiles: 44000, vehicleBasis: 285000 },
    retirement: { currentPlan: '401(k) with safe harbor match', currentContribution: 62000, candidatePlan: 'Add cash balance plan' },
    flags: { bonusDepreciation: true },
    keyIssues: [
      'Fleet and equipment purchases dominate the deduction picture',
      'Bonus depreciation versus §179 versus straight-line — the choice changes future years',
      'Heavy vehicles over 6,000 lbs GVWR follow different rules than passenger autos',
      'Non-SSTB with large W-2 wages and property basis, so §199A survives above the threshold'
    ],
    focusAreas: [
      'Model bonus depreciation against a multi-year income forecast rather than one year',
      'Confirm GVWR and business-use percentage for each vehicle',
      'Test the §199A wage-and-UBIA limitation at different salary levels',
      'Cash balance plan to absorb income in peak years',
      'Placed-in-service timing before year end'
    ],
    assumptions: 'Married filing jointly. Specialty contracting S-Corp with roughly $1.18 million of revenue, twelve employees, and a truck and equipment fleet carrying about $285,000 of basis. Work is performed at customer sites, so there is no home office. Ohio resident with municipal income tax exposure.',
    authorities: [
      { cite: 'IRC §168(k)', note: 'Bonus depreciation as amended by OBBBA' },
      { cite: 'IRC §179', note: 'Election to expense depreciable assets' },
      { cite: 'IRC §280F(d)(5)', note: 'Passenger automobile definition and the 6,000 lb exception' },
      { cite: 'IRC §199A(b)(2)', note: 'Wage and UBIA limitation for non-SSTB' }
    ]
  }
];

/* ---------------------------------------------------------------------------
   Normalization — every consumer can rely on the full shape being present.
   ------------------------------------------------------------------------- */
function normalizeScenario(raw) {
  const s = raw || {};
  const b = s.business || {};
  return {
    id: s.id || ('custom-' + Date.now().toString(36)),
    name: s.name || 'Untitled scenario',
    shortLabel: s.shortLabel || s.name || 'Scenario',
    profession: s.profession || '',
    age: num(s.age, 45),
    filingStatus: s.filingStatus || 'single',
    state: s.state || 'other',
    entityType: s.entityType || 'sole',
    entityLabel: s.entityLabel || (s.entityType === 'scorp' ? 'S-Corporation' : 'Sole Proprietor'),
    business: {
      grossRevenue: num(b.grossRevenue, 0),
      netIncome: num(b.netIncome, 0),
      expenses: Object.assign({
        advertising: 0, vehicle: 0, insurance: 0, legal: 0, office: 0, homeoffice: 0,
        supplies: 0, phone: 0, travel: 0, meals: 0, education: 0, licenses: 0,
        cogs: 0, commissions: 0, contract: 0, returns: 0, other: 0
      }, b.expenses || {}),
      w2WagesPaid: num(b.w2WagesPaid, 0),
      ubia: num(b.ubia, 0),
      sstb: !!b.sstb
    },
    compensation: Object.assign({ reasonableComp: 0, reasonableCompPct: 35, overhead: 3000 }, s.compensation || {}),
    otherIncome: Object.assign({ investment: 0, rental: 0, w2Wages: 0, spouseW2: 0, capitalGains: 0 }, s.otherIncome || {}),
    homeOffice: Object.assign({ officeSqft: 0, homeSqft: 0 }, s.homeOffice || {}),
    vehicle: Object.assign({ businessMiles: 0, totalMiles: 0, vehicleBasis: 0 }, s.vehicle || {}),
    retirement: Object.assign({ currentPlan: 'None', currentContribution: 0, candidatePlan: '' }, s.retirement || {}),
    flags: Object.assign({}, s.flags || {}),
    keyIssues: s.keyIssues || [],
    focusAreas: s.focusAreas || [],
    assumptions: s.assumptions || '',
    authorities: s.authorities || [],
    source: s.source || 'builtin'
  };
}
function num(v, d) { const n = Number(v); return isFinite(n) ? n : (d || 0); }

/* ---------------------------------------------------------------------------
   Registry access — built-in plus user-saved scenarios
   ------------------------------------------------------------------------- */
function customScenarios() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCENARIO_STORE_KEY) || '{"scenarios":[]}');
    return (raw.scenarios || []).map(s => normalizeScenario(Object.assign({}, s, { source: 'custom' })));
  } catch (e) { return []; }
}
function saveCustomScenarios(list) {
  try {
    localStorage.setItem(SCENARIO_STORE_KEY, JSON.stringify({ version: SCENARIO_SCHEMA_VERSION, scenarios: list }));
    return true;
  } catch (e) { return false; }
}
function allScenarios() {
  return BUILT_IN_SCENARIOS.map(s => normalizeScenario(Object.assign({}, s, { source: 'builtin' })))
    .concat(customScenarios());
}
/* Accepts a scenario object, an id ('s4'), or a legacy ordinal (1, 2, 3). */
function getScenario(ref) {
  if (ref && typeof ref === 'object') return normalizeScenario(ref);
  const key = String(ref);
  const byId = allScenarios().find(s => s.id === key);
  if (byId) return byId;
  if (/^\d+$/.test(key)) {
    const byOrdinal = allScenarios().find(s => s.id === 's' + key);
    if (byOrdinal) return byOrdinal;
  }
  return null;
}

/* ---------------------------------------------------------------------------
   FIELD MAP — the single place that knows which DOM input holds which fact.
   Add a row here (not a new setVal call) when a calculator gains an input.
   ------------------------------------------------------------------------- */
const SCENARIO_FIELD_MAP = [
  ['cp-name',          s => s.name],
  ['cp-occupation',    s => s.profession],
  ['cp-age',           s => s.age],
  ['cp-filing',        s => s.filingStatus],
  ['cp-state',         s => (['CA','TX','FL','NY','WA'].includes(s.state) ? s.state : 'other')],
  ['cp-biz-income',    s => s.business.netIncome],
  ['cp-invest-income', s => s.otherIncome.investment],
  ['cp-rental',        s => s.otherIncome.rental],
  ['cp-miles',         s => s.vehicle.businessMiles],

  ['sc-gross',         s => s.business.grossRevenue],
  ['sc-returns',       s => s.business.expenses.returns],
  ['sc-cogs',          s => s.business.expenses.cogs],
  ['sc-advertising',   s => s.business.expenses.advertising],
  ['sc-vehicle',       s => s.business.expenses.vehicle],
  ['sc-commissions',   s => s.business.expenses.commissions],
  ['sc-contract',      s => s.business.expenses.contract],
  ['sc-insurance',     s => s.business.expenses.insurance],
  ['sc-legal',         s => s.business.expenses.legal],
  ['sc-office',        s => s.business.expenses.office],
  ['sc-homeoffice',    s => s.business.expenses.homeoffice],
  ['sc-supplies',      s => s.business.expenses.supplies],
  ['sc-phone',         s => s.business.expenses.phone],
  ['sc-travel',        s => s.business.expenses.travel],
  ['sc-meals',         s => s.business.expenses.meals],
  ['sc-education',     s => s.business.expenses.education],
  ['sc-licenses',      s => s.business.expenses.licenses],
  ['sc-other',         s => s.business.expenses.other],

  ['ho-office-sqft',   s => s.homeOffice.officeSqft],
  ['ho-home-sqft',     s => s.homeOffice.homeSqft],
  ['veh-biz-miles',    s => s.vehicle.businessMiles],

  ['sc2-profit',       s => s.business.netIncome],
  ['sc2-salary-pct',   s => s.compensation.reasonableCompPct],
  ['sc2-overhead',     s => s.compensation.overhead],

  ['ret-income',       s => s.business.netIncome],
  ['ret-age',          s => s.age],
  ['ret-status',       s => s.filingStatus],

  ['sa-filing',        s => s.filingStatus],
  ['tc-base-filing',   s => s.filingStatus],
  ['sa-agi',           s => scenarioAGI(s)],
  ['re-agi',           s => scenarioAGI(s)]
];

/* AGI estimate for seeding Schedule A and the real-estate section. Uses the
   app's own helper when present so the seed matches the Client Profile. */
function scenarioAGI(s) {
  const c = { income: s.business.netIncome, invest: s.otherIncome.investment, rental: s.otherIncome.rental };
  const base = typeof estimateClientAGI === 'function'
    ? estimateClientAGI(c)
    : c.income + c.invest;
  return Math.round(base + num(s.otherIncome.w2Wages, 0));
}

/* Every calculator that must re-run after inputs change. Each is isolated so
   one failure cannot stop the rest. */
const SCENARIO_RECALC_FNS = ['calcScheduleC', 'calcHomeOffice', 'calcVehicle', 'calcScorp',
  'calcRetirement', 'calcScheduleA', 'calcRealEstate', 'calcInvestmentIncome', 'calcSchedule1'];
function recalcAllCalculators() {
  SCENARIO_RECALC_FNS.forEach(fn => {
    try { if (typeof window[fn] === 'function') window[fn](); } catch (e) {}
  });
}

/* ---------------------------------------------------------------------------
   LOAD — apply a scenario to every calculator, then recalculate.
   ------------------------------------------------------------------------- */
let ACTIVE_SCENARIO = null;

/* Write a value into a control, respecting what that control can represent:
   - range/number inputs are clamped to their own min/max (the S-Corp salary
     slider, for example, is deliberately bounded to a defensible band, so a
     scenario carrying a higher real-world percentage must not silently write
     an out-of-range value);
   - a <select> only takes values it actually offers, otherwise its existing
     selection is left alone rather than being blanked. */
function setInputValue(el, v) {
  if (el.tagName === 'SELECT') {
    const has = Array.prototype.some.call(el.options, o => o.value === String(v));
    if (has) el.value = v;
    return;
  }
  if (el.type === 'range' || el.type === 'number') {
    let n = Number(v);
    if (!isFinite(n)) return;
    if (el.min !== '' && el.min != null) n = Math.max(n, Number(el.min));
    if (el.max !== '' && el.max != null) n = Math.min(n, Number(el.max));
    el.value = n;
    return;
  }
  el.value = v;
}

function applyScenarioToInputs(s) {
  SCENARIO_FIELD_MAP.forEach(([id, get]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let v;
    try { v = get(s); } catch (e) { return; }
    if (v === undefined || v === null) return;
    setInputValue(el, v);
  });
}

function loadScenario(ref) {
  const s = getScenario(ref);
  if (!s) return null;
  ACTIVE_SCENARIO = s;

  applyScenarioToInputs(s);

  const nameEl = document.getElementById('sidebar-client-name');
  if (nameEl) nameEl.textContent = s.name;
  const labelEl = document.getElementById('scenario-label');
  if (labelEl) labelEl.textContent = s.shortLabel;

  recalcAllCalculators();

  /* Keep the client switcher and every client-driven view in step. */
  try { localStorage.setItem('tap-active-client', s.id); } catch (e) {}
  try { if (typeof refreshClientViews === 'function') refreshClientViews(); } catch (e) {}
  try { renderScenarioLibrary(); } catch (e) {}
  try { if (typeof sendScenariosToPlanner === 'function') sendScenariosToPlanner(); } catch (e) {}

  if (typeof showToast === 'function') showToast('Loaded: ' + s.shortLabel);
  return s;
}
function activeScenario() { return ACTIVE_SCENARIO; }

/* Legacy compatibility: older inline handlers may still read SCENARIOS[1..3]. */
const SCENARIOS = BUILT_IN_SCENARIOS.reduce((acc, s, i) => {
  if (i < 3) acc[i + 1] = s;
  acc[s.id] = s;
  return acc;
}, {});

/* ---------------------------------------------------------------------------
   CUSTOM SCENARIOS — capture the current calculator state and store it.
   ------------------------------------------------------------------------- */
function captureCurrentAsScenario(name) {
  const v = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const n = id => num(v(id), 0);
  const base = ACTIVE_SCENARIO || normalizeScenario({});
  return normalizeScenario({
    id: 'custom-' + Date.now().toString(36),
    name: name || v('cp-name') || 'Custom scenario',
    shortLabel: (name || v('cp-name') || 'Custom scenario'),
    profession: v('cp-occupation') || base.profession,
    age: n('cp-age'), filingStatus: v('cp-filing') || 'single', state: v('cp-state') || 'other',
    entityType: base.entityType, entityLabel: base.entityLabel,
    business: {
      grossRevenue: n('sc-gross'), netIncome: n('cp-biz-income'),
      expenses: {
        advertising: n('sc-advertising'), vehicle: n('sc-vehicle'), insurance: n('sc-insurance'),
        legal: n('sc-legal'), office: n('sc-office'), homeoffice: n('sc-homeoffice'),
        supplies: n('sc-supplies'), phone: n('sc-phone'), travel: n('sc-travel'),
        meals: n('sc-meals'), education: n('sc-education'), licenses: n('sc-licenses'),
        cogs: n('sc-cogs'), commissions: n('sc-commissions'), contract: n('sc-contract'),
        returns: n('sc-returns'), other: n('sc-other')
      },
      w2WagesPaid: base.business.w2WagesPaid, ubia: base.business.ubia, sstb: base.business.sstb
    },
    compensation: { reasonableComp: base.compensation.reasonableComp,
                    reasonableCompPct: n('sc2-salary-pct') || base.compensation.reasonableCompPct,
                    overhead: n('sc2-overhead') },
    otherIncome: { investment: n('cp-invest-income'), rental: n('cp-rental'),
                   w2Wages: base.otherIncome.w2Wages, capitalGains: base.otherIncome.capitalGains },
    homeOffice: { officeSqft: n('ho-office-sqft'), homeSqft: n('ho-home-sqft') },
    vehicle: { businessMiles: n('cp-miles'), totalMiles: base.vehicle.totalMiles, vehicleBasis: base.vehicle.vehicleBasis },
    retirement: base.retirement,
    flags: base.flags,
    keyIssues: [], focusAreas: [],
    assumptions: 'Saved from the live calculator state on ' + new Date().toLocaleString() +
                 (base.name ? ' (started from ' + base.name + ').' : '.'),
    authorities: base.authorities,
    source: 'custom'
  });
}
function saveCurrentScenario(name) {
  const s = captureCurrentAsScenario(name);
  const list = customScenarios();
  list.push(s);
  if (!saveCustomScenarios(list)) {
    if (typeof showToast === 'function') showToast('Could not save — browser storage is unavailable');
    return null;
  }
  if (typeof showToast === 'function') showToast('Saved scenario: ' + s.name);
  renderScenarioLibrary();
  return s;
}
function deleteCustomScenario(id) {
  const list = customScenarios().filter(s => s.id !== id);
  saveCustomScenarios(list);
  renderScenarioLibrary();
  if (typeof showToast === 'function') showToast('Scenario deleted');
}
function renameCustomScenario(id, name) {
  const list = customScenarios().map(s => s.id === id ? Object.assign({}, s, { name: name, shortLabel: name }) : s);
  saveCustomScenarios(list);
  renderScenarioLibrary();
}
function exportScenarios() {
  const payload = { version: SCENARIO_SCHEMA_VERSION, exportedAt: new Date().toISOString(), scenarios: customScenarios() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tax-planning-workbench-scenarios.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importScenariosFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = (data.scenarios || []).map(s => normalizeScenario(Object.assign({}, s, {
        id: 'custom-' + Math.random().toString(36).slice(2, 9), source: 'custom'
      })));
      if (!incoming.length) throw new Error('No scenarios found in that file.');
      saveCustomScenarios(customScenarios().concat(incoming));
      renderScenarioLibrary();
      if (typeof showToast === 'function') showToast('Imported ' + incoming.length + ' scenario(s)');
    } catch (e) {
      if (typeof showToast === 'function') showToast('Import failed: ' + e.message);
    }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------------------
   LIBRARY UI — grid, filters and a comparison table that scales past three
   columns. All markup is generated from the registry; adding a scenario to
   BUILT_IN_SCENARIOS is the only step needed for it to appear here.
   ------------------------------------------------------------------------- */
const SCENARIO_FILTER = { q: '', tag: 'all' };
const SCENARIO_TAGS = [
  ['all', 'All'],
  ['sole', 'Sole proprietor'],
  ['scorp', 'S-Corporation'],
  ['sstbPhaseout', 'SSTB phase-out'],
  ['niitExposure', 'NIIT exposure'],
  ['saltCapPressure', 'High SALT'],
  ['realEstatePro', 'Real estate'],
  ['bonusDepreciation', 'Depreciation'],
  ['reasonableCompRisk', 'Comp risk'],
  ['w2PlusSchedC', 'W-2 + Sch C'],
  ['custom', 'My scenarios']
];
function money(v) { return '$' + Math.round(num(v, 0)).toLocaleString(); }
function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function scenarioMatchesFilter(s) {
  const t = SCENARIO_FILTER.tag;
  if (t !== 'all') {
    if (t === 'custom') { if (s.source !== 'custom') return false; }
    else if (t === 'sole' || t === 'scorp') { if (s.entityType !== t) return false; }
    else if (!s.flags[t]) return false;
  }
  const q = SCENARIO_FILTER.q.trim().toLowerCase();
  if (!q) return true;
  return (s.name + ' ' + s.profession + ' ' + s.state + ' ' + s.entityLabel + ' ' +
          s.keyIssues.join(' ') + ' ' + s.shortLabel).toLowerCase().includes(q);
}
function comparisonSelection() {
  try {
    const raw = JSON.parse(localStorage.getItem('tap-scenario-compare') || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch (e) {}
  return allScenarios().slice(0, 3).map(s => s.id);
}
function toggleComparison(id) {
  let sel = comparisonSelection();
  sel = sel.includes(id) ? sel.filter(x => x !== id) : sel.concat([id]);
  try { localStorage.setItem('tap-scenario-compare', JSON.stringify(sel)); } catch (e) {}
  renderScenarioLibrary();
  /* Push the new selection through the 1040 Planner so the comparison the tab
     shows is the engine's, not a restatement of the scenario record. */
  if (typeof sendScenariosToPlanner === 'function') sendScenariosToPlanner();
}
function setScenarioFilter(tag) { SCENARIO_FILTER.tag = tag; renderScenarioLibrary(); }
function setScenarioQuery(q) { SCENARIO_FILTER.q = q; renderScenarioLibrary(); }

function scenarioCard(s) {
  const activeId = ACTIVE_SCENARIO && ACTIVE_SCENARIO.id;
  const isActive = s.id === activeId;
  const inCompare = comparisonSelection().includes(s.id);
  const accent = s.source === 'custom' ? 'border-t-violet-500' : (s.entityType === 'scorp' ? 'border-t-emerald-600' : 'border-t-blue-600');
  return '' +
  '<div class="card border-t-4 ' + accent + (isActive ? ' ring-2 ring-blue-400' : '') + '">' +
    '<div class="flex items-center justify-between mb-2 gap-2">' +
      '<span class="text-xs font-bold uppercase tracking-widest ' + (s.source === 'custom' ? 'text-violet-600' : 'text-blue-600') + '">' +
        (s.source === 'custom' ? 'My scenario' : esc(s.shortLabel.split('—')[0].trim())) +
        (isActive ? ' · loaded' : '') + '</span>' +
      '<div class="flex gap-1.5">' +
        '<button onclick="loadScenario(\'' + s.id + '\')" class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Load</button>' +
        (s.source === 'custom'
          ? '<button onclick="promptRenameScenario(\'' + s.id + '\')" class="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700" title="Rename">Aa</button>' +
            '<button onclick="confirmDeleteScenario(\'' + s.id + '\')" class="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600" title="Delete">×</button>'
          : '') +
      '</div>' +
    '</div>' +
    '<h3 class="font-bold text-slate-900 text-lg">' + esc(s.name) + '</h3>' +
    '<p class="text-slate-500 text-sm mt-0.5 mb-3">' + esc([s.profession, filingLabel(s.filingStatus), s.state, 'Age ' + s.age].filter(Boolean).join(' · ')) + '</p>' +
    '<div class="space-y-1.5 text-sm">' +
      row('Net business income', money(s.business.netIncome)) +
      row('Entity', esc(s.entityLabel)) +
      (s.otherIncome.w2Wages ? row('Household W-2 wages', money(s.otherIncome.w2Wages)) : '') +
      (s.otherIncome.rental ? row('Rental income', money(s.otherIncome.rental)) : '') +
      row('QBI status', s.business.sstb ? 'SSTB — threshold sensitive' : 'Non-SSTB') +
    '</div>' +
    (s.keyIssues.length ? '<div class="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">' +
      '<div class="font-semibold text-slate-700 mb-1">Key tax issues</div><ul class="space-y-1">' +
      s.keyIssues.map(i => '<li>· ' + esc(i) + '</li>').join('') + '</ul></div>' : '') +
    (s.focusAreas.length ? '<details class="mt-2"><summary class="text-xs font-semibold text-slate-600 cursor-pointer">Planning focus areas</summary>' +
      '<ul class="mt-2 space-y-1 text-xs text-slate-600">' + s.focusAreas.map(i => '<li>· ' + esc(i) + '</li>').join('') + '</ul></details>' : '') +
    (s.authorities.length ? '<details class="mt-2"><summary class="text-xs font-semibold text-slate-600 cursor-pointer">Primary authority</summary>' +
      '<ul class="mt-2 space-y-1 text-xs text-slate-600">' + s.authorities.map(a =>
        '<li><span class="font-mono text-slate-700">' + esc(a.cite) + '</span> — ' + esc(a.note) + '</li>').join('') + '</ul></details>' : '') +
    (s.assumptions ? '<details class="mt-2"><summary class="text-xs font-semibold text-amber-700 cursor-pointer">Assumptions</summary>' +
      '<p class="mt-2 text-xs text-slate-600 leading-relaxed">' + esc(s.assumptions) + '</p></details>' : '') +
    '<label class="mt-3 flex items-center gap-2 text-xs text-slate-500 cursor-pointer">' +
      '<input type="checkbox" ' + (inCompare ? 'checked' : '') + ' onchange="toggleComparison(\'' + s.id + '\')"> Include in comparison</label>' +
  '</div>';
}
function row(label, value) {
  return '<div class="flex justify-between py-1.5 border-b border-slate-100"><span class="text-slate-600">' +
    esc(label) + '</span><span class="font-semibold">' + value + '</span></div>';
}
function filingLabel(f) {
  return ({ single: 'Single', mfj: 'MFJ', mfs: 'MFS', hoh: 'HOH' })[f] || f;
}

function renderScenarioLibrary() {
  const grid = document.getElementById('scenario-grid');
  if (!grid) return;
  const all = allScenarios();
  const shown = all.filter(scenarioMatchesFilter);

  const chips = document.getElementById('scenario-filters');
  if (chips) {
    chips.innerHTML = SCENARIO_TAGS.map(([k, label]) =>
      '<button onclick="setScenarioFilter(\'' + k + '\')" class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ' +
      (SCENARIO_FILTER.tag === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300') +
      '">' + esc(label) + '</button>').join('');
  }
  const count = document.getElementById('scenario-count');
  if (count) count.textContent = shown.length + ' of ' + all.length + ' scenarios';

  grid.innerHTML = shown.length
    ? shown.map(scenarioCard).join('')
    : '<div class="col-span-full text-sm text-slate-500 p-6 text-center">No scenarios match this filter.</div>';

  /* The side-by-side attribute table that used to live here was replaced by
     the 1040 Planner module: the comparison is now computed by the planner's
     TY2026 engine from the same selection. js/planner-bridge.js renders it. */
  if (typeof renderPlannerComparison === 'function') renderPlannerComparison();
}

function promptRenameScenario(id) {
  const s = customScenarios().find(x => x.id === id);
  if (!s) return;
  const name = prompt('Rename scenario', s.name);
  if (name && name.trim()) renameCustomScenario(id, name.trim());
}
function confirmDeleteScenario(id) {
  const s = customScenarios().find(x => x.id === id);
  if (!s) return;
  if (confirm('Delete the saved scenario "' + s.name + '"? This cannot be undone.')) deleteCustomScenario(id);
}
function promptSaveScenario() {
  const suggested = (document.getElementById('cp-name') || {}).value || 'Custom scenario';
  const name = prompt('Save the current calculator state as a scenario named:', suggested);
  if (name && name.trim()) saveCurrentScenario(name.trim());
}

document.addEventListener('DOMContentLoaded', () => {
  /* Restore the last active scenario so the library highlights it correctly. */
  try {
    const last = localStorage.getItem('tap-active-client');
    if (last) { const s = getScenario(last); if (s) ACTIVE_SCENARIO = s; }
  } catch (e) {}
  renderScenarioLibrary();
});

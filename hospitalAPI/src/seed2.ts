/**
 * MDSS Hospital Simulation — Comprehensive Seed Script v2
 *
 * Key upgrades over v1:
 *   - ALL 28 districts of Malawi (with correct region mapping)
 *   - 10 facilities covering all 3 regions
 *   - Expanded disease catalogue (HIV, Malaria, TB, Cholera + Measles,
 *     Typhoid, Dysentery, Mpox, Meningitis, Rabies, Dengue, Anthrax, Plague)
 *   - OUTBREAK SATURATION zones:
 *       • Cholera  → Blantyre + Zomba + Chikwawa (Southern, rainy season spike)
 *       • Malaria  → Mangochi + Salima + Machinga (lakeshore hyperendemic)
 *       • Measles  → Mzimba + Rumphi + Chitipa   (Northern low-coverage cluster)
 *       • Mpox     → Lilongwe + Kasungu           (Central urban crossover)
 *       • Meningitis → Karonga + Nkhata Bay       (Northern meningitis belt)
 *   - 500 patients, 1 000 encounters
 *   - Realistic date clustering within outbreak windows
 *
 * Run:
 *   npx ts-node seed-v2.ts
 */

import "dotenv/config";
import {
  PrismaClient,
  Sex,
  EncounterType,
  EncounterStatus,
  DiagnosisStatus,
  TreatmentStatus,
  OutcomeResult,
  SampleStatus,
} from "./generated/prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomFrom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("randomFrom: empty array");
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function weightedFrom<T>(entries: Array<{ value: T; weight: number }>): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1]!.value;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function padId(n: number, len = 6) {
  return String(n).padStart(len, "0");
}

// ---------------------------------------------------------------------------
// ALL 28 Malawi Districts
// ---------------------------------------------------------------------------

const MALAWI_REGIONS: Record<string, string[]> = {
  Northern: [
    "Chitipa", "Karonga", "Likoma", "Mzimba", "Nkhata Bay", "Rumphi",
  ],
  Central: [
    "Dedza", "Dowa", "Kasungu", "Lilongwe", "Mchinji", "Nkhotakota",
    "Ntcheu", "Ntchisi", "Salima",
  ],
  Southern: [
    "Balaka", "Blantyre", "Chikwawa", "Chiradzulu", "Machinga",
    "Mangochi", "Mulanje", "Mwanza", "Nsanje", "Phalombe",
    "Thyolo", "Zomba",
  ],
};

const ALL_DISTRICTS: string[] = Object.values(MALAWI_REGIONS).flat();

const DISTRICT_TO_REGION: Record<string, string> = {};
for (const [region, districts] of Object.entries(MALAWI_REGIONS)) {
  for (const d of districts) DISTRICT_TO_REGION[d] = region;
}

// ---------------------------------------------------------------------------
// Outbreak Configuration
// Defines which disease is in outbreak in which districts, the window, and
// how many extra encounters to inject (on top of the normal random load).
// ---------------------------------------------------------------------------

interface OutbreakConfig {
  diseaseName: string;
  districts: string[];
  /** ISO date strings for the concentrated window */
  windowStart: string;
  windowEnd: string;
  /** Extra encounters to create purely for this outbreak cluster */
  extraEncounters: number;
  /** Fraction that should be CONFIRMED diagnoses (rest SUSPECTED) */
  confirmedRate: number;
}

const OUTBREAK_CONFIGS: OutbreakConfig[] = [
  {
    diseaseName: "Cholera",
    districts: ["Blantyre", "Zomba", "Chikwawa", "Nsanje"],
    windowStart: "2024-02-01",
    windowEnd: "2024-04-30", // rainy-season peak
    extraEncounters: 120,
    confirmedRate: 0.8,
  },
  {
    diseaseName: "Malaria (P. falciparum)",
    districts: ["Mangochi", "Salima", "Machinga", "Nkhotakota"],
    windowStart: "2024-03-01",
    windowEnd: "2024-05-31", // post-rain lakeshore spike
    extraEncounters: 150,
    confirmedRate: 0.85,
  },
  {
    diseaseName: "Measles",
    districts: ["Mzimba", "Rumphi", "Chitipa"],
    windowStart: "2024-06-01",
    windowEnd: "2024-08-31", // dry-season cluster
    extraEncounters: 80,
    confirmedRate: 0.7,
  },
  {
    diseaseName: "Mpox",
    districts: ["Lilongwe", "Kasungu"],
    windowStart: "2024-09-01",
    windowEnd: "2024-11-30",
    extraEncounters: 50,
    confirmedRate: 0.6,
  },
  {
    diseaseName: "Bacterial Meningitis",
    districts: ["Karonga", "Nkhata Bay", "Chitipa"],
    windowStart: "2024-07-01",
    windowEnd: "2024-09-30", // dry meningitis belt season
    extraEncounters: 60,
    confirmedRate: 0.75,
  },
  {
    diseaseName: "Typhoid Fever",
    districts: ["Lilongwe", "Blantyre", "Zomba"],
    windowStart: "2024-01-01",
    windowEnd: "2024-03-31",
    extraEncounters: 70,
    confirmedRate: 0.65,
  },
];

// Helper: given a district name, return its outbreak disease names (if active)
function outbreakDiseasesForDistrict(district: string): string[] {
  return OUTBREAK_CONFIGS.filter((o) => o.districts.includes(district)).map(
    (o) => o.diseaseName
  );
}

// ---------------------------------------------------------------------------
// Disease Catalogue (expanded)
// ---------------------------------------------------------------------------

const DISEASES = [
  // ── Core MDSS tracked ──────────────────────────────────────────────────
  { icdCode: "A00",  name: "Cholera",                 category: "Communicable",       isNotifiable: true  },
  { icdCode: "A15",  name: "Tuberculosis",             category: "Communicable",       isNotifiable: true  },
  { icdCode: "B50",  name: "Malaria (P. falciparum)",  category: "Vector-borne",       isNotifiable: true  },
  { icdCode: "B51",  name: "Malaria (P. vivax)",       category: "Vector-borne",       isNotifiable: true  },
  { icdCode: "B20",  name: "HIV/AIDS",                 category: "Communicable",       isNotifiable: true  },
  // ── Outbreak-saturated diseases ────────────────────────────────────────
  { icdCode: "A01",  name: "Typhoid Fever",            category: "Communicable",       isNotifiable: true  },
  { icdCode: "B05",  name: "Measles",                  category: "Vaccine-preventable",isNotifiable: true  },
  { icdCode: "B04",  name: "Mpox",                     category: "Zoonotic",           isNotifiable: true  },
  { icdCode: "G00",  name: "Bacterial Meningitis",     category: "Communicable",       isNotifiable: true  },
  // ── Additional notifiable ──────────────────────────────────────────────
  { icdCode: "A09",  name: "Acute Diarrhoea",          category: "Communicable",       isNotifiable: false },
  { icdCode: "A03",  name: "Bacillary Dysentery",      category: "Communicable",       isNotifiable: true  },
  { icdCode: "A90",  name: "Dengue Fever",             category: "Vector-borne",       isNotifiable: true  },
  { icdCode: "A82",  name: "Rabies",                   category: "Zoonotic",           isNotifiable: true  },
  { icdCode: "A22",  name: "Anthrax",                  category: "Zoonotic",           isNotifiable: true  },
  { icdCode: "A37",  name: "Whooping Cough",           category: "Vaccine-preventable",isNotifiable: true  },
  { icdCode: "A33",  name: "Neonatal Tetanus",         category: "Communicable",       isNotifiable: true  },
  { icdCode: "B65",  name: "Schistosomiasis",          category: "Parasitic",          isNotifiable: false },
  // ── Non-communicable (background load) ────────────────────────────────
  { icdCode: "J18",  name: "Pneumonia",                category: "Respiratory",        isNotifiable: false },
  { icdCode: "E11",  name: "Type 2 Diabetes",          category: "Non-communicable",   isNotifiable: false },
  { icdCode: "I10",  name: "Hypertension",             category: "Non-communicable",   isNotifiable: false },
  { icdCode: "J45",  name: "Asthma",                   category: "Respiratory",        isNotifiable: false },
  { icdCode: "O15",  name: "Eclampsia",                category: "Obstetric",          isNotifiable: false },
  { icdCode: "K92",  name: "GI Haemorrhage",           category: "Surgical",           isNotifiable: false },
];

// ---------------------------------------------------------------------------
// Treatment Protocol Catalogue (expanded)
// ---------------------------------------------------------------------------

const PROTOCOLS = [
  // TB
  { code: "TB-CAT1",       name: "TB Cat-1: 2RHZE/4RH",             diseaseTarget: "Tuberculosis",            description: "First-line new TB cases" },
  { code: "TB-CAT2",       name: "TB Cat-2: Retreatment RHZES",      diseaseTarget: "Tuberculosis",            description: "Retreatment TB" },
  // Malaria
  { code: "MALARIA-AL3",   name: "Artemether-Lumefantrine 3-day",    diseaseTarget: "Malaria (P. falciparum)", description: "Uncomplicated malaria 1st line" },
  { code: "MALARIA-IV-ART",name: "IV Artesunate (severe malaria)",   diseaseTarget: "Malaria (P. falciparum)", description: "Severe/complicated malaria" },
  // Cholera
  { code: "CHOLERA-ORS",   name: "ORS + Zinc",                       diseaseTarget: "Cholera",                 description: "Mild-moderate cholera" },
  { code: "CHOLERA-IV",    name: "IV Ringer's Lactate + Doxycycline",diseaseTarget: "Cholera",                 description: "Severe cholera" },
  // HIV
  { code: "HIV-NNRTI-1L",  name: "TDF + 3TC + EFV (1st-line ART)",  diseaseTarget: "HIV/AIDS",                description: "Standard 1st-line ART" },
  { code: "HIV-NNRTI-2L",  name: "AZT + 3TC + LPV/r (2nd-line ART)",diseaseTarget: "HIV/AIDS",                description: "2nd-line ART for NNRTI failure" },
  // Typhoid
  { code: "TYPHOID-CIPRO", name: "Ciprofloxacin 500mg BD 7 days",    diseaseTarget: "Typhoid Fever",           description: "First-line typhoid" },
  { code: "TYPHOID-CEFTRI",name: "Ceftriaxone 2g IV OD 7 days",      diseaseTarget: "Typhoid Fever",           description: "Severe typhoid" },
  // Measles
  { code: "MEASLES-VIT-A", name: "Vitamin A + Supportive Care",      diseaseTarget: "Measles",                 description: "WHO measles management" },
  { code: "MEASLES-AB",    name: "Amoxicillin (secondary infection)", diseaseTarget: "Measles",                 description: "Measles with bacterial superinfection" },
  // Mpox
  { code: "MPOX-SUPPORT",  name: "Supportive + Wound Care",          diseaseTarget: "Mpox",                    description: "Mild-moderate mpox management" },
  { code: "MPOX-TECOVIRI", name: "Tecovirimat 600mg BD 14 days",     diseaseTarget: "Mpox",                    description: "Severe mpox antiviral" },
  // Meningitis
  { code: "MENING-CEFTRI", name: "Ceftriaxone 2g IV BD 10 days",     diseaseTarget: "Bacterial Meningitis",    description: "Bacterial meningitis 1st-line" },
  { code: "MENING-DEXA",   name: "Dexamethasone 0.4mg/kg OD 4 days", diseaseTarget: "Bacterial Meningitis",    description: "Adjuvant for pneumococcal meningitis" },
  // Dysentery
  { code: "DYSEN-CIPRO",   name: "Ciprofloxacin 500mg BD 3 days",    diseaseTarget: "Bacillary Dysentery",     description: "Shigella dysentery treatment" },
  // Dengue
  { code: "DENGUE-SUPPORT",name: "IV Fluids + Paracetamol",          diseaseTarget: "Dengue Fever",            description: "Dengue supportive care" },
  // Pneumonia
  { code: "PNEUMO-AMOX",   name: "Amoxicillin 500mg TDS 5 days",     diseaseTarget: "Pneumonia",               description: "Community-acquired pneumonia mild-mod" },
  { code: "PNEUMO-CTX",    name: "Co-trimoxazole + Gentamicin",       diseaseTarget: "Pneumonia",               description: "Severe pneumonia" },
  // Other
  { code: "ECLAMPSIA-MgSO4",name: "MgSO4 Loading + Maintenance",     diseaseTarget: "Eclampsia",               description: "Eclampsia seizure management" },
  { code: "DM2-METFORMIN", name: "Metformin 500mg BD",               diseaseTarget: "Type 2 Diabetes",         description: "First-line oral hypoglycaemic" },
  { code: "HTN-AMLODIPINE",name: "Amlodipine 5-10mg OD",             diseaseTarget: "Hypertension",            description: "First-line antihypertensive" },
  { code: "DIARR-ORS-ZINC",name: "ORS + Zinc 10mg/day 10 days",      diseaseTarget: "Acute Diarrhoea",         description: "WHO diarrhoea management" },
];

// ---------------------------------------------------------------------------
// Facility Definitions (10 facilities, all 3 regions, spread across districts)
// ---------------------------------------------------------------------------

const FACILITY_DEFS = [
  // ── Central Region ────────────────────────────────────────────────────
  {
    facilityCode: "KCH-001", name: "Kamuzu Central Hospital",
    type: "Central Hospital", district: "Lilongwe", region: "Central",
    latitude: -13.9626, longitude: 33.7741,
    wards: [
      { name: "Male Medical Ward",   specialty: "General Medicine",            bedCapacity: 80 },
      { name: "Female Medical Ward", specialty: "General Medicine",            bedCapacity: 75 },
      { name: "TB Ward",             specialty: "Infectious Disease",          bedCapacity: 40 },
      { name: "Mpox Isolation Unit", specialty: "Infectious Disease",          bedCapacity: 15 },
      { name: "Paediatric Ward",     specialty: "Paediatrics",                bedCapacity: 60 },
      { name: "Maternity Ward",      specialty: "Obstetrics & Gynaecology",   bedCapacity: 50 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "Internal Medicine", count: 5 },
      { role: "Doctor",           department: "Paediatrics",       count: 3 },
      { role: "Clinical Officer", department: "Emergency",         count: 4 },
      { role: "Nurse",            department: "TB Ward",           count: 6 },
      { role: "Nurse",            department: "Maternity",         count: 4 },
      { role: "Lab Technician",   department: "Laboratory",        count: 4 },
    ],
  },
  {
    facilityCode: "KDH-001", name: "Kasungu District Hospital",
    type: "District Hospital", district: "Kasungu", region: "Central",
    latitude: -13.0333, longitude: 33.4833,
    wards: [
      { name: "General Ward",    specialty: "General Medicine",           bedCapacity: 40 },
      { name: "Paediatric Ward", specialty: "Paediatrics",               bedCapacity: 30 },
      { name: "Maternity Ward",  specialty: "Obstetrics & Gynaecology",  bedCapacity: 25 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "General",     count: 2 },
      { role: "Clinical Officer", department: "General",     count: 3 },
      { role: "Nurse",            department: "Paediatrics", count: 3 },
      { role: "Lab Technician",   department: "Laboratory",  count: 1 },
    ],
  },
  {
    facilityCode: "SDH-001", name: "Salima District Hospital",
    type: "District Hospital", district: "Salima", region: "Central",
    latitude: -13.7800, longitude: 34.4500,
    wards: [
      { name: "General Ward",      specialty: "General Medicine",           bedCapacity: 35 },
      { name: "Malaria Ward",      specialty: "Infectious Disease",         bedCapacity: 25 },
      { name: "Maternity Ward",    specialty: "Obstetrics & Gynaecology",  bedCapacity: 20 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "General",     count: 2 },
      { role: "Clinical Officer", department: "General",     count: 3 },
      { role: "Nurse",            department: "Malaria Ward",count: 3 },
      { role: "Lab Technician",   department: "Laboratory",  count: 1 },
    ],
  },
  // ── Northern Region ───────────────────────────────────────────────────
  {
    facilityCode: "MCH-001", name: "Mzuzu Central Hospital",
    type: "Central Hospital", district: "Mzimba", region: "Northern",
    latitude: -11.4655, longitude: 34.0179,
    wards: [
      { name: "Male Ward",         specialty: "General Medicine",   bedCapacity: 60 },
      { name: "Female Ward",       specialty: "General Medicine",   bedCapacity: 55 },
      { name: "TB/HIV Ward",       specialty: "Infectious Disease", bedCapacity: 35 },
      { name: "Measles Isolation", specialty: "Infectious Disease", bedCapacity: 20 },
      { name: "Paediatric Ward",   specialty: "Paediatrics",       bedCapacity: 45 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "Internal Medicine", count: 4 },
      { role: "Clinical Officer", department: "General",           count: 3 },
      { role: "Nurse",            department: "TB/HIV",            count: 5 },
      { role: "Lab Technician",   department: "Laboratory",        count: 2 },
    ],
  },
  {
    facilityCode: "KRH-001", name: "Karonga District Hospital",
    type: "District Hospital", district: "Karonga", region: "Northern",
    latitude: -9.9340, longitude: 33.9290,
    wards: [
      { name: "General Ward",      specialty: "General Medicine",   bedCapacity: 30 },
      { name: "Meningitis Isolation Ward", specialty: "Infectious Disease", bedCapacity: 15 },
      { name: "Maternity Ward",    specialty: "Obstetrics & Gynaecology", bedCapacity: 18 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "General",     count: 1 },
      { role: "Clinical Officer", department: "General",     count: 3 },
      { role: "Nurse",            department: "General",     count: 4 },
      { role: "Lab Technician",   department: "Laboratory",  count: 1 },
    ],
  },
  {
    facilityCode: "RDH-001", name: "Rumphi District Hospital",
    type: "District Hospital", district: "Rumphi", region: "Northern",
    latitude: -11.0100, longitude: 33.8600,
    wards: [
      { name: "General Ward",    specialty: "General Medicine", bedCapacity: 28 },
      { name: "Paediatric Ward", specialty: "Paediatrics",     bedCapacity: 20 },
    ],
    staffDefs: [
      { role: "Clinical Officer", department: "General",     count: 3 },
      { role: "Nurse",            department: "General",     count: 4 },
      { role: "Lab Technician",   department: "Laboratory",  count: 1 },
    ],
  },
  // ── Southern Region ───────────────────────────────────────────────────
  {
    facilityCode: "QEH-001", name: "Queen Elizabeth Central Hospital",
    type: "Central Hospital", district: "Blantyre", region: "Southern",
    latitude: -15.7861, longitude: 35.0058,
    wards: [
      { name: "Male Medical Ward",       specialty: "General Medicine",          bedCapacity: 90 },
      { name: "Female Medical Ward",     specialty: "General Medicine",          bedCapacity: 85 },
      { name: "Infectious Disease Ward", specialty: "Infectious Disease",        bedCapacity: 50 },
      { name: "Cholera Treatment Unit",  specialty: "Infectious Disease",        bedCapacity: 40 },
      { name: "Paediatric Ward",         specialty: "Paediatrics",              bedCapacity: 70 },
      { name: "Maternity Ward",          specialty: "Obstetrics & Gynaecology", bedCapacity: 55 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "Internal Medicine",   count: 6 },
      { role: "Doctor",           department: "Infectious Disease",  count: 3 },
      { role: "Clinical Officer", department: "General",             count: 5 },
      { role: "Nurse",            department: "Cholera Unit",        count: 8 },
      { role: "Nurse",            department: "Maternity",           count: 5 },
      { role: "Lab Technician",   department: "Laboratory",          count: 5 },
    ],
  },
  {
    facilityCode: "ZDH-001", name: "Zomba Central Hospital",
    type: "Central Hospital", district: "Zomba", region: "Southern",
    latitude: -15.3833, longitude: 35.3167,
    wards: [
      { name: "General Ward",           specialty: "General Medicine",          bedCapacity: 55 },
      { name: "Cholera Treatment Unit", specialty: "Infectious Disease",        bedCapacity: 30 },
      { name: "Maternity Ward",         specialty: "Obstetrics & Gynaecology", bedCapacity: 30 },
      { name: "TB Ward",                specialty: "Infectious Disease",        bedCapacity: 20 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "General",     count: 3 },
      { role: "Clinical Officer", department: "General",     count: 4 },
      { role: "Nurse",            department: "Cholera Unit",count: 5 },
      { role: "Lab Technician",   department: "Laboratory",  count: 2 },
    ],
  },
  {
    facilityCode: "MGH-001", name: "Mangochi District Hospital",
    type: "District Hospital", district: "Mangochi", region: "Southern",
    latitude: -14.4764, longitude: 35.2674,
    wards: [
      { name: "General Ward",    specialty: "General Medicine",   bedCapacity: 38 },
      { name: "Malaria Ward",    specialty: "Infectious Disease", bedCapacity: 28 },
      { name: "Paediatric Ward", specialty: "Paediatrics",       bedCapacity: 25 },
    ],
    staffDefs: [
      { role: "Doctor",           department: "General",      count: 2 },
      { role: "Clinical Officer", department: "General",      count: 3 },
      { role: "Nurse",            department: "Malaria Ward", count: 4 },
      { role: "Lab Technician",   department: "Laboratory",   count: 2 },
    ],
  },
  {
    facilityCode: "CKW-001", name: "Chikwawa District Hospital",
    type: "District Hospital", district: "Chikwawa", region: "Southern",
    latitude: -16.0333, longitude: 34.8000,
    wards: [
      { name: "General Ward",           specialty: "General Medicine",          bedCapacity: 32 },
      { name: "Cholera Treatment Unit", specialty: "Infectious Disease",        bedCapacity: 20 },
      { name: "Maternity Ward",         specialty: "Obstetrics & Gynaecology", bedCapacity: 18 },
    ],
    staffDefs: [
      { role: "Clinical Officer", department: "General",     count: 3 },
      { role: "Nurse",            department: "Cholera Unit",count: 4 },
      { role: "Lab Technician",   department: "Laboratory",  count: 1 },
    ],
  },
];

// Facility → districts it primarily serves (for assigning patients)
const FACILITY_DISTRICTS: Record<string, string[]> = {
  "KCH-001": ["Lilongwe", "Dowa", "Ntcheu", "Mchinji"],
  "KDH-001": ["Kasungu", "Ntchisi", "Nkhotakota"],
  "SDH-001": ["Salima", "Nkhotakota"],
  "MCH-001": ["Mzimba", "Rumphi", "Nkhata Bay"],
  "KRH-001": ["Karonga", "Chitipa", "Likoma"],
  "RDH-001": ["Rumphi", "Mzimba"],
  "QEH-001": ["Blantyre", "Chiradzulu", "Thyolo", "Mulanje"],
  "ZDH-001": ["Zomba", "Balaka", "Phalombe"],
  "MGH-001": ["Mangochi", "Machinga"],
  "CKW-001": ["Chikwawa", "Nsanje", "Mwanza"],
};

// ---------------------------------------------------------------------------
// Names & Demographics
// ---------------------------------------------------------------------------

const MALAWIAN_FIRST_NAMES_M = [
  "Chisomo","Kondwani","Limbani","Mphatso","Blessings","Innocent",
  "Gracious","Bright","Ernest","Felix","Gift","Happy","Isaac",
  "Justice","Kennedy","Lonjezo","Maxwell","Nathan","Owen",
  "Patrick","Raphael","Samuel","Tadala","Umali","Victor",
  "Watson","Yamikani","Zikani","Alfred","Brian","Enock","George",
];

const MALAWIAN_FIRST_NAMES_F = [
  "Chimwemwe","Thandeka","Mercy","Grace","Faith","Hope",
  "Precious","Loveness","Eviness","Alinafe","Beatrice","Catherine",
  "Doris","Edna","Florence","Gloria","Harriet","Irene",
  "Judith","Karen","Liness","Miriam","Naomi","Olive",
  "Priscilla","Queen","Rhoda","Stella","Theresa","Ursula","Wanangwa",
];

const MALAWIAN_SURNAMES = [
  "Phiri","Banda","Mwale","Tembo","Chirwa","Mvula","Gondwe",
  "Nkhoma","Lungu","Mkandawire","Chilonga","Mbewe","Zimba",
  "Sikelo","Mwanza","Kalua","Ngoma","Nyirenda","Msiska",
  "Kaunda","Khoza","Mfune","Kapira","Mtambo","Nthala",
  "Maulana","Khachale","Chalera","Maluwa","Chitseko","Kaponda",
];

const VILLAGES = [
  "Nkolokosa","Chigumula","Chitawira","Naperi","Mbayani",
  "Chilomoni","Lirangwe","Machinjiri","Zingwangwa","Ndirande",
  "Area 25","Area 47","Area 23","Biwi","Kauma","Mchesi",
  "Nkuyu","Khombedza","Kapiri","Mthunzi","Nsungwi",
  "Chamama","Malabada","Kachere","Chileka","Lunzu","Masasa",
];

const TRADITIONAL_AUTHORITIES = [
  "T/A Kapeni","T/A Lundu","T/A Blantyre","T/A Chigaru",
  "T/A Njewa","T/A Chitukula","T/A Chadza","T/A Mwanza",
  "T/A Mzukuzuku","T/A Chikulamayembe","T/A Mwase","T/A Karonga",
];

const PHONE_PREFIXES = ["0881","0882","0883","0884","0885","0991","0992","0993","0994"];
function malawianPhone() {
  return `${randomFrom(PHONE_PREFIXES)}${padId(randomInt(100000, 999999), 6)}`;
}

// ---------------------------------------------------------------------------
// Chief Complaints by Disease
// ---------------------------------------------------------------------------

const COMPLAINTS: Record<string, string[]> = {
  "Cholera":                ["Profuse watery diarrhoea", "Severe dehydration with rice-water stools", "Sudden onset vomiting and diarrhoea", "Rapid onset watery stools"],
  "Tuberculosis":           ["Persistent cough > 2 weeks", "Night sweats and weight loss", "Haemoptysis", "Chronic productive cough with fever"],
  "Malaria (P. falciparum)":["High fever with rigors", "Headache and fever", "Fever, vomiting, and prostration", "Altered consciousness with fever"],
  "Malaria (P. vivax)":     ["Relapsing fever", "Fever with chills every 48 hours", "Headache and myalgia with fever"],
  "HIV/AIDS":               ["Recurrent opportunistic infections", "Weight loss and chronic diarrhoea", "Persistent fever and lymphadenopathy", "Oral candidiasis and weight loss"],
  "Typhoid Fever":          ["Stepwise fever with abdominal pain", "Fever with rose spots on trunk", "Abdominal pain and constipation", "High fever with relative bradycardia"],
  "Measles":                ["Fever with maculopapular rash", "Koplik spots and rash", "Fever, cough, coryza, and conjunctivitis", "Rash spreading from face downward"],
  "Mpox":                   ["Fever with vesicular rash", "Painful skin lesions in multiple stages", "Rash on palms and soles with fever", "Lymphadenopathy with pustular lesions"],
  "Bacterial Meningitis":   ["Severe headache with neck stiffness", "Fever, photophobia, and neck stiffness", "Altered consciousness with headache", "Petechial rash with fever and headache"],
  "Bacillary Dysentery":    ["Bloody mucoid stool", "Frequent small-volume bloody stools", "Abdominal cramping with blood in stool"],
  "Dengue Fever":           ["High fever with retro-orbital pain", "Severe joint pain and rash", "Fever with rash and thrombocytopenia", "Bone-breaking fever with myalgia"],
  "Anthrax":                ["Painless skin ulcer with black eschar", "Sudden high fever with skin lesion", "Localised oedema around skin lesion"],
  "Whooping Cough":         ["Paroxysmal cough with whoop", "Prolonged cough fits in child", "Cough ending with inspiratory whoop"],
  "Schistosomiasis":        ["Haematuria", "Blood in urine", "Abdominal pain with blood in stool"],
  "Acute Diarrhoea":        ["Loose stools > 3 per day", "Watery stools and abdominal cramps", "Diarrhoea with dehydration"],
  "Pneumonia":              ["Cough with purulent sputum", "Chest pain and fever", "Difficulty breathing with fever"],
  "Type 2 Diabetes":        ["Polydipsia and polyuria", "Blurred vision and fatigue", "Numbness in feet"],
  "Hypertension":           ["Persistent headache", "Dizziness and blurred vision", "Elevated BP on routine check"],
  "Eclampsia":              ["Seizures in third trimester", "Convulsions post-partum", "Severe headache with visual disturbances"],
  "GI Haemorrhage":         ["Vomiting blood", "Coffee-ground haematemesis", "Melaena with dizziness"],
  "Asthma":                 ["Wheezing and shortness of breath", "Nocturnal cough with wheeze", "Acute bronchospasm"],
  "Neonatal Tetanus":       ["Neonatal inability to suckle", "Trismus in newborn", "Neonatal stiffness and spasms"],
  "Rabies":                 ["Hydrophobia", "Wound from animal bite with fever", "Aerophobia and agitation"],
  "default":                ["General malaise", "Fever and body aches", "Weakness and loss of appetite"],
};

// ---------------------------------------------------------------------------
// Lab Tests by Disease
// ---------------------------------------------------------------------------

const LAB_TESTS: Record<string, Array<{ testName: string; testCode: string; sampleType: string }>> = {
  "Malaria (P. falciparum)": [
    { testName: "Malaria RDT (PfHRP2)",        testCode: "MRDTPF",    sampleType: "Blood"  },
    { testName: "Thick Blood Film",             testCode: "TBFMAL",    sampleType: "Blood"  },
    { testName: "Full Blood Count",             testCode: "FBC",       sampleType: "Blood"  },
  ],
  "Malaria (P. vivax)": [
    { testName: "Malaria RDT (Pan)",            testCode: "MRDTPAN",   sampleType: "Blood"  },
    { testName: "Thick Blood Film",             testCode: "TBFMAL",    sampleType: "Blood"  },
  ],
  "Tuberculosis": [
    { testName: "TB GeneXpert MTB/RIF",         testCode: "GENEXPERT", sampleType: "Sputum" },
    { testName: "Sputum Smear Microscopy",      testCode: "SSPSMEAR",  sampleType: "Sputum" },
    { testName: "Chest X-Ray",                  testCode: "CXR",       sampleType: "Imaging"},
  ],
  "HIV/AIDS": [
    { testName: "HIV ELISA",                    testCode: "HIVELISA",  sampleType: "Blood"  },
    { testName: "CD4 Count",                    testCode: "CD4COUNT",  sampleType: "Blood"  },
    { testName: "HIV Viral Load",               testCode: "HIVVL",     sampleType: "Blood"  },
  ],
  "Cholera": [
    { testName: "Stool Culture",                testCode: "STOOLCX",   sampleType: "Stool"  },
    { testName: "Cholera RDT",                  testCode: "CHORDTPF",  sampleType: "Stool"  },
  ],
  "Typhoid Fever": [
    { testName: "Widal Test",                   testCode: "WIDALTEST", sampleType: "Blood"  },
    { testName: "Blood Culture (Salmonella)",   testCode: "BLOODCX",   sampleType: "Blood"  },
    { testName: "Full Blood Count",             testCode: "FBC",       sampleType: "Blood"  },
  ],
  "Measles": [
    { testName: "Measles IgM Serology",         testCode: "MEASIGM",   sampleType: "Blood"  },
    { testName: "Measles PCR",                  testCode: "MEASPCR",   sampleType: "Throat Swab"},
  ],
  "Mpox": [
    { testName: "Mpox PCR (Lesion Swab)",       testCode: "MPOXPCR",   sampleType: "Lesion Swab"},
    { testName: "Orthopoxvirus Electron Microscopy", testCode: "POXEM", sampleType: "Lesion Fluid"},
  ],
  "Bacterial Meningitis": [
    { testName: "CSF Culture & Sensitivity",    testCode: "CSFCX",     sampleType: "CSF"    },
    { testName: "CSF Gram Stain",               testCode: "CSFGRAM",   sampleType: "CSF"    },
    { testName: "Cryptococcal Antigen (CrAg)",  testCode: "CRAG",      sampleType: "CSF"    },
  ],
  "Bacillary Dysentery": [
    { testName: "Stool Microscopy & Culture",   testCode: "STOOLMC",   sampleType: "Stool"  },
    { testName: "Shigella PCR",                 testCode: "SHIGPCR",   sampleType: "Stool"  },
  ],
  "Dengue Fever": [
    { testName: "Dengue NS1 Antigen RDT",       testCode: "DENNS1",    sampleType: "Blood"  },
    { testName: "Dengue IgM/IgG Serology",      testCode: "DENSERLO",  sampleType: "Blood"  },
  ],
  "Pneumonia": [
    { testName: "Full Blood Count",             testCode: "FBC",       sampleType: "Blood"  },
    { testName: "Sputum Culture",               testCode: "SPUCX",     sampleType: "Sputum" },
    { testName: "Chest X-Ray",                  testCode: "CXR",       sampleType: "Imaging"},
  ],
  "default": [
    { testName: "Full Blood Count",             testCode: "FBC",       sampleType: "Blood"  },
    { testName: "Malaria RDT",                  testCode: "MRDTPF",    sampleType: "Blood"  },
    { testName: "Urine Dipstick",               testCode: "URINEDIP",  sampleType: "Urine"  },
  ],
};

// ---------------------------------------------------------------------------
// Disease → Protocol mapping
// ---------------------------------------------------------------------------

const DISEASE_PROTOCOLS: Record<string, string[]> = {
  "Tuberculosis":            ["TB-CAT1", "TB-CAT2"],
  "Malaria (P. falciparum)": ["MALARIA-AL3", "MALARIA-IV-ART"],
  "Malaria (P. vivax)":      ["MALARIA-AL3"],
  "Cholera":                 ["CHOLERA-ORS", "CHOLERA-IV"],
  "HIV/AIDS":                ["HIV-NNRTI-1L", "HIV-NNRTI-2L"],
  "Typhoid Fever":           ["TYPHOID-CIPRO", "TYPHOID-CEFTRI"],
  "Measles":                 ["MEASLES-VIT-A", "MEASLES-AB"],
  "Mpox":                    ["MPOX-SUPPORT", "MPOX-TECOVIRI"],
  "Bacterial Meningitis":    ["MENING-CEFTRI", "MENING-DEXA"],
  "Bacillary Dysentery":     ["DYSEN-CIPRO"],
  "Dengue Fever":            ["DENGUE-SUPPORT"],
  "Pneumonia":               ["PNEUMO-AMOX", "PNEUMO-CTX"],
  "Acute Diarrhoea":         ["DIARR-ORS-ZINC"],
  "Eclampsia":               ["ECLAMPSIA-MgSO4"],
  "Type 2 Diabetes":         ["DM2-METFORMIN"],
  "Hypertension":            ["HTN-AMLODIPINE"],
};

// ---------------------------------------------------------------------------
// Encounter builder (reused for both normal and outbreak encounters)
// ---------------------------------------------------------------------------

interface EncounterInput {
  patientId: string;
  facilityId: string;
  wardsByFacility: Record<string, string[]>;
  staffByFacility: Record<string, string[]>;
  diseaseMap: Record<string, string>;
  protocolMap: Record<string, string>;
  primaryDiseaseName: string;
  admittedAt: Date;
  confirmedRate?: number; // override default 0.65
}

async function seedEncounter(input: EncounterInput): Promise<void> {
  const {
    patientId, facilityId, wardsByFacility, staffByFacility,
    diseaseMap, protocolMap, primaryDiseaseName, admittedAt,
    confirmedRate = 0.65,
  } = input;

  const wards = wardsByFacility[facilityId] ?? [];
  const staffList = staffByFacility[facilityId] ?? [];

  const wardId = wards.length > 0 && Math.random() > 0.2 ? randomFrom(wards) : null;
  const attendingStaffId = staffList.length > 0 ? randomFrom(staffList) : null;

  const encounterType: EncounterType = randomFrom([
    "OUTPATIENT","INPATIENT","INPATIENT","EMERGENCY","FOLLOW_UP","REFERRAL",
  ]);

  const isDischargedEncounter = Math.random() > 0.15;
  const lengthOfStay = randomInt(1, 30);
  const dischargedAt = isDischargedEncounter ? addDays(admittedAt, lengthOfStay) : null;

  const status: EncounterStatus = !isDischargedEncounter
    ? "ACTIVE"
    : randomFrom(["DISCHARGED","DISCHARGED","DISCHARGED","TRANSFERRED","DECEASED","ABSCONDED"]);

  const complaint = randomFrom(COMPLAINTS[primaryDiseaseName] ?? COMPLAINTS["default"]!);

  const encounter = await prisma.patientEncounter.create({
    data: {
      patientId,
      facilityId,
      wardId,
      attendingStaffId,
      encounterType,
      status,
      admittedAt,
      dischargedAt,
      chiefComplaint: complaint,
      notes: Math.random() > 0.5
        ? `Patient presented with ${complaint.toLowerCase()}. Managed per protocol.`
        : null,
    },
  });

  // Diagnoses (1-3)
  const diseaseNames = Object.keys(diseaseMap);
  const numDiagnoses = randomInt(1, 3);
  const chosenDiseases = [primaryDiseaseName];
  for (let d = 1; d < numDiagnoses; d++) {
    const sec = randomFrom(diseaseNames);
    if (!chosenDiseases.includes(sec)) chosenDiseases.push(sec);
  }

  for (let di = 0; di < chosenDiseases.length; di++) {
    const dName = chosenDiseases[di]!;
    const diseaseId = diseaseMap[dName];
    if (!diseaseId) continue;

    // Primary disease uses configurable confirm rate; secondaries always random
    const isPrimary = di === 0;
    const isConfirmed = isPrimary ? Math.random() < confirmedRate : Math.random() < 0.5;

    await prisma.diagnosis.create({
      data: {
        encounterId: encounter.id,
        diseaseId,
        diagnosedById: attendingStaffId,
        status: isConfirmed ? "CONFIRMED" : (Math.random() > 0.4 ? "SUSPECTED" : "RULED_OUT") as DiagnosisStatus,
        isPrimary,
        diagnosedAt: addDays(admittedAt, randomInt(0, 2)),
        notes: Math.random() > 0.6 ? "Diagnosed based on clinical presentation and lab evidence." : null,
      },
    });
  }

  // Treatment (1-2)
  const protoKeys = DISEASE_PROTOCOLS[primaryDiseaseName];
  const chosenProtoCode = protoKeys ? randomFrom(protoKeys) : null;
  const protocolId = chosenProtoCode ? protocolMap[chosenProtoCode] ?? null : null;

  const treatmentStatus: TreatmentStatus = randomFrom([
    "ONGOING","COMPLETED","COMPLETED","DISCONTINUED","FAILED",
  ]);
  const txStart = addDays(admittedAt, randomInt(0, 1));
  const txEnd = treatmentStatus !== "ONGOING" ? addDays(txStart, randomInt(3, 28)) : null;

  await prisma.treatment.create({
    data: {
      encounterId: encounter.id,
      protocolId,
      drugName: protocolId ? null : randomFrom(["Paracetamol","Ibuprofen","Amoxicillin","Cotrimoxazole","Metronidazole"]),
      dosage: randomFrom(["500mg","250mg","1g","200mg","5mg/kg"]),
      route: randomFrom(["Oral","IV","IM","Oral"]),
      frequency: randomFrom(["Once daily","Twice daily","Three times daily","Four times daily","As needed"]),
      startDate: txStart,
      endDate: txEnd,
      durationDays: txEnd ? Math.round((txEnd.getTime() - txStart.getTime()) / 86400000) : null,
      status: treatmentStatus,
      discontinuedReason: treatmentStatus === "DISCONTINUED"
        ? randomFrom(["Adverse reaction","Patient defaulted","Drug unavailable","Treatment completed early"])
        : null,
    },
  });

  // Lab Results (1-3)
  const labTests = LAB_TESTS[primaryDiseaseName] ?? LAB_TESTS["default"]!;
  const numTests = randomInt(1, Math.min(3, labTests.length));

  for (let li = 0; li < numTests; li++) {
    const test = randomFrom(labTests);
    const sampleStatus: SampleStatus = randomFrom([
      "RESULTED","RESULTED","RESULTED","PENDING","PROCESSING","CANCELLED",
    ]);
    const orderedAt = admittedAt;
    const collectedAt = sampleStatus !== "PENDING" ? addDays(orderedAt, randomInt(0, 1)) : null;
    const resultedAt  = sampleStatus === "RESULTED" ? addDays(collectedAt ?? orderedAt, randomInt(1, 3)) : null;

    const isPositive = Math.random() > 0.35;
    let resultValue: string | null = null;

    if (sampleStatus === "RESULTED") {
      switch (test.testCode) {
        case "MRDTPF":    resultValue = isPositive ? "Positive" : "Negative"; break;
        case "MRDTPAN":   resultValue = isPositive ? "Positive (Pan)" : "Negative"; break;
        case "GENEXPERT": resultValue = isPositive ? "MTB DETECTED — Low" : "MTB NOT DETECTED"; break;
        case "HIVELISA":  resultValue = isPositive ? "Reactive" : "Non-Reactive"; break;
        case "CD4COUNT":  resultValue = `${randomInt(50, 900)} cells/µL`; break;
        case "HIVVL":     resultValue = isPositive ? `${randomInt(200, 750000)} copies/mL` : "< 50 copies/mL (undetectable)"; break;
        case "WIDALTEST": resultValue = isPositive ? "O >1:160, H >1:160" : "O <1:40, H <1:40"; break;
        case "FBC":       resultValue = `Hb ${randomFloat(6, 15)}g/dL, WBC ${randomFloat(3, 18)}×10⁹/L, Plt ${randomInt(80, 450)}×10⁹/L`; break;
        case "MEASIGM":   resultValue = isPositive ? "Positive (IgM detected)" : "Negative"; break;
        case "MEASPCR":   resultValue = isPositive ? "Detected" : "Not Detected"; break;
        case "MPOXPCR":   resultValue = isPositive ? "Positive (MPXV detected)" : "Negative"; break;
        case "CSFCX":     resultValue = isPositive ? randomFrom(["S. pneumoniae","N. meningitidis","H. influenzae"]) + " isolated" : "No growth"; break;
        case "CSFGRAM":   resultValue = isPositive ? "Gram-positive diplococci seen" : "No organisms seen"; break;
        case "DENNS1":    resultValue = isPositive ? "NS1 Positive" : "NS1 Negative"; break;
        case "STOOLCX":   resultValue = isPositive ? "V. cholerae O1 isolated" : "No pathogens isolated"; break;
        case "STOOLMC":   resultValue = isPositive ? "Shigella spp. isolated" : "No pathogens isolated"; break;
        default:          resultValue = isPositive ? "Positive" : "Negative";
      }
    }

    await prisma.labResult.create({
      data: {
        encounterId: encounter.id,
        testName:  test.testName,
        testCode:  test.testCode,
        sampleType: test.sampleType,
        status: sampleStatus,
        orderedAt,
        collectedAt,
        resultedAt,
        resultValue,
        resultUnit: test.testCode === "CD4COUNT" ? "cells/µL" : null,
        referenceRange: test.testCode === "CD4COUNT" ? "500–1500 cells/µL" : null,
        isPositive: sampleStatus === "RESULTED" ? isPositive : null,
      },
    });
  }

  // Vital Signs (2-5 sets)
  const numVitals = randomInt(2, 5);
  for (let vi = 0; vi < numVitals; vi++) {
    await prisma.vitalSigns.create({
      data: {
        encounterId: encounter.id,
        recordedAt: addDays(admittedAt, vi),
        temperatureC: randomFloat(36.0, 40.5),
        systolicBP:   randomInt(80, 185),
        diastolicBP:  randomInt(50, 115),
        pulseRate:    randomInt(50, 135),
        respiratoryRate: randomInt(12, 38),
        oxygenSatPct: randomFloat(88.0, 100.0),
        weightKg:     randomFloat(20.0, 115.0),
        heightCm:     Math.random() > 0.5 ? randomFloat(100, 195) : null,
      },
    });
  }

  // Outcome (if discharged)
  if (isDischargedEncounter && dischargedAt) {
    let result: OutcomeResult;
    if      (status === "DECEASED")    result = "DECEASED";
    else if (status === "TRANSFERRED") result = "TRANSFERRED";
    else result = randomFrom(["RECOVERED","RECOVERED","RECOVERED","IMPROVED","IMPROVED","UNCHANGED","DETERIORATED","LOST_TO_FOLLOW_UP"]);

    await prisma.encounterOutcome.create({
      data: {
        encounterId: encounter.id,
        result,
        recordedAt: dischargedAt,
        lengthOfStayDays: lengthOfStay,
        wasReadmission: Math.random() > 0.85,
        readmittedWithin30Days: Math.random() > 0.9,
        causeOfDeath: result === "DECEASED"
          ? randomFrom(["A15.0","B50.0","A00.0","J18.0","B20.0","G00.9","B05.0"])
          : null,
        notes: result === "DECEASED" ? "Patient expired despite treatment. Family notified." : null,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting MDSS seed v2…\n");

  // ── Diseases ──────────────────────────────────────────────────────────
  console.log("🦠 Seeding diseases…");
  const diseaseMap: Record<string, string> = {};
  for (const d of DISEASES) {
    const disease = await prisma.disease.upsert({
      where: { icd10Code: d.icdCode },
      update: {},
      create: {
        icd10Code: d.icdCode,
        name: d.name,
        category: d.category,
        isNotifiable: d.isNotifiable,
        isTrackedByMDSS: true,
      },
    });
    diseaseMap[d.name] = disease.id;
  }
  console.log(`   ✅ ${DISEASES.length} diseases seeded`);

  // ── Treatment Protocols ────────────────────────────────────────────────
  console.log("💊 Seeding treatment protocols…");
  const protocolMap: Record<string, string> = {};
  for (const p of PROTOCOLS) {
    const proto = await prisma.treatmentProtocol.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, isActive: true },
    });
    protocolMap[p.code] = proto.id;
  }
  console.log(`   ✅ ${PROTOCOLS.length} protocols seeded`);

  // ── Facilities, Wards, Staff ───────────────────────────────────────────
  console.log("🏥 Seeding facilities, wards, and staff…");

  const facilityIds: string[] = [];
  const facilityCodeToId: Record<string, string> = {};
  const wardsByFacility: Record<string, string[]> = {};
  const staffByFacility: Record<string, string[]> = {};
  let staffCounter = 1;

  for (const fDef of FACILITY_DEFS) {
    const facility = await prisma.facility.upsert({
      where: { facilityCode: fDef.facilityCode },
      update: {},
      create: {
        facilityCode: fDef.facilityCode,
        name: fDef.name,
        type: fDef.type,
        district: fDef.district,
        region: fDef.region,
        latitude: fDef.latitude,
        longitude: fDef.longitude,
        isActive: true,
      },
    });

    facilityIds.push(facility.id);
    facilityCodeToId[fDef.facilityCode] = facility.id;
    wardsByFacility[facility.id] = [];
    staffByFacility[facility.id] = [];

    for (const wDef of fDef.wards) {
      const ward = await prisma.ward.create({
        data: {
          facilityId: facility.id,
          name: wDef.name,
          specialty: wDef.specialty,
          bedCapacity: wDef.bedCapacity,
          isActive: true,
        },
      });
      wardsByFacility[facility.id]!.push(ward.id);
    }

    for (const sDef of fDef.staffDefs) {
      for (let i = 0; i < sDef.count; i++) {
        const isMale = Math.random() > 0.4;
        const firstName = randomFrom(isMale ? MALAWIAN_FIRST_NAMES_M : MALAWIAN_FIRST_NAMES_F);
        const lastName  = randomFrom(MALAWIAN_SURNAMES);
        const staffCode = `${fDef.facilityCode}-ST-${padId(staffCounter++, 4)}`;
        const staff = await prisma.staff.create({
          data: {
            facilityId: facility.id,
            staffCode,
            firstName,
            lastName,
            role: sDef.role,
            department: sDef.department,
            isActive: true,
          },
        });
        staffByFacility[facility.id]!.push(staff.id);
      }
    }
  }

  const totalWards = Object.values(wardsByFacility).reduce((s, w) => s + w.length, 0);
  const totalStaff = Object.values(staffByFacility).reduce((s, st) => s + st.length, 0);
  console.log(`   ✅ ${FACILITY_DEFS.length} facilities | ${totalWards} wards | ${totalStaff} staff`);

  // ── Patients (500) ────────────────────────────────────────────────────
  console.log("👤 Seeding 500 patients across all 28 districts…");

  // For each facility, keep a list of patient IDs from its service area
  const patientsByFacilityCode: Record<string, string[]> = {};
  for (const fDef of FACILITY_DEFS) patientsByFacilityCode[fDef.facilityCode] = [];

  const allPatientIds: string[] = [];
  let hpnCounter = 20000001;

  for (let i = 0; i < 500; i++) {
    // Spread patients across all 28 districts uniformly
    const district = ALL_DISTRICTS[i % ALL_DISTRICTS.length]!;
    const region   = DISTRICT_TO_REGION[district] ?? "Central";

    const isMale  = Math.random() > 0.48;
    const sex: Sex = isMale ? "MALE" : Math.random() > 0.02 ? "FEMALE" : "OTHER";
    const firstName = randomFrom(isMale ? MALAWIAN_FIRST_NAMES_M : MALAWIAN_FIRST_NAMES_F);
    const lastName  = randomFrom(MALAWIAN_SURNAMES);
    const dob = randomDate(new Date("1948-01-01"), new Date("2022-12-31"));

    const patient = await prisma.patient.create({
      data: {
        dateOfBirth: dob,
        sex,
        nationality: "Malawian",
        village: randomFrom(VILLAGES),
        traditionalAuthority: randomFrom(TRADITIONAL_AUTHORITIES),
        district,
        region,
        isActive: true,
      },
    });

    allPatientIds.push(patient.id);

    // Assign patient to facilities that serve their district
    for (const [fCode, fDistricts] of Object.entries(FACILITY_DISTRICTS)) {
      if (fDistricts.includes(district)) {
        patientsByFacilityCode[fCode]?.push(patient.id);
      }
    }
    // Fallback: assign to a random facility so no patient is orphaned
    if (!Object.values(patientsByFacilityCode).some((ids) => ids.includes(patient.id))) {
      const fallbackCode = randomFrom(Object.keys(patientsByFacilityCode));
      patientsByFacilityCode[fallbackCode]?.push(patient.id);
    }

    // Identifiers
    const hasHPN = Math.random() > 0.1;
    const hasNID = Math.random() > 0.3;

    if (hasHPN) {
      await prisma.patientIdentifier.create({
        data: {
          patientId: patient.id,
          identifierType: "HPN",
          identifierValue: `HPN-${padId(hpnCounter++, 8)}`,
          isPrimary: true,
          isVerified: Math.random() > 0.2,
          issuedBy: "Ministry of Health",
        },
      });
    }
    if (hasNID) {
      await prisma.patientIdentifier.create({
        data: {
          patientId: patient.id,
          identifierType: "NID",
          identifierValue: `NRB-${padId(randomInt(10000000, 99999999), 8)}`,
          isPrimary: !hasHPN,
          isVerified: Math.random() > 0.4,
          issuedBy: "National Registration Bureau",
        },
      });
    }
    if (!hasHPN && !hasNID) {
      await prisma.patientIdentifier.create({
        data: {
          patientId: patient.id,
          identifierType: "HOSPITAL_ID",
          identifierValue: `HID-${padId(randomInt(100000, 999999), 6)}`,
          isPrimary: true,
          isVerified: false,
          issuedBy: "Facility",
        },
      });
    }

    if (Math.random() > 0.2) {
      await prisma.patientContact.create({
        data: {
          patientId: patient.id,
          phone: malawianPhone(),
          altPhone: Math.random() > 0.5 ? malawianPhone() : null,
          nextOfKin: `${randomFrom(MALAWIAN_FIRST_NAMES_M)} ${randomFrom(MALAWIAN_SURNAMES)}`,
          nokPhone: malawianPhone(),
          nokRelation: randomFrom(["Spouse","Parent","Sibling","Child","Uncle/Aunt"]),
        },
      });
    }
  }

  console.log(`   ✅ 500 patients seeded across all 28 districts`);

  // ── Background Encounters (1 000 random) ──────────────────────────────
  console.log("🏨 Seeding 1 000 background encounters…");

  const diseaseNames = Object.keys(diseaseMap);
  const encounterWindowStart = new Date("2024-01-01");
  const encounterWindowEnd   = new Date("2025-03-31");
  let encounterCount = 0;

  for (let i = 0; i < 1000; i++) {
    const fDef = randomFrom(FACILITY_DEFS);
    const facilityId = facilityCodeToId[fDef.facilityCode]!;
    const facilityPatients = patientsByFacilityCode[fDef.facilityCode] ?? allPatientIds;
    const patientId = randomFrom(facilityPatients.length > 0 ? facilityPatients : allPatientIds);

    // Weight disease selection: core MDSS diseases appear more often
    const primaryDiseaseName = weightedFrom([
      { value: "Malaria (P. falciparum)", weight: 15 },
      { value: "HIV/AIDS",                weight: 12 },
      { value: "Tuberculosis",            weight: 10 },
      { value: "Cholera",                 weight:  8 },
      { value: "Typhoid Fever",           weight:  7 },
      { value: "Pneumonia",               weight:  7 },
      { value: "Acute Diarrhoea",         weight:  6 },
      { value: "Measles",                 weight:  4 },
      { value: "Bacterial Meningitis",    weight:  3 },
      { value: "Mpox",                    weight:  2 },
      { value: "Malaria (P. vivax)",      weight:  3 },
      { value: "Bacillary Dysentery",     weight:  3 },
      { value: "Dengue Fever",            weight:  2 },
      { value: "Type 2 Diabetes",         weight:  4 },
      { value: "Hypertension",            weight:  4 },
      { value: "Eclampsia",               weight:  3 },
      { value: "Schistosomiasis",         weight:  2 },
      { value: "Whooping Cough",          weight:  2 },
      { value: "Anthrax",                 weight:  1 },
      { value: "Asthma",                  weight:  2 },
    ]);

    if (!diseaseMap[primaryDiseaseName]) continue;

    const admittedAt = randomDate(encounterWindowStart, encounterWindowEnd);

    await seedEncounter({
      patientId,
      facilityId,
      wardsByFacility,
      staffByFacility,
      diseaseMap,
      protocolMap,
      primaryDiseaseName,
      admittedAt,
    });

    encounterCount++;
    if (encounterCount % 100 === 0) console.log(`   … ${encounterCount} encounters created`);
  }

  console.log(`   ✅ ${encounterCount} background encounters seeded`);

  // ── Outbreak Encounters ───────────────────────────────────────────────
  console.log("\n🚨 Seeding outbreak saturation clusters…");

  let outbreakTotal = 0;

  for (const outbreak of OUTBREAK_CONFIGS) {
    const windowStart = new Date(outbreak.windowStart);
    const windowEnd   = new Date(outbreak.windowEnd);

    // Find facilities that serve the outbreak districts
    const relevantFacilityCodes = Object.entries(FACILITY_DISTRICTS)
      .filter(([, fDistricts]) => fDistricts.some((d) => outbreak.districts.includes(d)))
      .map(([code]) => code);

    // Fallback: all facilities
    const candidateFacilityCodes = relevantFacilityCodes.length > 0
      ? relevantFacilityCodes
      : FACILITY_DEFS.map((f) => f.facilityCode);

    // Find patients from outbreak districts
    const outbreakPatientIds: string[] = [];
    for (const fCode of candidateFacilityCodes) {
      const fps = patientsByFacilityCode[fCode] ?? [];
      outbreakPatientIds.push(...fps);
    }
    const candidatePatients = outbreakPatientIds.length > 0 ? [...new Set(outbreakPatientIds)] : allPatientIds;

    console.log(
      `   💥 ${outbreak.diseaseName}: ${outbreak.extraEncounters} extra encounters` +
      ` in [${outbreak.districts.join(", ")}] between ${outbreak.windowStart} → ${outbreak.windowEnd}`
    );

    for (let i = 0; i < outbreak.extraEncounters; i++) {
      const fCode = randomFrom(candidateFacilityCodes);
      const facilityId = facilityCodeToId[fCode];
      if (!facilityId) continue;

      const patientId = randomFrom(candidatePatients);
      const admittedAt = randomDate(windowStart, windowEnd);

      if (!diseaseMap[outbreak.diseaseName]) continue;

      await seedEncounter({
        patientId,
        facilityId,
        wardsByFacility,
        staffByFacility,
        diseaseMap,
        protocolMap,
        primaryDiseaseName: outbreak.diseaseName,
        admittedAt,
        confirmedRate: outbreak.confirmedRate,
      });

      outbreakTotal++;
    }

    console.log(`      ✅ Done`);
  }

  const totalEncounters = encounterCount + outbreakTotal;
  console.log(`\n   ✅ ${outbreakTotal} outbreak encounters seeded`);
  console.log(`   ✅ TOTAL encounters: ${totalEncounters}`);

  // ── API Sync Logs ────────────────────────────────────────────────────
  console.log("\n🔄 Seeding API sync logs…");

  const endpoints = ["/api/encounters","/api/patients","/api/diagnoses","/api/lab-results","/api/outcomes","/api/outbreaks"];
  for (let i = 0; i < 80; i++) {
    const startedAt = randomDate(new Date("2024-01-01"), new Date("2025-03-31"));
    const success = Math.random() > 0.08;
    await prisma.apiSyncLog.create({
      data: {
        requestedBy: `MDSS-${randomFrom(["ANALYTICS","ETL","DASHBOARD","ALERT","OUTBREAK-MONITOR"])}`,
        endpoint: randomFrom(endpoints),
        queryParams: {
          facilityCode: randomFrom(FACILITY_DEFS).facilityCode,
          dateFrom: startedAt.toISOString().split("T")[0],
          dateTo: addDays(startedAt, 7).toISOString().split("T")[0],
        },
        recordsReturned: success ? randomInt(10, 800) : null,
        syncStartedAt: startedAt,
        syncCompletedAt: success ? addDays(startedAt, 0) : null,
        success,
        errorMessage: !success
          ? randomFrom(["Connection timeout","Authentication failed","Facility offline","Rate limit exceeded","Sync conflict"])
          : null,
      },
    });
  }
  console.log(`   ✅ 80 API sync logs seeded`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log("\n🎉 Seed v2 complete! Summary:");
  console.log(`   Diseases:              ${DISEASES.length}`);
  console.log(`   Treatment Protocols:   ${PROTOCOLS.length}`);
  console.log(`   Facilities:            ${FACILITY_DEFS.length}`);
  console.log(`   Wards:                 ${totalWards}`);
  console.log(`   Staff:                 ${totalStaff}`);
  console.log(`   Patients:              500 (all 28 districts)`);
  console.log(`   Background Encounters: ${encounterCount}`);
  console.log(`   Outbreak Encounters:   ${outbreakTotal}`);
  console.log(`   Total Encounters:      ${totalEncounters}`);
  console.log(`   API Sync Logs:         80`);
  console.log("\n🔴 Outbreak clusters loaded:");
  for (const ob of OUTBREAK_CONFIGS) {
    console.log(`   • ${ob.diseaseName.padEnd(25)} → ${ob.districts.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
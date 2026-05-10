/**
 * MDSS Hospital Simulation — Comprehensive Seed Script
 *
 * Generates realistic Malawian hospital data:
 *   - 5 Facilities across all 3 regions
 *   - ~15 Wards
 *   - ~40 Staff members
 *   - 200 Patients with identifiers and contact info
 *   - 400+ Encounters with diagnoses, treatments, vitals, lab results, outcomes
 *   - Disease catalogue (notifiable diseases relevant to Malawi)
 *   - Treatment protocol catalogue
 *   - API sync logs
 *
 * Run with:
 *   npx ts-node seed.ts
 * or via your Prisma seed script in package.json.
 */
import "dotenv/config";
import { PrismaClient, Sex, EncounterType, EncounterStatus, DiagnosisStatus, TreatmentStatus, OutcomeResult, IdentifierType, SampleStatus } from "./generated/prisma/client";

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
  if (arr.length === 0) {
    throw new Error("randomFrom requires a non-empty array");
  }
  const index = Math.floor(Math.random() * arr.length);
  return arr[index]!;
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
// Reference Data
// ---------------------------------------------------------------------------

const MALAWI_DISTRICTS = [
  "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu",
  "Dedza", "Ntcheu", "Mangochi", "Salima", "Nkhotakota",
  "Rumphi", "Chitipa", "Karonga", "Mzimba", "Dowa",
  "Balaka", "Phalombe", "Machinga", "Chiradzulu", "Thyolo",
];

const MALAWI_REGIONS: Record<string, string[]> = {
  Northern: ["Rumphi", "Chitipa", "Karonga", "Mzimba", "Nkhata Bay"],
  Central: ["Lilongwe", "Kasungu", "Dedza", "Ntcheu", "Dowa", "Salima", "Nkhotakota"],
  Southern: ["Blantyre", "Zomba", "Mangochi", "Balaka", "Phalombe", "Machinga", "Chiradzulu", "Thyolo"],
};

const DISTRICT_TO_REGION: Record<string, string> = {};
for (const [region, districts] of Object.entries(MALAWI_REGIONS)) {
  for (const d of districts) DISTRICT_TO_REGION[d] = region;
}

const MALAWIAN_FIRST_NAMES_M = [
  "Chisomo", "Kondwani", "Limbani", "Mphatso", "Blessings", "Innocent",
  "Gracious", "Bright", "Ernest", "Felix", "Gift", "Happy", "Isaac",
  "Justice", "Kennedy", "Lonjezo", "Maxwell", "Nathan", "Owen",
  "Patrick", "Raphael", "Samuel", "Tadala", "Umali", "Victor",
  "Watson", "Xavier", "Yamikani", "Zikani", "Alfred", "Brian",
];

const MALAWIAN_FIRST_NAMES_F = [
  "Chimwemwe", "Thandeka", "Mercy", "Grace", "Faith", "Hope",
  "Precious", "Loveness", "Eviness", "Alinafe", "Beatrice", "Catherine",
  "Doris", "Edna", "Florence", "Gloria", "Harriet", "Irene",
  "Judith", "Karen", "Liness", "Miriam", "Naomi", "Olive",
  "Priscilla", "Queen", "Rhoda", "Stella", "Theresa", "Ursula",
];

const MALAWIAN_SURNAMES = [
  "Phiri", "Banda", "Mwale", "Tembo", "Chirwa", "Mvula", "Gondwe",
  "Nkhoma", "Lungu", "Mkandawire", "Chilonga", "Mbewe", "Zimba",
  "Sikelo", "Mwanza", "Kalua", "Ngoma", "Nyirenda", "Msiska",
  "Kaunda", "Khoza", "Mfune", "Kapira", "Mtambo", "Nthala",
  "Maulana", "Khachale", "Chalera", "Maluwa", "Chitseko",
];

const VILLAGES = [
  "Nkolokosa", "Chigumula", "Chitawira", "Naperi", "Mbayani",
  "Chilomoni", "Lirangwe", "Machinjiri", "Zingwangwa", "Ndirande",
  "Area 25", "Area 47", "Area 23", "Biwi", "Kauma", "Mchesi",
  "Nkuyu", "Khombedza", "Kapiri", "Mthunzi", "Nsungwi",
  "Chamama", "Malabada", "Kachere", "Chileka", "Lunzu",
];

const TRADITIONAL_AUTHORITIES = [
  "T/A Kapeni", "T/A Lundu", "T/A Blantyre", "T/A Chigaru",
  "T/A Njewa", "T/A Chitukula", "T/A Chadza", "T/A Mwanza",
  "T/A Mzukuzuku", "T/A Chikulamayembe",
];

const PHONE_PREFIXES = ["0881", "0882", "0883", "0884", "0885", "0991", "0992", "0993", "0994"];

function malawianPhone() {
  return `${randomFrom(PHONE_PREFIXES)}${padId(randomInt(100000, 999999), 6)}`;
}

// ---------------------------------------------------------------------------
// Disease Catalogue
// ---------------------------------------------------------------------------

const DISEASES = [
  { icdCode: "A00", name: "Cholera", category: "Communicable", isNotifiable: true },
  { icdCode: "A15", name: "Tuberculosis", category: "Communicable", isNotifiable: true },
  { icdCode: "B50", name: "Malaria (P. falciparum)", category: "Vector-borne", isNotifiable: true },
  { icdCode: "B51", name: "Malaria (P. vivax)", category: "Vector-borne", isNotifiable: true },
  { icdCode: "B20", name: "HIV/AIDS", category: "Communicable", isNotifiable: true },
  { icdCode: "A01", name: "Typhoid Fever", category: "Communicable", isNotifiable: true },
  { icdCode: "A09", name: "Acute Diarrhoea", category: "Communicable", isNotifiable: false },
  { icdCode: "J18", name: "Pneumonia", category: "Respiratory", isNotifiable: false },
  { icdCode: "A82", name: "Rabies", category: "Zoonotic", isNotifiable: true },
  { icdCode: "A33", name: "Neonatal Tetanus", category: "Communicable", isNotifiable: true },
  { icdCode: "B05", name: "Measles", category: "Vaccine-preventable", isNotifiable: true },
  { icdCode: "A37", name: "Whooping Cough", category: "Vaccine-preventable", isNotifiable: true },
  { icdCode: "A90", name: "Dengue Fever", category: "Vector-borne", isNotifiable: true },
  { icdCode: "B65", name: "Schistosomiasis", category: "Parasitic", isNotifiable: false },
  { icdCode: "B76", name: "Hookworm Disease", category: "Parasitic", isNotifiable: false },
  { icdCode: "E11", name: "Type 2 Diabetes", category: "Non-communicable", isNotifiable: false },
  { icdCode: "I10", name: "Hypertension", category: "Non-communicable", isNotifiable: false },
  { icdCode: "J45", name: "Asthma", category: "Respiratory", isNotifiable: false },
  { icdCode: "K92", name: "Gastrointestinal Haemorrhage", category: "Surgical", isNotifiable: false },
  { icdCode: "O15", name: "Eclampsia", category: "Obstetric", isNotifiable: false },
];

// ---------------------------------------------------------------------------
// Treatment Protocol Catalogue
// ---------------------------------------------------------------------------

const PROTOCOLS = [
  { code: "TB-CAT1", name: "TB Category 1 Regimen (RHZE/RH)", diseaseTarget: "Tuberculosis", description: "2RHZE/4RH — first-line regimen for new TB cases" },
  { code: "TB-CAT2", name: "TB Category 2 Regimen (RHZES/RHZE/RHE)", diseaseTarget: "Tuberculosis", description: "Retreatment regimen for previously treated TB" },
  { code: "MALARIA-AL3", name: "Artemether-Lumefantrine (AL) 3-day Course", diseaseTarget: "Malaria (P. falciparum)", description: "First-line uncomplicated malaria treatment" },
  { code: "MALARIA-IV-ART", name: "IV Artesunate (severe malaria)", diseaseTarget: "Malaria (P. falciparum)", description: "For severe/complicated malaria" },
  { code: "CHOLERA-ORS", name: "Oral Rehydration Salts (ORS)", diseaseTarget: "Cholera", description: "ORS + zinc supplementation for mild-moderate cholera" },
  { code: "CHOLERA-IV", name: "IV Ringer's Lactate + Doxycycline", diseaseTarget: "Cholera", description: "Severe cholera rehydration with antibiotic" },
  { code: "HIV-NNRTI-1L", name: "TDF + 3TC + EFV (First-line ART)", diseaseTarget: "HIV/AIDS", description: "Standard first-line ART regimen per Malawi ART guidelines" },
  { code: "HIV-NNRTI-2L", name: "AZT + 3TC + LPV/r (Second-line ART)", diseaseTarget: "HIV/AIDS", description: "Second-line ART for NNRTI failure" },
  { code: "TYPHOID-CIPRO", name: "Ciprofloxacin 500mg BD 7 days", diseaseTarget: "Typhoid Fever", description: "First-line typhoid treatment" },
  { code: "PNEUMO-AMOX", name: "Amoxicillin 500mg TDS 5 days", diseaseTarget: "Pneumonia", description: "Community-acquired pneumonia, mild-moderate" },
  { code: "PNEUMO-CTX", name: "Co-trimoxazole + Gentamicin", diseaseTarget: "Pneumonia", description: "Severe pneumonia treatment" },
  { code: "ECLAMPSIA-MgSO4", name: "MgSO4 Loading + Maintenance", diseaseTarget: "Eclampsia", description: "IV MgSO4 for seizure prophylaxis/treatment" },
  { code: "DM2-METFORMIN", name: "Metformin 500mg BD", diseaseTarget: "Type 2 Diabetes", description: "First-line oral hypoglycaemic" },
  { code: "HTN-AMLODIPINE", name: "Amlodipine 5–10mg OD", diseaseTarget: "Hypertension", description: "First-line antihypertensive per Malawi Essential Medicines List" },
  { code: "DIARR-ORS-ZINC", name: "ORS + Zinc 10mg/day 10 days", diseaseTarget: "Acute Diarrhoea", description: "Standard WHO diarrhoea management" },
];

// ---------------------------------------------------------------------------
// Facility Definitions
// ---------------------------------------------------------------------------

const FACILITY_DEFS = [
  {
    facilityCode: "KCH-001",
    name: "Kamuzu Central Hospital",
    type: "Central Hospital",
    district: "Lilongwe",
    region: "Central",
    latitude: -13.9626,
    longitude: 33.7741,
    wards: [
      { name: "Male Medical Ward", specialty: "General Medicine", bedCapacity: 80 },
      { name: "Female Medical Ward", specialty: "General Medicine", bedCapacity: 75 },
      { name: "TB Ward", specialty: "Infectious Disease", bedCapacity: 40 },
      { name: "Paediatric Ward", specialty: "Paediatrics", bedCapacity: 60 },
      { name: "Maternity Ward", specialty: "Obstetrics & Gynaecology", bedCapacity: 50 },
    ],
    staffDefs: [
      { role: "Doctor", department: "Internal Medicine", count: 4 },
      { role: "Doctor", department: "Paediatrics", count: 2 },
      { role: "Clinical Officer", department: "Emergency", count: 3 },
      { role: "Nurse", department: "TB Ward", count: 5 },
      { role: "Nurse", department: "Maternity", count: 4 },
      { role: "Lab Technician", department: "Laboratory", count: 3 },
    ],
  },
  {
    facilityCode: "QEH-001",
    name: "Queen Elizabeth Central Hospital",
    type: "Central Hospital",
    district: "Blantyre",
    region: "Southern",
    latitude: -15.7861,
    longitude: 35.0058,
    wards: [
      { name: "Male Medical Ward", specialty: "General Medicine", bedCapacity: 90 },
      { name: "Female Medical Ward", specialty: "General Medicine", bedCapacity: 85 },
      { name: "Infectious Disease Ward", specialty: "Infectious Disease", bedCapacity: 50 },
      { name: "Cholera Treatment Unit", specialty: "Infectious Disease", bedCapacity: 30 },
      { name: "Paediatric Ward", specialty: "Paediatrics", bedCapacity: 70 },
    ],
    staffDefs: [
      { role: "Doctor", department: "Internal Medicine", count: 5 },
      { role: "Doctor", department: "Infectious Disease", count: 3 },
      { role: "Clinical Officer", department: "General", count: 4 },
      { role: "Nurse", department: "Cholera Unit", count: 6 },
      { role: "Lab Technician", department: "Laboratory", count: 4 },
    ],
  },
  {
    facilityCode: "MCH-001",
    name: "Mzuzu Central Hospital",
    type: "Central Hospital",
    district: "Mzuzu",
    region: "Northern",
    latitude: -11.4655,
    longitude: 34.0179,
    wards: [
      { name: "Male Ward", specialty: "General Medicine", bedCapacity: 60 },
      { name: "Female Ward", specialty: "General Medicine", bedCapacity: 55 },
      { name: "TB/HIV Ward", specialty: "Infectious Disease", bedCapacity: 35 },
      { name: "Paediatric Ward", specialty: "Paediatrics", bedCapacity: 45 },
    ],
    staffDefs: [
      { role: "Doctor", department: "Internal Medicine", count: 3 },
      { role: "Clinical Officer", department: "General", count: 3 },
      { role: "Nurse", department: "TB/HIV", count: 4 },
      { role: "Lab Technician", department: "Laboratory", count: 2 },
    ],
  },
  {
    facilityCode: "ZDH-001",
    name: "Zomba District Hospital",
    type: "District Hospital",
    district: "Zomba",
    region: "Southern",
    latitude: -15.3833,
    longitude: 35.3167,
    wards: [
      { name: "General Ward", specialty: "General Medicine", bedCapacity: 45 },
      { name: "Maternity Ward", specialty: "Obstetrics & Gynaecology", bedCapacity: 30 },
      { name: "TB Ward", specialty: "Infectious Disease", bedCapacity: 20 },
    ],
    staffDefs: [
      { role: "Doctor", department: "General", count: 2 },
      { role: "Clinical Officer", department: "General", count: 4 },
      { role: "Nurse", department: "Maternity", count: 3 },
      { role: "Lab Technician", department: "Laboratory", count: 2 },
    ],
  },
  {
    facilityCode: "KDH-001",
    name: "Kasungu District Hospital",
    type: "District Hospital",
    district: "Kasungu",
    region: "Central",
    latitude: -13.0333,
    longitude: 33.4833,
    wards: [
      { name: "General Ward", specialty: "General Medicine", bedCapacity: 40 },
      { name: "Paediatric Ward", specialty: "Paediatrics", bedCapacity: 30 },
      { name: "Maternity Ward", specialty: "Obstetrics & Gynaecology", bedCapacity: 25 },
    ],
    staffDefs: [
      { role: "Doctor", department: "General", count: 2 },
      { role: "Clinical Officer", department: "General", count: 3 },
      { role: "Nurse", department: "Paediatrics", count: 3 },
      { role: "Lab Technician", department: "Laboratory", count: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Chief complaints by disease
// ---------------------------------------------------------------------------

const COMPLAINTS: Record<string, string[]> = {
  "Cholera": ["Profuse watery diarrhoea", "Severe dehydration with rice-water stools", "Vomiting and diarrhoea", "Sudden onset watery diarrhoea"],
  "Tuberculosis": ["Persistent cough > 2 weeks", "Night sweats and weight loss", "Haemoptysis", "Chronic productive cough with fever"],
  "Malaria (P. falciparum)": ["High fever with rigors", "Headache and fever", "Fever, vomiting, and prostration", "Altered consciousness with fever"],
  "HIV/AIDS": ["Recurrent opportunistic infections", "Weight loss and chronic diarrhoea", "Persistent fever and lymphadenopathy", "Oral candidiasis and weight loss"],
  "Typhoid Fever": ["Stepwise fever with abdominal pain", "Fever with rose spots", "Abdominal pain and constipation", "High fever with relative bradycardia"],
  "Acute Diarrhoea": ["Loose stools > 3 per day", "Bloody diarrhoea", "Diarrhoea with dehydration", "Watery stools and abdominal cramps"],
  "Pneumonia": ["Cough with purulent sputum", "Chest pain and fever", "Difficulty breathing", "Cough, fever, and tachypnoea"],
  "Eclampsia": ["Seizures in pregnancy", "Hypertension with headache in third trimester", "Convulsions post-partum", "Severe headache with visual disturbances"],
  "Type 2 Diabetes": ["Polydipsia and polyuria", "Blurred vision and fatigue", "Numbness in feet", "Uncontrolled blood sugar"],
  "Hypertension": ["Persistent headache", "Dizziness and blurred vision", "Chest tightness", "Elevated BP on routine check"],
  "default": ["General malaise", "Fever and body aches", "Weakness and loss of appetite", "Pain and discomfort"],
};

// ---------------------------------------------------------------------------
// Lab tests by disease
// ---------------------------------------------------------------------------

const LAB_TESTS: Record<string, Array<{ testName: string; testCode: string; sampleType: string }>> = {
  "Malaria (P. falciparum)": [
    { testName: "Malaria RDT", testCode: "MRDTPF", sampleType: "Blood" },
    { testName: "Thick Blood Film", testCode: "TBFMAL", sampleType: "Blood" },
  ],
  "Tuberculosis": [
    { testName: "TB GeneXpert MTB/RIF", testCode: "GENEXPERT", sampleType: "Sputum" },
    { testName: "Sputum Smear Microscopy", testCode: "SSPSMEAR", sampleType: "Sputum" },
  ],
  "HIV/AIDS": [
    { testName: "HIV ELISA", testCode: "HIVELISA", sampleType: "Blood" },
    { testName: "CD4 Count", testCode: "CD4COUNT", sampleType: "Blood" },
  ],
  "Cholera": [
    { testName: "Stool Culture", testCode: "STOOLCX", sampleType: "Stool" },
    { testName: "Cholera RDT", testCode: "CHORDTPF", sampleType: "Stool" },
  ],
  "Typhoid Fever": [
    { testName: "Widal Test", testCode: "WIDALTEST", sampleType: "Blood" },
    { testName: "Blood Culture", testCode: "BLOODCX", sampleType: "Blood" },
  ],
  "default": [
    { testName: "Full Blood Count", testCode: "FBC", sampleType: "Blood" },
    { testName: "Malaria RDT", testCode: "MRDTPF", sampleType: "Blood" },
  ],
};

// ---------------------------------------------------------------------------
// Main Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Starting MDSS seed...\n");

  // --- Diseases ---
  console.log("Seeding diseases...");
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

  // --- Treatment Protocols ---
  console.log(" Seeding treatment protocols...");
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

  // --- Facilities, Wards, Staff ---
  console.log("🏥 Seeding facilities, wards, and staff...");

  const facilityIds: string[] = [];
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
    wardsByFacility[facility.id] = [];
    staffByFacility[facility.id] = [];

    // Wards
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
      wardsByFacility[facility.id]?.push(ward.id);
    }

    // Staff
    for (const sDef of fDef.staffDefs) {
      for (let i = 0; i < sDef.count; i++) {
        const isMale = Math.random() > 0.4;
        const firstName = randomFrom(isMale ? MALAWIAN_FIRST_NAMES_M : MALAWIAN_FIRST_NAMES_F);
        const lastName = randomFrom(MALAWIAN_SURNAMES);
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
        staffByFacility[facility.id]?.push(staff.id);
      }
    }
  }

  const totalWards = Object.values(wardsByFacility).reduce((s, w) => s + w.length, 0);
  const totalStaff = Object.values(staffByFacility).reduce((s, st) => s + st.length, 0);
  console.log(`   ✅ ${FACILITY_DEFS.length} facilities, ${totalWards} wards, ${totalStaff} staff`);

  // --- Patients ---
  console.log("👤 Seeding 200 patients...");

  const patientIds: string[] = [];
  let hpnCounter = 10000001;

  for (let i = 0; i < 200; i++) {
    const isMale = Math.random() > 0.48;
    const sex: Sex = isMale ? "MALE" : Math.random() > 0.02 ? "FEMALE" : "OTHER";
    const firstName = randomFrom(isMale ? MALAWIAN_FIRST_NAMES_M : MALAWIAN_FIRST_NAMES_F);
    const lastName = randomFrom(MALAWIAN_SURNAMES);
    const district = randomFrom(MALAWI_DISTRICTS);
    const region = DISTRICT_TO_REGION[district] ?? "Central";

    const dob = randomDate(new Date("1950-01-01"), new Date("2010-12-31"));

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

    patientIds.push(patient.id);

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

    // Contact info (80% have contact)
    if (Math.random() > 0.2) {
      await prisma.patientContact.create({
        data: {
          patientId: patient.id,
          phone: malawianPhone(),
          altPhone: Math.random() > 0.5 ? malawianPhone() : null,
          nextOfKin: `${randomFrom(MALAWIAN_FIRST_NAMES_M)} ${randomFrom(MALAWIAN_SURNAMES)}`,
          nokPhone: malawianPhone(),
          nokRelation: randomFrom(["Spouse", "Parent", "Sibling", "Child", "Uncle/Aunt"]),
        },
      });
    }
  }

  console.log(`   ✅ 200 patients seeded`);

  // --- Encounters, Diagnoses, Treatments, Lab Results, Vitals, Outcomes ---
  console.log("🏨 Seeding 400 encounters with full clinical data...");

  const diseaseNames = DISEASES.map((d) => d.name);

  // Disease → protocol mapping for realistic treatment selection
  const diseaseProtocols: Record<string, string[]> = {
    "Tuberculosis": ["TB-CAT1", "TB-CAT2"],
    "Malaria (P. falciparum)": ["MALARIA-AL3", "MALARIA-IV-ART"],
    "Malaria (P. vivax)": ["MALARIA-AL3"],
    "Cholera": ["CHOLERA-ORS", "CHOLERA-IV"],
    "HIV/AIDS": ["HIV-NNRTI-1L", "HIV-NNRTI-2L"],
    "Typhoid Fever": ["TYPHOID-CIPRO"],
    "Pneumonia": ["PNEUMO-AMOX", "PNEUMO-CTX"],
    "Acute Diarrhoea": ["DIARR-ORS-ZINC"],
    "Eclampsia": ["ECLAMPSIA-MgSO4"],
    "Type 2 Diabetes": ["DM2-METFORMIN"],
    "Hypertension": ["HTN-AMLODIPINE"],
  };

  const encounterStartBase = new Date("2024-01-01");
  const encounterEndBase = new Date("2025-03-31");

  let encounterCount = 0;

  for (let i = 0; i < 400; i++) {
    const patientId = randomFrom(patientIds);
    const facilityId = randomFrom(facilityIds);
    const wards = wardsByFacility[facilityId] ?? [];
    const staffList = staffByFacility[facilityId] ?? [];

    const wardId = wards.length > 0 && Math.random() > 0.2 ? randomFrom(wards) : null;
    const attendingStaffId = staffList.length > 0 ? randomFrom(staffList) : null;

    const encounterType: EncounterType = randomFrom(["OUTPATIENT", "INPATIENT", "EMERGENCY", "FOLLOW_UP", "REFERRAL"]);
    const admittedAt = randomDate(encounterStartBase, encounterEndBase);

    const isDischargedEncounter = Math.random() > 0.15;
    const lengthOfStay = randomInt(1, 30);
    const dischargedAt = isDischargedEncounter ? addDays(admittedAt, lengthOfStay) : null;

    const status: EncounterStatus = !isDischargedEncounter
      ? "ACTIVE"
      : randomFrom(["DISCHARGED", "DISCHARGED", "DISCHARGED", "TRANSFERRED", "DECEASED", "ABSCONDED"]);

    // Primary disease
    const primaryDiseaseName = randomFrom(diseaseNames);
    const complaint = randomFrom(COMPLAINTS[primaryDiseaseName] ?? COMPLAINTS["default"] ?? []);

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
        notes: Math.random() > 0.5 ? `Patient presented with ${complaint.toLowerCase()}. Managed per protocol.` : null,
      },
    });

    encounterCount++;

    // --- Diagnoses (1–3 per encounter) ---
    const numDiagnoses = randomInt(1, 3);
    const chosenDiseases = [primaryDiseaseName];
    for (let d = 1; d < numDiagnoses; d++) {
      const secondary = randomFrom(diseaseNames);
      if (!chosenDiseases.includes(secondary)) chosenDiseases.push(secondary);
    }

    for (let di = 0; di < chosenDiseases.length; di++) {
      const dName = chosenDiseases[di];
      if (typeof dName !== "string") continue;
      const diseaseId = diseaseMap[dName];
      if (!diseaseId) continue;

      await prisma.diagnosis.create({
        data: {
          encounterId: encounter.id,
          diseaseId,
          diagnosedById: attendingStaffId,
          status: randomFrom(["CONFIRMED", "CONFIRMED", "SUSPECTED", "RULED_OUT"]) as DiagnosisStatus,
          isPrimary: di === 0,
          diagnosedAt: addDays(admittedAt, randomInt(0, 2)),
          notes: Math.random() > 0.6 ? `Diagnosed based on clinical presentation and lab evidence.` : null,
        },
      });
    }

    // --- Treatments (1–2 per encounter) ---
    const protoKeys = diseaseProtocols[primaryDiseaseName];
    const chosenProtoCode = protoKeys ? randomFrom(protoKeys) : null;
    const protocolId = chosenProtoCode ? protocolMap[chosenProtoCode] ?? null : null;

    const treatmentStatus: TreatmentStatus = randomFrom(["ONGOING", "COMPLETED", "COMPLETED", "DISCONTINUED", "FAILED"]);
    const txStart = addDays(admittedAt, randomInt(0, 1));
    const txEnd = treatmentStatus !== "ONGOING" ? addDays(txStart, randomInt(3, 28)) : null;

    await prisma.treatment.create({
      data: {
        encounterId: encounter.id,
        protocolId,
        drugName: protocolId ? null : randomFrom(["Paracetamol", "Ibuprofen", "Amoxicillin", "Cotrimoxazole", "Metronidazole"]),
        dosage: randomFrom(["500mg", "250mg", "1g", "200mg", "5mg/kg"]),
        route: randomFrom(["Oral", "IV", "IM", "Oral"]),
        frequency: randomFrom(["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"]),
        startDate: txStart,
        endDate: txEnd,
        durationDays: txEnd ? Math.round((txEnd.getTime() - txStart.getTime()) / 86400000) : null,
        status: treatmentStatus,
        discontinuedReason: treatmentStatus === "DISCONTINUED" ? randomFrom(["Adverse reaction", "Patient defaulted", "Drug unavailable", "Treatment completed early"]) : null,
      },
    });

    // --- Lab Results (1–3 per encounter) ---
    const labTests = LAB_TESTS[primaryDiseaseName] ?? LAB_TESTS["default"] ?? [];
    const numTests = randomInt(1, Math.min(3, labTests.length + 1));

    const selectedTests = [...labTests];
    if (selectedTests.length < numTests) {
      selectedTests.push(...(LAB_TESTS["default"] ?? []));
    }

    for (let li = 0; li < numTests; li++) {
      const test = randomFrom(selectedTests);
      const sampleStatus: SampleStatus = randomFrom(["RESULTED", "RESULTED", "RESULTED", "PENDING", "PROCESSING", "CANCELLED"]);
      const orderedAt = addDays(admittedAt, 0);
      const collectedAt = sampleStatus !== "PENDING" ? addDays(orderedAt, randomInt(0, 1)) : null;
      const resultedAt = sampleStatus === "RESULTED" ? addDays(collectedAt ?? orderedAt, randomInt(1, 3)) : null;

      const isPositive = Math.random() > 0.35;
      let resultValue: string | null = null;

      if (sampleStatus === "RESULTED") {
        if (test.testCode === "MRDTPF") resultValue = isPositive ? "Positive" : "Negative";
        else if (test.testCode === "GENEXPERT") resultValue = isPositive ? "MTB DETECTED — Low" : "MTB NOT DETECTED";
        else if (test.testCode === "HIVELISA") resultValue = isPositive ? "Reactive" : "Non-Reactive";
        else if (test.testCode === "CD4COUNT") resultValue = `${randomInt(50, 900)} cells/µL`;
        else if (test.testCode === "WIDALTEST") resultValue = isPositive ? "O >1:160, H >1:160" : "O <1:40, H <1:40";
        else if (test.testCode === "FBC") resultValue = `Hb ${randomFloat(6, 15)}g/dL, WBC ${randomFloat(3, 18)}×10⁹/L, Plt ${randomInt(80, 450)}×10⁹/L`;
        else resultValue = isPositive ? "Positive" : "Negative";
      }

      await prisma.labResult.create({
        data: {
          encounterId: encounter.id,
          testName: test.testName,
          testCode: test.testCode,
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

    // --- Vital Signs (2–5 sets per encounter) ---
    const numVitals = randomInt(2, 5);
    for (let vi = 0; vi < numVitals; vi++) {
      await prisma.vitalSigns.create({
        data: {
          encounterId: encounter.id,
          recordedAt: addDays(admittedAt, vi),
          temperatureC: randomFloat(36.0, 40.5),
          systolicBP: randomInt(80, 180),
          diastolicBP: randomInt(50, 110),
          pulseRate: randomInt(50, 130),
          respiratoryRate: randomInt(12, 35),
          oxygenSatPct: randomFloat(88.0, 100.0),
          weightKg: randomFloat(20.0, 110.0),
          heightCm: Math.random() > 0.5 ? randomFloat(100, 195) : null,
        },
      });
    }

    // --- Outcome (for discharged encounters) ---
    if (isDischargedEncounter && dischargedAt) {
      let result: OutcomeResult;
      if (status === "DECEASED") {
        result = "DECEASED";
      } else if (status === "TRANSFERRED") {
        result = "TRANSFERRED";
      } else {
        result = randomFrom(["RECOVERED", "RECOVERED", "RECOVERED", "IMPROVED", "IMPROVED", "UNCHANGED", "DETERIORATED", "LOST_TO_FOLLOW_UP"]);
      }

      await prisma.encounterOutcome.create({
        data: {
          encounterId: encounter.id,
          result,
          recordedAt: dischargedAt,
          lengthOfStayDays: lengthOfStay,
          wasReadmission: Math.random() > 0.85,
          readmittedWithin30Days: Math.random() > 0.9,
          causeOfDeath: result === "DECEASED" ? randomFrom(["A15.0", "B50.0", "A00.0", "J18.0"]) : null,
          notes: result === "DECEASED" ? "Patient expired despite treatment. Family notified." : null,
        },
      });
    }
  }

  console.log(`   ✅ ${encounterCount} encounters seeded with diagnoses, treatments, labs, vitals, and outcomes`);

  // --- API Sync Logs ---
  console.log("🔄 Seeding API sync logs...");

  const endpoints = ["/api/encounters", "/api/patients", "/api/diagnoses", "/api/lab-results", "/api/outcomes"];
  for (let i = 0; i < 50; i++) {
    const startedAt = randomDate(new Date("2024-06-01"), new Date("2025-03-31"));
    const success = Math.random() > 0.08;
    await prisma.apiSyncLog.create({
      data: {
        requestedBy: `MDSS-${randomFrom(["ANALYTICS", "ETL", "DASHBOARD", "ALERT"])}`,
        endpoint: randomFrom(endpoints),
        queryParams: {
          facilityCode: randomFrom(FACILITY_DEFS).facilityCode,
          dateFrom: startedAt.toISOString().split("T")[0],
          dateTo: addDays(startedAt, 7).toISOString().split("T")[0],
        },
        recordsReturned: success ? randomInt(10, 500) : null,
        syncStartedAt: startedAt,
        syncCompletedAt: success ? addDays(startedAt, 0) : null,
        success,
        errorMessage: !success ? randomFrom(["Connection timeout", "Authentication failed", "Facility offline", "Rate limit exceeded"]) : null,
      },
    });
  }

  console.log(`   ✅ 50 API sync logs seeded`);

  // --- Summary ---
  console.log("\n🎉 Seed complete! Summary:");
  console.log(`   Diseases:            ${DISEASES.length}`);
  console.log(`   Treatment Protocols: ${PROTOCOLS.length}`);
  console.log(`   Facilities:          ${FACILITY_DEFS.length}`);
  console.log(`   Wards:               ${totalWards}`);
  console.log(`   Staff:               ${totalStaff}`);
  console.log(`   Patients:            200`);
  console.log(`   Encounters:          ${encounterCount}`);
  console.log(`   API Sync Logs:       50`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

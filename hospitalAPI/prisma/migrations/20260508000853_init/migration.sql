-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EncounterType" AS ENUM ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED', 'ABSCONDED');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('CONFIRMED', 'SUSPECTED', 'RULED_OUT');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('ONGOING', 'COMPLETED', 'DISCONTINUED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutcomeResult" AS ENUM ('RECOVERED', 'IMPROVED', 'UNCHANGED', 'DETERIORATED', 'DECEASED', 'TRANSFERRED', 'LOST_TO_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('HPN', 'NID', 'PASSPORT', 'HOSPITAL_ID');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('PENDING', 'COLLECTED', 'PROCESSING', 'RESULTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "bedCapacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "staffCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sex" "Sex" NOT NULL DEFAULT 'UNKNOWN',
    "nationality" TEXT DEFAULT 'Malawian',
    "village" TEXT,
    "traditionalAuthority" TEXT,
    "district" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_identifiers" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "identifierType" "IdentifierType" NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "issuedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_contacts" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "phone" TEXT,
    "altPhone" TEXT,
    "email" TEXT,
    "nextOfKin" TEXT,
    "nokPhone" TEXT,
    "nokRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" TEXT NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isNotifiable" BOOLEAN NOT NULL DEFAULT false,
    "isTrackedByMDSS" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_encounters" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "wardId" TEXT,
    "attendingStaffId" TEXT,
    "encounterType" "EncounterType" NOT NULL DEFAULT 'OUTPATIENT',
    "status" "EncounterStatus" NOT NULL DEFAULT 'ACTIVE',
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "transferredTo" TEXT,
    "chiefComplaint" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "diagnosedById" TEXT,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'CONFIRMED',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_protocols" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diseaseTarget" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "protocolId" TEXT,
    "drugName" TEXT,
    "dosage" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "status" "TreatmentStatus" NOT NULL DEFAULT 'ONGOING',
    "discontinuedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_outcomes" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "result" "OutcomeResult" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lengthOfStayDays" INTEGER,
    "wasReadmission" BOOLEAN NOT NULL DEFAULT false,
    "readmittedWithin30Days" BOOLEAN NOT NULL DEFAULT false,
    "causeOfDeath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounter_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatureC" DOUBLE PRECISION,
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "pulseRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSatPct" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testCode" TEXT,
    "sampleType" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'PENDING',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),
    "resultedAt" TIMESTAMP(3),
    "resultValue" TEXT,
    "resultUnit" TEXT,
    "referenceRange" TEXT,
    "isPositive" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_sync_logs" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "queryParams" JSONB,
    "recordsReturned" INTEGER,
    "syncStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCompletedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_facilityCode_key" ON "facilities"("facilityCode");

-- CreateIndex
CREATE UNIQUE INDEX "staff_staffCode_key" ON "staff"("staffCode");

-- CreateIndex
CREATE INDEX "patient_identifiers_identifierValue_idx" ON "patient_identifiers"("identifierValue");

-- CreateIndex
CREATE UNIQUE INDEX "patient_identifiers_identifierType_identifierValue_key" ON "patient_identifiers"("identifierType", "identifierValue");

-- CreateIndex
CREATE UNIQUE INDEX "patient_contacts_patientId_key" ON "patient_contacts"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_icd10Code_key" ON "diseases"("icd10Code");

-- CreateIndex
CREATE INDEX "patient_encounters_patientId_idx" ON "patient_encounters"("patientId");

-- CreateIndex
CREATE INDEX "patient_encounters_facilityId_idx" ON "patient_encounters"("facilityId");

-- CreateIndex
CREATE INDEX "patient_encounters_admittedAt_idx" ON "patient_encounters"("admittedAt");

-- CreateIndex
CREATE INDEX "diagnoses_diseaseId_idx" ON "diagnoses"("diseaseId");

-- CreateIndex
CREATE INDEX "diagnoses_diagnosedAt_idx" ON "diagnoses"("diagnosedAt");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_protocols_code_key" ON "treatment_protocols"("code");

-- CreateIndex
CREATE INDEX "treatments_encounterId_idx" ON "treatments"("encounterId");

-- CreateIndex
CREATE INDEX "treatments_startDate_idx" ON "treatments"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_outcomes_encounterId_key" ON "encounter_outcomes"("encounterId");

-- CreateIndex
CREATE INDEX "vital_signs_encounterId_idx" ON "vital_signs"("encounterId");

-- CreateIndex
CREATE INDEX "lab_results_encounterId_idx" ON "lab_results"("encounterId");

-- CreateIndex
CREATE INDEX "lab_results_testCode_idx" ON "lab_results"("testCode");

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_contacts" ADD CONSTRAINT "patient_contacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_encounters" ADD CONSTRAINT "patient_encounters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_encounters" ADD CONSTRAINT "patient_encounters_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_encounters" ADD CONSTRAINT "patient_encounters_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_encounters" ADD CONSTRAINT "patient_encounters_attendingStaffId_fkey" FOREIGN KEY ("attendingStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "patient_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "diseases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_diagnosedById_fkey" FOREIGN KEY ("diagnosedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "patient_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "treatment_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_outcomes" ADD CONSTRAINT "encounter_outcomes_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "patient_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "patient_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "patient_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

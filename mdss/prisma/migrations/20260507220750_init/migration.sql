-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "canonical";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "raw";

-- CreateEnum
CREATE TYPE "raw"."RawEncounterType" AS ENUM ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "raw"."RawEncounterStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED', 'ABSCONDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "canonical"."CaseSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "canonical"."CaseStatus" AS ENUM ('ACTIVE', 'CLOSED', 'LOST_TO_FOLLOW_UP', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "canonical"."LabConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED_POSITIVE', 'CONFIRMED_NEGATIVE', 'INDETERMINATE', 'NOT_TESTED');

-- CreateEnum
CREATE TYPE "canonical"."OutcomeResult" AS ENUM ('RECOVERED', 'IMPROVED', 'UNCHANGED', 'DETERIORATED', 'DECEASED', 'TRANSFERRED', 'LOST_TO_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "canonical"."TreatmentStatus" AS ENUM ('ONGOING', 'COMPLETED', 'DISCONTINUED', 'FAILED');

-- CreateEnum
CREATE TYPE "analytics"."AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "analytics"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "raw"."raw_sync_logs" (
    "id" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "queryParams" JSONB,
    "recordsReturned" INTEGER,
    "syncCursor" TIMESTAMP(3),
    "syncStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCompletedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "httpStatusCode" INTEGER,
    "errorMessage" TEXT,
    "initiatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw"."raw_patients" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw"."raw_encounters" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalPatientId" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "encounterType" "raw"."RawEncounterType" NOT NULL DEFAULT 'UNKNOWN',
    "encounterStatus" "raw"."RawEncounterStatus" NOT NULL DEFAULT 'UNKNOWN',
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw"."raw_diagnoses" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalEncounterId" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "diseaseCode" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw"."raw_lab_results" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalEncounterId" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "testCode" TEXT,
    "isPositive" BOOLEAN,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw"."raw_treatments" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalEncounterId" TEXT NOT NULL,
    "sourceHospitalCode" TEXT NOT NULL,
    "protocolCode" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_facilities" (
    "id" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL DEFAULT 'Public',
    "village" TEXT,
    "traditionalAuthority" TEXT,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Malawi',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "catchmentPopulation" INTEGER,
    "reportingTier" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isReporting" BOOLEAN NOT NULL DEFAULT true,
    "firstReportedAt" TIMESTAMP(3),
    "lastReportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_patients" (
    "id" TEXT NOT NULL,
    "patientHash" TEXT NOT NULL,
    "ageBand" TEXT,
    "birthYear" INTEGER,
    "sex" TEXT,
    "residenceDistrict" TEXT,
    "residenceRegion" TEXT,
    "residenceCountry" TEXT NOT NULL DEFAULT 'Malawi',
    "firstSeenAt" TEXT,
    "firstEncounterDate" TIMESTAMP(3),
    "lastEncounterDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_disease_registry" (
    "id" TEXT NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fullName" TEXT,
    "category" TEXT NOT NULL,
    "isNotifiable" BOOLEAN NOT NULL DEFAULT false,
    "isEpidemicProne" BOOLEAN NOT NULL DEFAULT false,
    "isTrackedByMDSS" BOOLEAN NOT NULL DEFAULT true,
    "localAliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_disease_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_cases" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "rawEncounterId" TEXT,
    "rawSourceHospital" TEXT,
    "onsetDate" TIMESTAMP(3),
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admissionDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "encounterType" TEXT,
    "severity" "canonical"."CaseSeverity" NOT NULL DEFAULT 'UNKNOWN',
    "status" "canonical"."CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "labConfirmation" "canonical"."LabConfirmationStatus" NOT NULL DEFAULT 'NOT_TESTED',
    "isDeath" BOOLEAN NOT NULL DEFAULT false,
    "causeOfDeathCode" TEXT,
    "lengthOfStayDays" INTEGER,
    "isReadmission" BOOLEAN NOT NULL DEFAULT false,
    "readmittedWithin30Days" BOOLEAN NOT NULL DEFAULT false,
    "patientDistrict" TEXT,
    "patientRegion" TEXT,
    "facilityDistrict" TEXT,
    "facilityRegion" TEXT,
    "facilityLatitude" DOUBLE PRECISION,
    "facilityLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_lab_results" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "rawLabResultId" TEXT,
    "loincCode" TEXT,
    "testName" TEXT NOT NULL,
    "sampleType" TEXT,
    "orderedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "resultedAt" TIMESTAMP(3),
    "resultValue" TEXT,
    "resultUnit" TEXT,
    "isPositive" BOOLEAN,
    "confirmationStatus" "canonical"."LabConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_treatments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "rawTreatmentId" TEXT,
    "canonicalProtocolCode" TEXT,
    "treatmentName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "status" "canonical"."TreatmentStatus" NOT NULL DEFAULT 'ONGOING',
    "discontinuedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical"."mdss_outcomes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "rawOutcomeId" TEXT,
    "result" "canonical"."OutcomeResult" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lengthOfStayDays" INTEGER,
    "wasReadmission" BOOLEAN NOT NULL DEFAULT false,
    "isTreatmentSuccess" BOOLEAN NOT NULL DEFAULT false,
    "causeOfDeathCode" TEXT,
    "causeOfDeathName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdss_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."daily_disease_summary" (
    "id" TEXT NOT NULL,
    "summaryDate" DATE NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "diseaseDisplayName" TEXT NOT NULL,
    "diseaseCategory" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Malawi',
    "newCases" INTEGER NOT NULL DEFAULT 0,
    "activeCases" INTEGER NOT NULL DEFAULT 0,
    "closedCases" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "suspectedCases" INTEGER NOT NULL DEFAULT 0,
    "confirmedCases" INTEGER NOT NULL DEFAULT 0,
    "inpatientCases" INTEGER NOT NULL DEFAULT 0,
    "outpatientCases" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" TEXT,

    CONSTRAINT "daily_disease_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."district_disease_trends" (
    "id" TEXT NOT NULL,
    "trendDate" DATE NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "diseaseDisplayName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Malawi',
    "reportingFacilities" INTEGER NOT NULL DEFAULT 0,
    "newCases" INTEGER NOT NULL DEFAULT 0,
    "activeCases" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "confirmedCases" INTEGER NOT NULL DEFAULT 0,
    "suspectedCases" INTEGER NOT NULL DEFAULT 0,
    "catchmentPopulation" INTEGER,
    "incidenceRatePer100k" DOUBLE PRECISION,
    "rollingAvg7Day" DOUBLE PRECISION,
    "rollingAvg28Day" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" TEXT,

    CONSTRAINT "district_disease_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."facility_performance_metrics" (
    "id" TEXT NOT NULL,
    "reportingMonth" DATE NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "totalCasesReported" INTEGER NOT NULL DEFAULT 0,
    "totalDeaths" INTEGER NOT NULL DEFAULT 0,
    "totalRecovered" INTEGER NOT NULL DEFAULT 0,
    "totalLabTests" INTEGER NOT NULL DEFAULT 0,
    "totalLabPositive" INTEGER NOT NULL DEFAULT 0,
    "caseFatalityRate" DOUBLE PRECISION,
    "treatmentSuccessRate" DOUBLE PRECISION,
    "avgLengthOfStayDays" DOUBLE PRECISION,
    "labConfirmationRate" DOUBLE PRECISION,
    "readmissionRate" DOUBLE PRECISION,
    "diseasesReported" INTEGER NOT NULL DEFAULT 0,
    "isCompleteReport" BOOLEAN NOT NULL DEFAULT false,
    "completenessScore" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" TEXT,

    CONSTRAINT "facility_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."outbreak_alerts" (
    "id" TEXT NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "diseaseDisplayName" TEXT NOT NULL,
    "district" TEXT,
    "region" TEXT,
    "facilityCode" TEXT,
    "status" "analytics"."AlertStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "analytics"."AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "observedCases" INTEGER NOT NULL,
    "alertThreshold" INTEGER NOT NULL,
    "expectedBaseline" DOUBLE PRECISION,
    "sigmaDeviation" DOUBLE PRECISION,
    "alertGeneratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "detectionAlgorithm" TEXT,
    "jobVersion" TEXT,

    CONSTRAINT "outbreak_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."mortality_statistics" (
    "id" TEXT NOT NULL,
    "reportingMonth" DATE NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "diseaseDisplayName" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "ageBand" TEXT,
    "sex" TEXT,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "totalDeaths" INTEGER NOT NULL DEFAULT 0,
    "caseFatalityRate" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" TEXT,

    CONSTRAINT "mortality_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."treatment_success_rates" (
    "id" TEXT NOT NULL,
    "reportingMonth" DATE NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "diseaseDisplayName" TEXT NOT NULL,
    "protocolCode" TEXT,
    "protocolName" TEXT,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "totalTreated" INTEGER NOT NULL DEFAULT 0,
    "treatmentSuccesses" INTEGER NOT NULL DEFAULT 0,
    "treatmentFailures" INTEGER NOT NULL DEFAULT 0,
    "discontinued" INTEGER NOT NULL DEFAULT 0,
    "lostToFollowUp" INTEGER NOT NULL DEFAULT 0,
    "treatmentSuccessRate" DOUBLE PRECISION,
    "avgTreatmentDays" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobVersion" TEXT,

    CONSTRAINT "treatment_success_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_sync_logs_sourceHospitalCode_idx" ON "raw"."raw_sync_logs"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_sync_logs_syncStartedAt_idx" ON "raw"."raw_sync_logs"("syncStartedAt");

-- CreateIndex
CREATE INDEX "raw_sync_logs_success_idx" ON "raw"."raw_sync_logs"("success");

-- CreateIndex
CREATE INDEX "raw_patients_sourceHospitalCode_idx" ON "raw"."raw_patients"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_patients_processedAt_idx" ON "raw"."raw_patients"("processedAt");

-- CreateIndex
CREATE INDEX "raw_patients_receivedAt_idx" ON "raw"."raw_patients"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_patients_sourceHospitalCode_externalId_key" ON "raw"."raw_patients"("sourceHospitalCode", "externalId");

-- CreateIndex
CREATE INDEX "raw_encounters_sourceHospitalCode_idx" ON "raw"."raw_encounters"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_encounters_externalPatientId_idx" ON "raw"."raw_encounters"("externalPatientId");

-- CreateIndex
CREATE INDEX "raw_encounters_processedAt_idx" ON "raw"."raw_encounters"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_encounters_sourceHospitalCode_externalId_key" ON "raw"."raw_encounters"("sourceHospitalCode", "externalId");

-- CreateIndex
CREATE INDEX "raw_diagnoses_sourceHospitalCode_idx" ON "raw"."raw_diagnoses"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_diagnoses_diseaseCode_idx" ON "raw"."raw_diagnoses"("diseaseCode");

-- CreateIndex
CREATE INDEX "raw_diagnoses_processedAt_idx" ON "raw"."raw_diagnoses"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_diagnoses_sourceHospitalCode_externalId_key" ON "raw"."raw_diagnoses"("sourceHospitalCode", "externalId");

-- CreateIndex
CREATE INDEX "raw_lab_results_sourceHospitalCode_idx" ON "raw"."raw_lab_results"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_lab_results_testCode_idx" ON "raw"."raw_lab_results"("testCode");

-- CreateIndex
CREATE INDEX "raw_lab_results_processedAt_idx" ON "raw"."raw_lab_results"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_lab_results_sourceHospitalCode_externalId_key" ON "raw"."raw_lab_results"("sourceHospitalCode", "externalId");

-- CreateIndex
CREATE INDEX "raw_treatments_sourceHospitalCode_idx" ON "raw"."raw_treatments"("sourceHospitalCode");

-- CreateIndex
CREATE INDEX "raw_treatments_protocolCode_idx" ON "raw"."raw_treatments"("protocolCode");

-- CreateIndex
CREATE INDEX "raw_treatments_processedAt_idx" ON "raw"."raw_treatments"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "raw_treatments_sourceHospitalCode_externalId_key" ON "raw"."raw_treatments"("sourceHospitalCode", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "mdss_facilities_facilityCode_key" ON "canonical"."mdss_facilities"("facilityCode");

-- CreateIndex
CREATE INDEX "mdss_facilities_district_idx" ON "canonical"."mdss_facilities"("district");

-- CreateIndex
CREATE INDEX "mdss_facilities_region_idx" ON "canonical"."mdss_facilities"("region");

-- CreateIndex
CREATE UNIQUE INDEX "mdss_patients_patientHash_key" ON "canonical"."mdss_patients"("patientHash");

-- CreateIndex
CREATE INDEX "mdss_patients_ageBand_idx" ON "canonical"."mdss_patients"("ageBand");

-- CreateIndex
CREATE INDEX "mdss_patients_residenceDistrict_idx" ON "canonical"."mdss_patients"("residenceDistrict");

-- CreateIndex
CREATE INDEX "mdss_patients_residenceRegion_idx" ON "canonical"."mdss_patients"("residenceRegion");

-- CreateIndex
CREATE UNIQUE INDEX "mdss_disease_registry_icd10Code_key" ON "canonical"."mdss_disease_registry"("icd10Code");

-- CreateIndex
CREATE INDEX "mdss_disease_registry_category_idx" ON "canonical"."mdss_disease_registry"("category");

-- CreateIndex
CREATE INDEX "mdss_disease_registry_isNotifiable_idx" ON "canonical"."mdss_disease_registry"("isNotifiable");

-- CreateIndex
CREATE INDEX "mdss_cases_diseaseId_idx" ON "canonical"."mdss_cases"("diseaseId");

-- CreateIndex
CREATE INDEX "mdss_cases_facilityId_idx" ON "canonical"."mdss_cases"("facilityId");

-- CreateIndex
CREATE INDEX "mdss_cases_patientId_idx" ON "canonical"."mdss_cases"("patientId");

-- CreateIndex
CREATE INDEX "mdss_cases_reportDate_idx" ON "canonical"."mdss_cases"("reportDate");

-- CreateIndex
CREATE INDEX "mdss_cases_onsetDate_idx" ON "canonical"."mdss_cases"("onsetDate");

-- CreateIndex
CREATE INDEX "mdss_cases_status_idx" ON "canonical"."mdss_cases"("status");

-- CreateIndex
CREATE INDEX "mdss_cases_facilityDistrict_idx" ON "canonical"."mdss_cases"("facilityDistrict");

-- CreateIndex
CREATE INDEX "mdss_cases_facilityRegion_idx" ON "canonical"."mdss_cases"("facilityRegion");

-- CreateIndex
CREATE INDEX "mdss_cases_patientDistrict_idx" ON "canonical"."mdss_cases"("patientDistrict");

-- CreateIndex
CREATE INDEX "mdss_cases_isDeath_idx" ON "canonical"."mdss_cases"("isDeath");

-- CreateIndex
CREATE INDEX "mdss_lab_results_caseId_idx" ON "canonical"."mdss_lab_results"("caseId");

-- CreateIndex
CREATE INDEX "mdss_lab_results_loincCode_idx" ON "canonical"."mdss_lab_results"("loincCode");

-- CreateIndex
CREATE INDEX "mdss_lab_results_resultedAt_idx" ON "canonical"."mdss_lab_results"("resultedAt");

-- CreateIndex
CREATE INDEX "mdss_lab_results_isPositive_idx" ON "canonical"."mdss_lab_results"("isPositive");

-- CreateIndex
CREATE INDEX "mdss_treatments_caseId_idx" ON "canonical"."mdss_treatments"("caseId");

-- CreateIndex
CREATE INDEX "mdss_treatments_canonicalProtocolCode_idx" ON "canonical"."mdss_treatments"("canonicalProtocolCode");

-- CreateIndex
CREATE INDEX "mdss_treatments_status_idx" ON "canonical"."mdss_treatments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mdss_outcomes_caseId_key" ON "canonical"."mdss_outcomes"("caseId");

-- CreateIndex
CREATE INDEX "mdss_outcomes_result_idx" ON "canonical"."mdss_outcomes"("result");

-- CreateIndex
CREATE INDEX "mdss_outcomes_recordedAt_idx" ON "canonical"."mdss_outcomes"("recordedAt");

-- CreateIndex
CREATE INDEX "mdss_outcomes_isTreatmentSuccess_idx" ON "canonical"."mdss_outcomes"("isTreatmentSuccess");

-- CreateIndex
CREATE INDEX "daily_disease_summary_summaryDate_idx" ON "analytics"."daily_disease_summary"("summaryDate");

-- CreateIndex
CREATE INDEX "daily_disease_summary_icd10Code_idx" ON "analytics"."daily_disease_summary"("icd10Code");

-- CreateIndex
CREATE INDEX "daily_disease_summary_district_idx" ON "analytics"."daily_disease_summary"("district");

-- CreateIndex
CREATE INDEX "daily_disease_summary_region_idx" ON "analytics"."daily_disease_summary"("region");

-- CreateIndex
CREATE INDEX "daily_disease_summary_facilityCode_idx" ON "analytics"."daily_disease_summary"("facilityCode");

-- CreateIndex
CREATE UNIQUE INDEX "daily_disease_summary_summaryDate_icd10Code_facilityCode_key" ON "analytics"."daily_disease_summary"("summaryDate", "icd10Code", "facilityCode");

-- CreateIndex
CREATE INDEX "district_disease_trends_trendDate_idx" ON "analytics"."district_disease_trends"("trendDate");

-- CreateIndex
CREATE INDEX "district_disease_trends_icd10Code_idx" ON "analytics"."district_disease_trends"("icd10Code");

-- CreateIndex
CREATE INDEX "district_disease_trends_district_idx" ON "analytics"."district_disease_trends"("district");

-- CreateIndex
CREATE INDEX "district_disease_trends_region_idx" ON "analytics"."district_disease_trends"("region");

-- CreateIndex
CREATE UNIQUE INDEX "district_disease_trends_trendDate_icd10Code_district_key" ON "analytics"."district_disease_trends"("trendDate", "icd10Code", "district");

-- CreateIndex
CREATE INDEX "facility_performance_metrics_reportingMonth_idx" ON "analytics"."facility_performance_metrics"("reportingMonth");

-- CreateIndex
CREATE INDEX "facility_performance_metrics_facilityCode_idx" ON "analytics"."facility_performance_metrics"("facilityCode");

-- CreateIndex
CREATE INDEX "facility_performance_metrics_district_idx" ON "analytics"."facility_performance_metrics"("district");

-- CreateIndex
CREATE INDEX "facility_performance_metrics_region_idx" ON "analytics"."facility_performance_metrics"("region");

-- CreateIndex
CREATE UNIQUE INDEX "facility_performance_metrics_reportingMonth_facilityCode_key" ON "analytics"."facility_performance_metrics"("reportingMonth", "facilityCode");

-- CreateIndex
CREATE INDEX "outbreak_alerts_icd10Code_idx" ON "analytics"."outbreak_alerts"("icd10Code");

-- CreateIndex
CREATE INDEX "outbreak_alerts_status_idx" ON "analytics"."outbreak_alerts"("status");

-- CreateIndex
CREATE INDEX "outbreak_alerts_severity_idx" ON "analytics"."outbreak_alerts"("severity");

-- CreateIndex
CREATE INDEX "outbreak_alerts_district_idx" ON "analytics"."outbreak_alerts"("district");

-- CreateIndex
CREATE INDEX "outbreak_alerts_alertGeneratedAt_idx" ON "analytics"."outbreak_alerts"("alertGeneratedAt");

-- CreateIndex
CREATE INDEX "mortality_statistics_reportingMonth_idx" ON "analytics"."mortality_statistics"("reportingMonth");

-- CreateIndex
CREATE INDEX "mortality_statistics_icd10Code_idx" ON "analytics"."mortality_statistics"("icd10Code");

-- CreateIndex
CREATE INDEX "mortality_statistics_district_idx" ON "analytics"."mortality_statistics"("district");

-- CreateIndex
CREATE INDEX "mortality_statistics_ageBand_idx" ON "analytics"."mortality_statistics"("ageBand");

-- CreateIndex
CREATE UNIQUE INDEX "mortality_statistics_reportingMonth_icd10Code_facilityCode__key" ON "analytics"."mortality_statistics"("reportingMonth", "icd10Code", "facilityCode", "ageBand", "sex");

-- CreateIndex
CREATE INDEX "treatment_success_rates_reportingMonth_idx" ON "analytics"."treatment_success_rates"("reportingMonth");

-- CreateIndex
CREATE INDEX "treatment_success_rates_icd10Code_idx" ON "analytics"."treatment_success_rates"("icd10Code");

-- CreateIndex
CREATE INDEX "treatment_success_rates_protocolCode_idx" ON "analytics"."treatment_success_rates"("protocolCode");

-- CreateIndex
CREATE INDEX "treatment_success_rates_facilityCode_idx" ON "analytics"."treatment_success_rates"("facilityCode");

-- CreateIndex
CREATE INDEX "treatment_success_rates_district_idx" ON "analytics"."treatment_success_rates"("district");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_success_rates_reportingMonth_icd10Code_protocolCo_key" ON "analytics"."treatment_success_rates"("reportingMonth", "icd10Code", "protocolCode", "facilityCode");

-- AddForeignKey
ALTER TABLE "raw"."raw_patients" ADD CONSTRAINT "raw_patients_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "raw"."raw_sync_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw"."raw_encounters" ADD CONSTRAINT "raw_encounters_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "raw"."raw_sync_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw"."raw_diagnoses" ADD CONSTRAINT "raw_diagnoses_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "raw"."raw_sync_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw"."raw_lab_results" ADD CONSTRAINT "raw_lab_results_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "raw"."raw_sync_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw"."raw_treatments" ADD CONSTRAINT "raw_treatments_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "raw"."raw_sync_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_cases" ADD CONSTRAINT "mdss_cases_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "canonical"."mdss_patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_cases" ADD CONSTRAINT "mdss_cases_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "canonical"."mdss_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_cases" ADD CONSTRAINT "mdss_cases_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "canonical"."mdss_disease_registry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_lab_results" ADD CONSTRAINT "mdss_lab_results_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "canonical"."mdss_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_lab_results" ADD CONSTRAINT "mdss_lab_results_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "canonical"."mdss_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_treatments" ADD CONSTRAINT "mdss_treatments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "canonical"."mdss_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_treatments" ADD CONSTRAINT "mdss_treatments_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "canonical"."mdss_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_outcomes" ADD CONSTRAINT "mdss_outcomes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "canonical"."mdss_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical"."mdss_outcomes" ADD CONSTRAINT "mdss_outcomes_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "canonical"."mdss_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

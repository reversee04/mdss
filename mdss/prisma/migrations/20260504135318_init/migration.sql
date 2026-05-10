-- CreateTable
CREATE TABLE "Patient" (
    "patient_id" VARCHAR(50) NOT NULL,
    "nid_or_passport_no" VARCHAR(50),
    "firstname" VARCHAR(100) NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "sex" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "facility_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(25) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("facility_id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "disease_id" VARCHAR(50) NOT NULL,
    "disease_name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("disease_id")
);

-- CreateTable
CREATE TABLE "Encounter" (
    "encounter_id" VARCHAR(50) NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "disease_id" TEXT NOT NULL,
    "date_of_diagnosis" TIMESTAMP(3) NOT NULL,
    "admission_date" TIMESTAMP(3),
    "discharge_date" TIMESTAMP(3),
    "outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treatment_record_id" TEXT,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("encounter_id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "treatment_id" VARCHAR(50) NOT NULL,
    "treatment_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("treatment_id")
);

-- CreateTable
CREATE TABLE "Treatment_Record" (
    "treatment_record_id" VARCHAR(50) NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "effectiveness_notes" TEXT,

    CONSTRAINT "Treatment_Record_pkey" PRIMARY KEY ("treatment_record_id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "analysis_id" VARCHAR(50) NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("analysis_id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "alert_id" VARCHAR(50) NOT NULL,
    "alert_type" TEXT NOT NULL,
    "threshold_value" DOUBLE PRECISION NOT NULL,
    "actual_value" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis_id" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Report" (
    "report_id" VARCHAR(50) NOT NULL,
    "user_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "filters_used" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_path" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "Audit_Log" (
    "log_id" VARCHAR(50) NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_affected" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "Audit_Log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "Facility"("facility_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment_Record" ADD CONSTRAINT "Treatment_Record_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "Encounter"("encounter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment_Record" ADD CONSTRAINT "Treatment_Record_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "Treatment"("treatment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "Encounter"("encounter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "Analysis"("analysis_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "Analysis"("analysis_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit_Log" ADD CONSTRAINT "Audit_Log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

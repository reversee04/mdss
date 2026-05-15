/*
  Warnings:

  - You are about to alter the column `analysis_id` on the `Alert` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `treatment_id` on the `Analysis` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `encounter_id` on the `Analysis` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `patient_id` on the `Encounter` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `facility_id` on the `Encounter` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `disease_id` on the `Encounter` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `treatment_record_id` on the `Encounter` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `user_id` on the `Report` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `analysis_id` on the `Report` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the column `employment_no` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userRole` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `password_hash` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.
  - You are about to drop the `Audit_Log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Treatment_Record` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `analysis_id` on table `Alert` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nid_or_passport_no` on table `Patient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `file_path` on table `Report` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_analysis_id_fkey";

-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_encounter_id_fkey";

-- DropForeignKey
ALTER TABLE "Audit_Log" DROP CONSTRAINT "Audit_Log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_disease_id_fkey";

-- DropForeignKey
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_facility_id_fkey";

-- DropForeignKey
ALTER TABLE "Encounter" DROP CONSTRAINT "Encounter_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_analysis_id_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Treatment_Record" DROP CONSTRAINT "Treatment_Record_encounter_id_fkey";

-- DropForeignKey
ALTER TABLE "Treatment_Record" DROP CONSTRAINT "Treatment_Record_treatment_id_fkey";

-- AlterTable
ALTER TABLE "Alert" ALTER COLUMN "threshold_value" DROP NOT NULL,
ALTER COLUMN "threshold_value" SET DATA TYPE TEXT,
ALTER COLUMN "actual_value" DROP NOT NULL,
ALTER COLUMN "actual_value" SET DATA TYPE TEXT,
ALTER COLUMN "analysis_id" SET NOT NULL,
ALTER COLUMN "analysis_id" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "treatment_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "encounter_id" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Encounter" ALTER COLUMN "patient_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "facility_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "disease_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "date_of_diagnosis" SET DATA TYPE DATE,
ALTER COLUMN "admission_date" SET DATA TYPE DATE,
ALTER COLUMN "discharge_date" SET DATA TYPE DATE,
ALTER COLUMN "treatment_record_id" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "nid_or_passport_no" SET NOT NULL,
ALTER COLUMN "date_of_birth" SET DATA TYPE DATE,
ALTER COLUMN "sex" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "analysis_id" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "file_path" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "employment_no",
DROP COLUMN "userRole",
ADD COLUMN     "role" VARCHAR(50) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "password_hash" SET DATA TYPE VARCHAR(50);

-- DropTable
DROP TABLE "Audit_Log";

-- DropTable
DROP TABLE "Treatment_Record";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "TreatmentRecord" (
    "treatment_record_id" VARCHAR(50) NOT NULL,
    "encounter_id" VARCHAR(50) NOT NULL,
    "treatment_id" VARCHAR(50) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "effectiveness_notes" TEXT,

    CONSTRAINT "TreatmentRecord_pkey" PRIMARY KEY ("treatment_record_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "log_id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "action" TEXT NOT NULL,
    "entity_affected" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("log_id")
);

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "Facility"("facility_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentRecord" ADD CONSTRAINT "TreatmentRecord_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "Encounter"("encounter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentRecord" ADD CONSTRAINT "TreatmentRecord_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "Treatment"("treatment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "Encounter"("encounter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "Analysis"("analysis_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "Analysis"("analysis_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

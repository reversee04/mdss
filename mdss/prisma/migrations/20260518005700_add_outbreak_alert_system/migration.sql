-- AlterTable
ALTER TABLE "Disease" ADD COLUMN     "alert_cooldown_hours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "alert_recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_alert_sent" TIMESTAMP(3),
ADD COLUMN     "monitoring_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "outbreak_threshold" INTEGER DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "warning_threshold" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "OutbreakAlert" (
    "alert_id" TEXT NOT NULL,
    "disease_id" VARCHAR(50) NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "district" VARCHAR(100),
    "region" VARCHAR(100),
    "facility_id" VARCHAR(50),
    "current_cases" INTEGER NOT NULL,
    "threshold_value" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,
    "cases_per_100k" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" VARCHAR(50),
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutbreakAlert_pkey" PRIMARY KEY ("alert_id")
);

-- AddForeignKey
ALTER TABLE "OutbreakAlert" ADD CONSTRAINT "OutbreakAlert_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "Disease"("disease_id") ON DELETE RESTRICT ON UPDATE CASCADE;

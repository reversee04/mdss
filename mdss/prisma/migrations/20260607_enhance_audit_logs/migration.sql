ALTER TABLE "AuditLog"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ALTER COLUMN "action" TYPE VARCHAR(100),
  ALTER COLUMN "entity_affected" TYPE VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "entity_id" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "ip_address" VARCHAR(45),
  ADD COLUMN IF NOT EXISTS "user_agent" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(50) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_user_id_fkey";

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_category_idx" ON "AuditLog"("category");
CREATE INDEX IF NOT EXISTS "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX IF NOT EXISTS "AuditLog_user_id_idx" ON "AuditLog"("user_id");

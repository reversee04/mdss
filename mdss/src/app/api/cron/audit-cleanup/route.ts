import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/services/audit.service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const daysToKeep = Number(process.env.AUDIT_LOG_RETENTION_DAYS || "90");
  const result = await AuditService.cleanupOldLogs(Number.isFinite(daysToKeep) ? daysToKeep : 90);

  return NextResponse.json({
    success: true,
    deleted: result.count,
  });
}

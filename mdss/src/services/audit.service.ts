import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
  AVATAR_UPDATED = "AVATAR_UPDATED",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  SYSTEM_SETTING_UPDATED = "SYSTEM_SETTING_UPDATED",
  MAINTENANCE_TRIGGERED = "MAINTENANCE_TRIGGERED",
  ETL_SYNC_STARTED = "ETL_SYNC_STARTED",
  ETL_SYNC_COMPLETED = "ETL_SYNC_COMPLETED",
  ETL_SYNC_FAILED = "ETL_SYNC_FAILED",
  REPORT_GENERATED = "REPORT_GENERATED",
  REPORT_DOWNLOADED = "REPORT_DOWNLOADED",
  ALERT_ACKNOWLEDGED = "ALERT_ACKNOWLEDGED",
  ALERT_CREATED = "ALERT_CREATED",
}

export enum AuditCategory {
  GENERAL = "general",
  AUTH = "auth",
  PROFILE = "profile",
  ADMIN = "admin",
  SYSTEM = "system",
  ETL = "etl",
  REPORT = "report",
  ALERT = "alert",
}

export enum AuditSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

interface AuditLogOptions {
  userId?: string | null;
  action: AuditAction | string;
  entityAffected: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: AuditSeverity;
  category?: AuditCategory;
}

export function getAuditRequestContext(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || null,
    userAgent: request.headers.get("user-agent"),
  };
}

export class AuditService {
  static async log(options: AuditLogOptions) {
    try {
      await prisma.auditLog.create({
        data: {
          log_id: `LOG-${Date.now()}-${randomUUID().slice(0, 8)}`,
          user_id: options.userId || null,
          action: options.action,
          entity_affected: options.entityAffected,
          entity_id: options.entityId || null,
          details: options.details || null,
          ip_address: options.ipAddress || null,
          user_agent: options.userAgent?.slice(0, 500) || null,
          severity: options.severity || AuditSeverity.INFO,
          category: options.category || AuditCategory.GENERAL,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        severity: { not: AuditSeverity.CRITICAL },
      },
    });
  }
}

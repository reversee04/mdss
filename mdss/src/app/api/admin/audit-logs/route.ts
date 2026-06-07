import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";

const MAX_LIMIT = 500;

function isAdmin(role?: string) {
  return role === "admin" || role === "System Admin";
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
    const action = searchParams.get("action");
    const severity = searchParams.get("severity");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));
    const limit = Math.min(Number(searchParams.get("limit") || "100"), MAX_LIMIT);
    const offset = Number(searchParams.get("offset") || "0");

    const where: any = {};
    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: Number.isFinite(limit) && limit > 0 ? limit : 100,
        skip: Number.isFinite(offset) && offset >= 0 ? offset : 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.log_id,
        user: log.user?.name || "System",
        email: log.user?.email || "",
        role: log.user?.role || "system",
        action: log.action,
        entityAffected: log.entity_affected,
        entityId: log.entity_id,
        timestamp: log.timestamp.toISOString(),
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        severity: log.severity,
        category: log.category,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs", message: error.message },
      { status: 500 }
    );
  }
}

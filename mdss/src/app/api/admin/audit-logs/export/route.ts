import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../../auth";

function isAdmin(role?: string) {
  return role === "admin" || role === "System Admin";
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));

    const where: any = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
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
      take: 5000,
    });

    const csvRows = [
      [
        "Timestamp",
        "User",
        "Email",
        "Role",
        "Action",
        "Category",
        "Severity",
        "Entity Affected",
        "Entity ID",
        "Details",
        "IP Address",
        "User Agent",
      ],
      ...logs.map((log) => [
        log.timestamp.toISOString(),
        log.user?.name || "System",
        log.user?.email || "",
        log.user?.role || "system",
        log.action,
        log.category,
        log.severity,
        log.entity_affected,
        log.entity_id || "",
        log.details || "",
        log.ip_address || "",
        log.user_agent || "",
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs-${date}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Failed to export audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export audit logs", message: error.message },
      { status: 500 }
    );
  }
}

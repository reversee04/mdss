import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { user_id: session.user.id },
    });

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        success: true,
        data: {
          critical_outbreak_alerts: true,
          high_severity_alerts: true,
          medium_severity_alerts: true,
          data_quality_alerts: true,
          etl_pipeline_status: true,
          system_maintenance: true,
          report_generation: false,
          email_digest_frequency: "daily",
          email_enabled: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notification preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      critical_outbreak_alerts,
      high_severity_alerts,
      medium_severity_alerts,
      data_quality_alerts,
      etl_pipeline_status,
      system_maintenance,
      report_generation,
      email_digest_frequency,
      email_enabled,
    } = body;

    const preferences = await prisma.notificationPreferences.upsert({
      where: { user_id: session.user.id },
      update: {
        critical_outbreak_alerts,
        high_severity_alerts,
        medium_severity_alerts,
        data_quality_alerts,
        etl_pipeline_status,
        system_maintenance,
        report_generation,
        email_digest_frequency,
        email_enabled,
      },
      create: {
        user_id: session.user.id,
        critical_outbreak_alerts: critical_outbreak_alerts ?? true,
        high_severity_alerts: high_severity_alerts ?? true,
        medium_severity_alerts: medium_severity_alerts ?? true,
        data_quality_alerts: data_quality_alerts ?? true,
        etl_pipeline_status: etl_pipeline_status ?? true,
        system_maintenance: system_maintenance ?? true,
        report_generation: report_generation ?? false,
        email_digest_frequency: email_digest_frequency ?? "daily",
        email_enabled: email_enabled ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "Notification Preferences Updated",
        entity_affected: "NotificationPreferences",
        details: "User updated their notification preferences",
      },
    });

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification preferences" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    const settings = await prisma.userSettings.upsert({
      where: { user_id: session.user.id },
      update: {
        two_factor_enabled: enabled,
      },
      create: {
        user_id: session.user.id,
        two_factor_enabled: enabled,
      },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "2FA Toggled",
        entity_affected: "UserSettings",
        details: `2FA ${enabled ? "enabled" : "disabled"}`,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    return NextResponse.json({ success: false, error: "Failed to update 2FA settings" }, { status: 500 });
  }
}

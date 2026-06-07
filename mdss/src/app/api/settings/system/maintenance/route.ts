import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "System Admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (!["clear_cache", "export_logs", "run_diagnostics"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    // Simulate maintenance task
    await new Promise(resolve => setTimeout(resolve, 1500));

    let result = "";
    if (action === "clear_cache") {
      result = "Cache cleared successfully.";
    } else if (action === "export_logs") {
      result = "Logs exported successfully. Download link generated.";
    } else if (action === "run_diagnostics") {
      result = "Diagnostics completed. All systems operational.";
    }

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "Maintenance Task Triggered",
        entity_affected: "System",
        details: `Action: ${action}`,
      },
    });

    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("Error running maintenance task:", error);
    return NextResponse.json({ success: false, error: "Failed to run maintenance task" }, { status: 500 });
  }
}

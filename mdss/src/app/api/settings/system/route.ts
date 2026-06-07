import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "System Admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const configurations = await prisma.systemConfiguration.findMany();

    // Group configurations by category
    const groupedData = configurations.reduce((acc: any, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = [];
      }
      acc[curr.category].push({
        id: curr.id,
        key: curr.key,
        value: curr.value,
        description: curr.description,
      });
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: groupedData });
  } catch (error) {
    console.error("Error fetching system configuration:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch system configuration" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "System Admin") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Key and value are required" }, { status: 400 });
    }

    const configuration = await prisma.systemConfiguration.upsert({
      where: { key },
      update: { value, ...(description && { description }), ...(category && { category }) },
      create: { key, value, description, category: category || "general" },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "System Configuration Updated",
        entity_affected: "SystemConfiguration",
        details: `Updated configuration key: ${key}`,
      },
    });

    return NextResponse.json({ success: true, data: configuration });
  } catch (error) {
    console.error("Error updating system configuration:", error);
    return NextResponse.json({ success: false, error: "Failed to update system configuration" }, { status: 500 });
  }
}

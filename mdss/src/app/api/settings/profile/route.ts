import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: session.user.id },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.settings?.phone || "",
        job_title: user.settings?.job_title || "",
        department: user.settings?.department || "",
        profile_image_url: user.settings?.profile_image_url || "",
        two_factor_enabled: user.settings?.two_factor_enabled || false,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, job_title, department } = body;

    // Update User table for name
    await prisma.user.update({
      where: { user_id: session.user.id },
      data: { name },
    });

    // Upsert UserSettings for profile info
    const settings = await prisma.userSettings.upsert({
      where: { user_id: session.user.id },
      update: {
        phone,
        job_title,
        department,
      },
      create: {
        user_id: session.user.id,
        phone,
        job_title,
        department,
      },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "Profile Updated",
        entity_affected: "User/UserSettings",
        details: "Updated profile information",
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

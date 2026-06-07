import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../../auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Incorrect current password" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { user_id: session.user.id },
      data: { password_hash: passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "Password Changed",
        entity_affected: "User",
        details: "User changed their password",
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });
  }
}

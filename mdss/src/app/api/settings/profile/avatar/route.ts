import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "../../../../../../auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/avatars directory
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const profileImageUrl = `/uploads/avatars/${fileName}`;

    // Update UserSettings
    const settings = await prisma.userSettings.upsert({
      where: { user_id: session.user.id },
      update: { profile_image_url: profileImageUrl },
      create: { user_id: session.user.id, profile_image_url: profileImageUrl },
    });

    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: session.user.id,
        action: "Avatar Uploaded",
        entity_affected: "UserSettings",
        details: "User uploaded a new profile image",
      },
    });

    return NextResponse.json({ success: true, url: profileImageUrl });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json({ success: false, error: "Failed to upload avatar" }, { status: 500 });
  }
}

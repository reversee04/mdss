import { prisma } from "@/lib/prisma";
import { processSync } from "@/services/processSync";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate source hospital
    if (!body.sourceHospital) {
      return Response.json(
        { success: false, message: "Source hospital is required" },
        { status: 400 },
      );
    }

    // 2. Create the log record (Moved outside the IF block)
    const newLog = await prisma.rawSyncLog.create({
      data: {
        // sourceHospital: body.sourceHospital,
        sourceHospitalCode: body.sourceHospital,
        // status: "Processing",
        syncStartedAt: new Date(),
        endpoint: body.endpoint || "unknown",
      },
    });

    // 3. Process the sync using the new log ID
    await processSync({ ...body, syncLog: newLog.id });

    // 4. Mark log as finished
    await prisma.rawSyncLog.update({
      where: { id: newLog.id },
      data: {
        success: true,
        syncCompletedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      message: "Sync process completed successfully",
    });
  } catch (error) {
    console.error("Error during sync process:", error);
    return Response.json(
      { success: false, message: "An error occurred during the sync process" },
      { status: 500 },
    );
  }
}

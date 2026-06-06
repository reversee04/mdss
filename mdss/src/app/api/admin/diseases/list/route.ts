import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/diseases/list
 * Retrieves a simple list of all diseases for dropdowns and filters
 * 
 * Returns:
 * - Array of { disease_id, disease_name }
 */
export async function GET() {
  try {
    const diseases = await prisma.disease.findMany({
      select: {
        disease_id: true,
        disease_name: true,
      },
      orderBy: {
        disease_name: 'asc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: diseases,
        count: diseases.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin] Diseases list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve disease list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

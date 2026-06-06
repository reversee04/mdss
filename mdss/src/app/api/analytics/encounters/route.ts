import { NextRequest, NextResponse } from "next/server";
import { getEncounterStats } from "@/services/analytics.service";

/**
 * GET /api/analytics/encounters
 * Retrieves encounter statistics including total encounters, average duration, and outcomes
 * 
 * Query Parameters:
 * - startDate?: ISO date string (filters encounters from this date)
 * - endDate?: ISO date string (filters encounters until this date)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const disease = searchParams.get("disease");
    const location = searchParams.get("location");
    const district = searchParams.get("district");
    const region = searchParams.get("region");
    const facility = searchParams.get("facility");

    // Validate date formats if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD).",
        },
        { status: 400 }
      );
    }

    const encounters = await getEncounterStats({
      disease: disease || undefined,
      location: location || district || undefined,
      region: region || undefined,
      facility: facility || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: encounters,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          disease: disease || null,
          location: location || district || null,
          region: region || null,
          facility: facility || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Encounters error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve encounter statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

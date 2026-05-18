import { NextRequest, NextResponse } from "next/server";
import { getDiseaseDistribution } from "@/services/analytics.service";

/**
 * GET /api/analytics/diseases
 * Retrieves disease distribution including top diseases, regional prevalence, and seasonal trends
 * 
 * Query Parameters:
 * - region?: Filter by specific region
 * - limit?: Number of top diseases to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const limit = searchParams.get("limit");

    // Validate limit parameter
    if (limit && isNaN(parseInt(limit))) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid limit parameter. Must be a number.",
        },
        { status: 400 }
      );
    }

    // TODO: Pass filters to service once updated
    const diseases = await getDiseaseDistribution();

    return NextResponse.json(
      {
        success: true,
        data: diseases,
        filters: {
          region: region || null,
          limit: limit ? parseInt(limit) : 10,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Diseases error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve disease distribution",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

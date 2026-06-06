import { NextRequest, NextResponse } from "next/server";
import { getOutcomeAnalytics } from "@/services/analytics.service";

/**
 * GET /api/analytics/outcomes
 * Retrieves outcome analytics including recovery rates and treatment effectiveness
 * 
 * Query Parameters:
 * - treatment?: Filter by specific treatment type
 * - facility?: Filter by facility ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const treatment = searchParams.get("treatment");
    const facility = searchParams.get("facility");
    const disease = searchParams.get("disease");
    const location = searchParams.get("location");
    const district = searchParams.get("district");
    const region = searchParams.get("region");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const outcomes = await getOutcomeAnalytics({
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
        data: outcomes,
        filters: {
          treatment: treatment || null,
          facility: facility || null,
          disease: disease || null,
          location: location || district || null,
          region: region || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Outcomes error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve outcome analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    // TODO: Pass filters to service once updated
    const outcomes = await getOutcomeAnalytics();

    return NextResponse.json(
      {
        success: true,
        data: outcomes,
        filters: {
          treatment: treatment || null,
          facility: facility || null,
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

import { NextRequest, NextResponse } from "next/server";
import { getFacilityComparison } from "@/services/analytics.service";

/**
 * GET /api/analytics/facilities
 * Retrieves facility comparison metrics including recovery rates and encounter counts
 * 
 * Query Parameters:
 * - region?: Filter by specific region
 * - district?: Filter by specific district
 * - sort?: 'encounters' | 'recovery' (default: 'encounters')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const district = searchParams.get("district");
    const sort = searchParams.get("sort") || "encounters";

    // Validate sort parameter
    if (!["encounters", "recovery"].includes(sort)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid sort parameter. Must be 'encounters' or 'recovery'.",
        },
        { status: 400 }
      );
    }

    // TODO: Pass filters to service once updated
    let facilities = await getFacilityComparison();

    // Client-side sorting (TODO: move to service)
    if (sort === "recovery") {
      facilities = facilities.sort((a, b) => {
        const rateA = parseFloat(a.recoveryRate.replace("%", ""));
        const rateB = parseFloat(b.recoveryRate.replace("%", ""));
        return rateB - rateA;
      });
    } else {
      facilities = facilities.sort(
        (a, b) => b.totalEncounters - a.totalEncounters
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: facilities,
        filters: {
          region: region || null,
          district: district || null,
          sort,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Facilities error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve facility comparison",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

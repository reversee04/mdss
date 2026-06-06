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

    const disease = searchParams.get("disease");
    const location = searchParams.get("location");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const facilities = await getFacilityComparison({
      region: region || undefined,
      district: district || location || undefined,
      disease: disease || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sort,
    });

    return NextResponse.json(
      {
        success: true,
        data: facilities,
        filters: {
          region: region || null,
          district: district || location || null,
          disease: disease || null,
          startDate: startDate || null,
          endDate: endDate || null,
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

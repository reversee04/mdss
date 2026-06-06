import { NextRequest, NextResponse } from "next/server";
import { getPatientDemographics } from "@/services/analytics.service";

/**
 * GET /api/analytics/demographics
 * Retrieves patient demographic data including age groups, gender, and geographic distribution
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const demographics = await getPatientDemographics({
      disease: searchParams.get("disease") || undefined,
      location: searchParams.get("location") || searchParams.get("district") || undefined,
      region: searchParams.get("region") || undefined,
      facility: searchParams.get("facility") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: demographics,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Demographics error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve demographic data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSurveillanceDashboardData } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const disease = searchParams.get("disease");
    const region = searchParams.get("region");
    const district = searchParams.get("district");
    const facility = searchParams.get("facility");

    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { success: false, error: "Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const data = await getSurveillanceDashboardData({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      disease: disease || undefined,
      region: region || undefined,
      district: district || undefined,
      facility: facility || undefined,
    });

    return NextResponse.json({
      success: true,
      data,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        disease: disease || null,
        region: region || null,
        district: district || null,
        facility: facility || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Analytics] Surveillance dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve surveillance dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

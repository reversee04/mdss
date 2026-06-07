import { NextRequest, NextResponse } from "next/server";
import { getTrendAnalysis } from "@/services/analytics.service";

/**
 * GET /api/analytics/trends
 * Retrieves time-series trend data for visualization
 * 
 * Query Parameters:
 * - startDate?: ISO date string (begin of range)
 * - endDate?: ISO date string (end of range)
 * - interval?: 'daily' | 'weekly' | 'monthly' (default: 'daily')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const interval = searchParams.get("interval") || "daily";

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

    // Validate interval parameter
    if (!["daily", "weekly", "monthly", "yearly"].includes(interval)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interval. Must be 'daily', 'weekly', 'monthly', or 'yearly'.",
        },
        { status: 400 }
      );
    }

    const disease = searchParams.get("disease");
    const location = searchParams.get("location");
    const facility = searchParams.get("facility");

    console.debug('[Trends API] Query params:', {
      disease: disease || 'all',
      location: location || 'all',
      facility: facility || 'all',
      startDate,
      endDate,
      interval
    });

    const trends = await getTrendAnalysis({
      disease: disease || undefined,
      location: location || undefined,
      facility: facility || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      interval,
    });

    return NextResponse.json(
      {
        success: true,
        data: trends,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          disease: disease || null,
          location: location || null,
          facility: facility || null,
          interval,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Trends error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve trend analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

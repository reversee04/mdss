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
    if (!["daily", "weekly", "monthly"].includes(interval)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interval. Must be 'daily', 'weekly', or 'monthly'.",
        },
        { status: 400 }
      );
    }

    // TODO: Pass date range and interval to service once updated
    const trends = await getTrendAnalysis();

    return NextResponse.json(
      {
        success: true,
        data: trends,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
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

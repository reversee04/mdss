import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPatientDemographics, getDiseaseDistribution, getOutcomeAnalytics, getEncounterStats, getFacilityComparison, getTrendAnalysis } from '@/services/analytics.service';

interface ReportFilters {
  disease?: string;
  location?: string;
  region?: string;
  district?: string;
  facility?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * POST /api/reports/generate
 * Generate a report based on filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'csv', filters = {}, reportName = 'report' } = body;

    const reportFilters: ReportFilters = filters;

    // Fetch all relevant data based on filters
    const [demographics, diseases, outcomes, encounters, facilities, trends] = await Promise.all([
      getPatientDemographics(reportFilters),
      getDiseaseDistribution(reportFilters),
      getOutcomeAnalytics(reportFilters),
      getEncounterStats(reportFilters),
      getFacilityComparison(reportFilters),
      getTrendAnalysis(reportFilters),
    ]);

    const reportData = {
      demographics,
      diseases,
      outcomes,
      encounters,
      facilities,
      trends,
      generatedAt: new Date().toISOString(),
      filters: reportFilters,
    };

    if (format === 'csv') {
      return generateCSVReport(reportData, reportName);
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: reportData,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Use csv or json' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateCSVReport(data: any, reportName: string) {
  const csvRows: string[] = [];

  // Add metadata
  csvRows.push(`Report Generated,${data.generatedAt}`);
  csvRows.push(`Report Name,${reportName}`);
  csvRows.push('');

  // Add filters
  csvRows.push('Filters');
  if (data.filters) {
    Object.entries(data.filters).forEach(([key, value]) => {
      csvRows.push(`${key},${value || 'all'}`);
    });
  }
  csvRows.push('');

  // Add encounter statistics
  csvRows.push('Encounter Statistics');
  csvRows.push(`Total Encounters,${data.encounters.totalEncounters || 0}`);
  csvRows.push(`Average Duration (days),${data.encounters.avgDuration || 0}`);
  csvRows.push('');

  // Add outcome statistics
  csvRows.push('Outcome Statistics');
  if (data.outcomes && data.outcomes.outcomeBreakdown) {
    data.outcomes.outcomeBreakdown.forEach((outcome: any) => {
      csvRows.push(`${outcome.outcome},${outcome.count}`);
    });
  }
  csvRows.push('');

  // Add disease distribution
  csvRows.push('Disease Distribution');
  if (data.diseases && data.diseases.byDisease) {
    data.diseases.byDisease.forEach((disease: any) => {
      csvRows.push(`${disease.disease},${disease.count}`);
    });
  }
  csvRows.push('');

  // Add facility comparison
  csvRows.push('Facility Statistics');
  if (data.facilities && data.facilities.byFacility) {
    csvRows.push('Facility,District,Region,Encounters');
    data.facilities.byFacility.forEach((facility: any) => {
      csvRows.push(`${facility.facility},${facility.district},${facility.region},${facility.encounters}`);
    });
  }
  csvRows.push('');

  // Add age distribution
  csvRows.push('Age Distribution');
  if (data.demographics && data.demographics.ageDistribution) {
    Object.entries(data.demographics.ageDistribution).forEach(([ageGroup, count]) => {
      csvRows.push(`${ageGroup},${count}`);
    });
  }
  csvRows.push('');

  // Add gender breakdown
  csvRows.push('Gender Distribution');
  if (data.demographics && data.demographics.genderBreakdown) {
    data.demographics.genderBreakdown.forEach((gender: any) => {
      csvRows.push(`${gender.sex},${gender._count.sex}`);
    });
  }

  const csvContent = csvRows.join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportName}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

/**
 * GET /api/reports
 * Get saved reports for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const reports = await prisma.report.findMany({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        analysis: true,
      },
      orderBy: { generated_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: reports.map(report => ({
        id: report.report_id,
        reportType: report.report_type,
        filtersUsed: report.filters_used,
        generatedAt: report.generated_at.toISOString(),
        filePath: report.file_path,
        user: report.user.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

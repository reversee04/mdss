import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getPatientDemographics, getDiseaseDistribution, getOutcomeAnalytics,
  getEncounterStats, getFacilityComparison, getTrendAnalysis,
  getDiseaseByDistrict, getOutcomeStatistics, getCaseFatalityRate, getTreatmentSuccessRate
} from '@/services/analytics.service';

interface ReportFilters {
  disease?: string;
  location?: string;
  region?: string;
  district?: string;
  facility?: string;
  startDate?: string;
  endDate?: string;
}

import { PDFService } from '@/services/pdf.service';
import { ExcelService } from '@/services/excel.service';
import { StorageService } from '@/services/storage.service';
import { auth } from '../../../../auth';
import { AuditAction, AuditCategory, AuditService, getAuditRequestContext } from '@/services/audit.service';

/**
 * POST /api/reports
 * Generate a report based on filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'anonymous'; // Fallback if no auth
    const auditContext = getAuditRequestContext(request);

    const body = await request.json();
    const { format = 'csv', filters = {}, reportName = 'report', templateId = null } = body;

    const reportFilters: ReportFilters = filters;

    // Fetch all relevant data based on filters
    const [demographics, diseases, outcomes, encounters, facilities, trends,
      diseaseByDistrict, outcomeStatistics, caseFatalityRate, treatmentSuccessRate
    ] = await Promise.all([
      getPatientDemographics(reportFilters),
      getDiseaseDistribution(reportFilters),
      getOutcomeAnalytics(reportFilters),
      getEncounterStats(reportFilters),
      getFacilityComparison(reportFilters),
      getTrendAnalysis(reportFilters),
      getDiseaseByDistrict(reportFilters),
      getOutcomeStatistics(reportFilters),
      getCaseFatalityRate(reportFilters),
      getTreatmentSuccessRate(reportFilters),
    ]);

    const reportData = {
      demographics,
      diseases,
      outcomes,
      encounters,
      facilities,
      trends,
      diseaseByDistrict,
      outcomeStatistics,
      caseFatalityRate,
      treatmentSuccessRate,
      generatedAt: new Date().toISOString(),
      filters: reportFilters,
    };

    let fileBuffer: Buffer | null = null;
    let contentType = '';
    let fileExtension = '';

    if (format === 'csv') {
      const csvContent = generateCSVContent(reportData, reportName);
      fileBuffer = Buffer.from(csvContent);
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else if (format === 'pdf') {
      const pdfService = new PDFService();
      fileBuffer = pdfService.generateReportPDF(reportData, { reportName });
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else if (format === 'excel') {
      const excelService = new ExcelService();
      fileBuffer = excelService.generateReportExcel(reportData, { reportName });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else if (format === 'json') {
      await AuditService.log({
        userId: session?.user?.id || null,
        action: AuditAction.REPORT_GENERATED,
        entityAffected: 'Report',
        details: `Generated JSON report ${reportName} with filters ${JSON.stringify(reportFilters)}`,
        category: AuditCategory.REPORT,
        ...auditContext,
      });

      return NextResponse.json({ success: true, data: reportData });
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported format' }, { status: 400 });
    }

    const filename = `${reportName}-${Date.now()}.${fileExtension}`;
    const storageService = new StorageService();
    const filePath = await storageService.saveFile(fileBuffer, filename, contentType);

    // Save to database
    if (session?.user?.id) {
      const generatedReport = await prisma.generatedReport.create({
        data: {
          user_id: session.user.id,
          template_id: templateId,
          report_name: reportName,
          report_type: 'surveillance',
          file_path: filePath,
          file_size: fileBuffer.length,
          format: fileExtension,
          filters_used: reportFilters as any,
        }
      });

      await AuditService.log({
        userId: session.user.id,
        action: AuditAction.REPORT_GENERATED,
        entityAffected: 'Report',
        entityId: generatedReport.id,
        details: `Generated ${fileExtension.toUpperCase()} report ${reportName} with filters ${JSON.stringify(reportFilters)}`,
        category: AuditCategory.REPORT,
        ...auditContext,
      });
    } else {
      await AuditService.log({
        userId: null,
        action: AuditAction.REPORT_GENERATED,
        entityAffected: 'Report',
        details: `Generated ${fileExtension.toUpperCase()} report ${reportName} anonymously`,
        category: AuditCategory.REPORT,
        ...auditContext,
      });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateCSVContent(data: any, reportName: string): string {
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

  // Add disease distribution
  csvRows.push('Disease Distribution');
  if (data.diseases?.topDiseases) {
    data.diseases.topDiseases.forEach((d: any) => {
      csvRows.push(`${d.disease},${d.count}`);
    });
  }
  csvRows.push('');

  // Add Disease by District Breakdown
  csvRows.push('Disease by District Breakdown');
  csvRows.push('Disease,District,Total Cases,Recovered,Deaths,Ongoing,Unknown,Recovery Rate (%),Mortality Rate (%)');
  if (Array.isArray(data.diseaseByDistrict)) {
    data.diseaseByDistrict.forEach((row: any) => {
      csvRows.push(`${row.disease},${row.district},${row.total_cases},${row.outcomes.recovered},${row.outcomes.deaths},${row.outcomes.ongoing},${row.outcomes.unknown},${row.recovery_rate},${row.mortality_rate}`);
    });
  }
  csvRows.push('');

  // Outcome Statistics by Disease
  csvRows.push('Outcome Statistics by Disease');
  csvRows.push('Disease,Recovered,Deaths,Ongoing,Unknown,Treatment Failure,Lost to Follow-up,Recovery Rate (%),Mortality Rate (%)');
  if (data.outcomeStatistics?.byDisease) {
    data.outcomeStatistics.byDisease.forEach((row: any) => {
      csvRows.push(`${row.label},${row.recovered},${row.deaths},${row.ongoing},${row.unknown},${row.treatment_failure},${row.lost_to_followup},${row.recovery_rate},${row.mortality_rate}`);
    });
  }
  csvRows.push('');

  // Outcome Statistics by District
  csvRows.push('Outcome Statistics by District');
  csvRows.push('District,Recovered,Deaths,Ongoing,Unknown,Recovery Rate (%),Mortality Rate (%)');
  if (data.outcomeStatistics?.byDistrict) {
    data.outcomeStatistics.byDistrict.forEach((row: any) => {
      csvRows.push(`${row.label},${row.recovered},${row.deaths},${row.ongoing},${row.unknown},${row.recovery_rate},${row.mortality_rate}`);
    });
  }
  csvRows.push('');

  // Case Fatality Rate
  csvRows.push('Case Fatality Rate (CFR) by Disease');
  csvRows.push('Disease,CFR (%)');
  if (data.caseFatalityRate?.byDisease) {
    Object.entries(data.caseFatalityRate.byDisease).forEach(([disease, cfr]) => {
      csvRows.push(`${disease},${cfr}`);
    });
  }
  csvRows.push('');

  // Treatment Success Rate
  csvRows.push('Treatment Success Rate (TSR) by Disease');
  csvRows.push('Disease,TSR (%)');
  if (data.treatmentSuccessRate?.byDisease) {
    Object.entries(data.treatmentSuccessRate.byDisease).forEach(([disease, tsr]) => {
      csvRows.push(`${disease},${tsr}`);
    });
  }
  csvRows.push('');

  // Add age distribution
  csvRows.push('Age Distribution');
  if (data.demographics?.ageDistribution) {
    Object.entries(data.demographics.ageDistribution).forEach(([ageGroup, count]) => {
      csvRows.push(`${ageGroup},${count}`);
    });
  }
  csvRows.push('');

  // Add gender breakdown
  csvRows.push('Gender Distribution');
  if (data.demographics?.genderBreakdown) {
    data.demographics.genderBreakdown.forEach((gender: any) => {
      csvRows.push(`${gender.sex},${gender._count.sex}`);
    });
  }

  return csvRows.join('\n');
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

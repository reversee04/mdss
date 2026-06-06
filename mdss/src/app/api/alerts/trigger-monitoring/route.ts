import { NextRequest, NextResponse } from 'next/server';
import { monitorAllDiseases, monitorDiseaseAcrossLocations } from '@/services/alert.service';

/**
 * POST /api/alerts/trigger-monitoring
 * Manually trigger alert monitoring for a specific disease
 * Called when thresholds are updated via the admin interface
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diseaseId } = body;

    const results = diseaseId
      ? await monitorDiseaseAcrossLocations(diseaseId)
      : await monitorAllDiseases();

    const alertResults = results.filter((result) => result.shouldAlert);
    const createdAlerts = results.filter((result) => result.alertCreated);

    return NextResponse.json(
      {
        success: true,
        message: diseaseId
          ? `Monitoring completed for ${diseaseId}`
          : 'Monitoring completed for all diseases',
        checked: results.length,
        thresholdBreaches: alertResults.length,
        alertsCreated: createdAlerts.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Alerts] Trigger monitoring error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger alert monitoring',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { monitorDisease, monitorDiseaseAcrossLocations, sendAlert } from '@/services/alert.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const diseaseId = searchParams.get('diseaseId');
  const district = searchParams.get('district');

  if (!diseaseId) {
    return NextResponse.json({ error: 'diseaseId is required' }, { status: 400 });
  }

  if (district) {
    const result = await monitorDisease(diseaseId, district);
    let alertCreated = false;
    let alertId: string | undefined;

    if (result.shouldAlert) {
      const sendResult = await sendAlert(diseaseId, result, district);
      alertCreated = sendResult.created;
      alertId = sendResult.alertId;
    }

    return NextResponse.json({
      success: true,
      checked: 1,
      thresholdBreaches: result.shouldAlert ? 1 : 0,
      alertsCreated: alertCreated ? 1 : 0,
      results: [{ ...result, diseaseId, district, alertCreated, alertId }],
    });
  }

  const filteredResults = await monitorDiseaseAcrossLocations(diseaseId);

  return NextResponse.json({
    success: true,
    checked: filteredResults.length,
    thresholdBreaches: filteredResults.filter((result) => result.shouldAlert).length,
    alertsCreated: filteredResults.filter((result) => result.alertCreated).length,
    results: filteredResults,
  });
}

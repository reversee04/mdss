import { NextRequest, NextResponse } from 'next/server';
import { monitorDisease, sendAlert } from '@/services/alert.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const diseaseId = searchParams.get('diseaseId');
  const district = searchParams.get('district');

  if (!diseaseId) {
    return NextResponse.json({ error: 'diseaseId is required' }, { status: 400 });
  }

  const result = await monitorDisease(diseaseId, district || undefined);
  
  if (result.shouldAlert) {
    await sendAlert(diseaseId, result, district || undefined);
  }

  return NextResponse.json(result);
}
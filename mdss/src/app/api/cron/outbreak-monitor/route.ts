import { NextResponse } from 'next/server';
import runOutbreakMonitor from '@/jobs/outbreak-monitor.job';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await runOutbreakMonitor();

  return NextResponse.json({
    success: true,
    message: 'Outbreak monitoring completed',
    checked: results.length,
    thresholdBreaches: results.filter((result) => result.shouldAlert).length,
    alertsCreated: results.filter((result) => result.alertCreated).length,
  });
}

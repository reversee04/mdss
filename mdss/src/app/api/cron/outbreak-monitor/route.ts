import { NextResponse } from 'next/server';
import runOutbreakMonitor from '@/jobs/outbreak-monitor.job';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await runOutbreakMonitor();

  return NextResponse.json({ success: true, message: 'Outbreak monitoring completed' });
}
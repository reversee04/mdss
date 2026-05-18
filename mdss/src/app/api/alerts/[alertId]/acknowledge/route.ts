import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const resolvedParams = await params;
  const alertId = resolvedParams.alertId;
  const body = await request.json();
  const { userId } = body;

  const alert = await prisma.outbreakAlert.update({
    where: { alert_id: alertId },
    data: {
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date(),
    },
  });

  return NextResponse.json(alert);
}
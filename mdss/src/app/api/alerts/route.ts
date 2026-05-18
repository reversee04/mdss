import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const diseaseId = searchParams.get('diseaseId');
  const severity = searchParams.get('severity');
  const acknowledged = searchParams.get('acknowledged');

  const alerts = await prisma.outbreakAlert.findMany({
    where: {
      ...(diseaseId && { disease_id: diseaseId }),
      ...(severity && { severity }),
      ...(acknowledged !== null && { acknowledged: acknowledged === 'true' }),
    },
    include: { disease: true },
    orderBy: { sent_at: 'desc' },
  });

  return NextResponse.json(alerts);
}
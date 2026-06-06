import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const diseases = await prisma.disease.findMany({
    where: {
      disease_id: { in: ['hiv', 'malaria', 'tb', 'cholera'] },
    },
    select: {
      disease_id: true,
      disease_name: true,
      outbreak_threshold: true,
      warning_threshold: true,
      monitoring_enabled: true,
      alert_recipients: true,
      alert_cooldown_hours: true,
    },
    orderBy: { disease_id: 'asc' },
  });

  return NextResponse.json(diseases);
}

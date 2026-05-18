import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ diseaseID: string }> }
) {
  const resolvedParams = await params;
  const diseaseId = resolvedParams.diseaseID;
  const body = await request.json();

  const disease = await prisma.disease.update({
    where: { disease_id: diseaseId },
    data: body,
  });

  return NextResponse.json(disease);
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ diseaseID: string }> }
) {
  try {
    const resolvedParams = await params;
    const diseaseId = resolvedParams.diseaseID;
    const body = await request.json();

    const allowedDiseaseIds = ['hiv', 'malaria', 'tb', 'cholera'];
    if (!allowedDiseaseIds.includes(diseaseId)) {
      return NextResponse.json(
        { success: false, error: 'Thresholds can only be configured for focused surveillance diseases.' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if ('outbreak_threshold' in body) {
      const value = Number(body.outbreak_threshold);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ success: false, error: 'outbreak_threshold must be a non-negative number.' }, { status: 400 });
      }
      data.outbreak_threshold = Math.round(value);
    }

    if ('warning_threshold' in body) {
      const value = Number(body.warning_threshold);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ success: false, error: 'warning_threshold must be a non-negative number.' }, { status: 400 });
      }
      data.warning_threshold = Math.round(value);
    }

    if ('monitoring_enabled' in body) {
      data.monitoring_enabled = Boolean(body.monitoring_enabled);
    }

    if ('alert_cooldown_hours' in body) {
      const value = Number(body.alert_cooldown_hours);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ success: false, error: 'alert_cooldown_hours must be a non-negative number.' }, { status: 400 });
      }
      data.alert_cooldown_hours = Math.round(value);
    }

    if ('alert_recipients' in body) {
      if (!Array.isArray(body.alert_recipients)) {
        return NextResponse.json({ success: false, error: 'alert_recipients must be an array.' }, { status: 400 });
      }
      data.alert_recipients = body.alert_recipients
        .map((recipient: unknown) => String(recipient).trim())
        .filter(Boolean);
    }

    const existingDisease = await prisma.disease.findUnique({
      where: { disease_id: diseaseId },
      select: { outbreak_threshold: true, warning_threshold: true },
    });

    const nextWarning = Number(data.warning_threshold ?? existingDisease?.warning_threshold ?? 0);
    const nextOutbreak = Number(data.outbreak_threshold ?? existingDisease?.outbreak_threshold ?? 0);

    if (nextWarning > 0 && nextOutbreak > 0 && nextWarning > nextOutbreak) {
      return NextResponse.json(
        { success: false, error: 'warning_threshold must be less than or equal to outbreak_threshold.' },
        { status: 400 }
      );
    }

    const disease = await prisma.disease.update({
      where: { disease_id: diseaseId },
      data,
      select: {
        disease_id: true,
        disease_name: true,
        outbreak_threshold: true,
        warning_threshold: true,
        monitoring_enabled: true,
        alert_recipients: true,
        alert_cooldown_hours: true,
      },
    });

    return NextResponse.json({ success: true, data: disease });
  } catch (error) {
    console.error('[Thresholds] Update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update disease thresholds',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

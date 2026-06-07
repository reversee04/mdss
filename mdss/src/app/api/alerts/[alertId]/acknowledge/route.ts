import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditAction, AuditCategory, AuditService, getAuditRequestContext } from '@/services/audit.service';

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

  await AuditService.log({
    userId: userId || null,
    action: AuditAction.ALERT_ACKNOWLEDGED,
    entityAffected: 'OutbreakAlert',
    entityId: alert.alert_id,
    details: `Acknowledged ${alert.severity} ${alert.alert_type} alert for disease ${alert.disease_id}`,
    category: AuditCategory.ALERT,
    ...getAuditRequestContext(request),
  });

  return NextResponse.json(alert);
}

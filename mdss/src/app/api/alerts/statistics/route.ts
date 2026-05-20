import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const diseaseId = searchParams.get('diseaseId');
    const district = searchParams.get('district');
    const region = searchParams.get('region');

    // Build where clause
    const where: any = {};
    if (diseaseId) where.disease_id = diseaseId;
    if (district) where.district = district;
    if (region) where.region = region;

    // Get total counts
    const totalCount = await prisma.outbreakAlert.count({ where });
    const acknowledgedCount = await prisma.outbreakAlert.count({ 
      where: { ...where, acknowledged: true } 
    });
    const activeCount = await prisma.outbreakAlert.count({ 
      where: { ...where, acknowledged: false } 
    });

    // Get counts by severity
    const severityCounts = await prisma.outbreakAlert.groupBy({
      by: ['severity'],
      where,
      _count: true,
    });

    const severityStats = severityCounts.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Get counts by alert type
    const typeCounts = await prisma.outbreakAlert.groupBy({
      by: ['alert_type'],
      where,
      _count: true,
    });

    const typeStats = typeCounts.reduce((acc, item) => {
      acc[item.alert_type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Get recent alerts (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentAlertsCount = await prisma.outbreakAlert.count({
      where: {
        ...where,
        sent_at: { gte: twentyFourHoursAgo },
      },
    });

    // Get average response time (time from sent_at to acknowledged_at)
    const acknowledgedAlerts = await prisma.outbreakAlert.findMany({
      where: {
        ...where,
        acknowledged: true,
        acknowledged_at: { not: null },
      },
      select: {
        sent_at: true,
        acknowledged_at: true,
      },
    });

    let avgResponseTimeHours = 0;
    if (acknowledgedAlerts.length > 0) {
      const totalResponseTime = acknowledgedAlerts.reduce((sum, alert) => {
        if (alert.acknowledged_at) {
          const diff = new Date(alert.acknowledged_at).getTime() - new Date(alert.sent_at).getTime();
          return sum + diff;
        }
        return sum;
      }, 0);
      avgResponseTimeHours = (totalResponseTime / acknowledgedAlerts.length) / (1000 * 60 * 60);
    }

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        acknowledged: acknowledgedCount,
        recent24h: recentAlertsCount,
        bySeverity: {
          critical: severityStats.critical || 0,
          high: severityStats.high || 0,
          medium: severityStats.medium || 0,
          low: severityStats.low || 0,
        },
        byType: {
          warning: typeStats.warning || 0,
          outbreak: typeStats.outbreak || 0,
        },
        avgResponseTimeHours: avgResponseTimeHours.toFixed(1),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Alerts] Statistics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve alert statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

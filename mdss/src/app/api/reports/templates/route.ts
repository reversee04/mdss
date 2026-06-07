import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '../../../../../auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      template_name,
      report_type,
      filters,
      chart_config,
      export_format,
      schedule_enabled,
      schedule_frequency,
      schedule_day,
      schedule_time,
      is_public,
      shared_with,
    } = body;

    if (!template_name) {
      return NextResponse.json({ error: 'template_name is required' }, { status: 400 });
    }

    const template = await prisma.reportTemplate.create({
      data: {
        template_name,
        report_type: report_type || 'surveillance',
        filters: filters || {},
        chart_config: chart_config || {},
        export_format: export_format || 'csv',
        schedule_enabled: schedule_enabled || false,
        schedule_frequency,
        schedule_day,
        schedule_time,
        is_public: is_public || false,
        shared_with: shared_with || [],
        user_id: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error creating template', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includePublic = searchParams.get('include_public') === 'true';

    const whereClause: any = {
      OR: [
        { user_id: session.user.id },
        { shared_with: { has: session.user.id } },
      ],
    };

    if (includePublic) {
      whereClause.OR.push({ is_public: true });
    }

    const templates = await prisma.reportTemplate.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

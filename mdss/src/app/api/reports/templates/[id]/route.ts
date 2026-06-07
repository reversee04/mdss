import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '../../../../../../auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.reportTemplate.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (
      template.user_id !== session.user.id &&
      !template.is_public &&
      !template.shared_with.includes(session.user.id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.reportTemplate.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (template.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updated = await prisma.reportTemplate.update({
      where: { id: params.id },
      data: {
        template_name: body.template_name,
        filters: body.filters,
        chart_config: body.chart_config,
        export_format: body.export_format,
        schedule_enabled: body.schedule_enabled,
        schedule_frequency: body.schedule_frequency,
        schedule_day: body.schedule_day,
        schedule_time: body.schedule_time,
        is_public: body.is_public,
        shared_with: body.shared_with,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating template', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.reportTemplate.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (template.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.reportTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

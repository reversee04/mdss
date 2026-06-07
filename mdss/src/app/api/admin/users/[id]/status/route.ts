import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '../../../../../../../auth';
import { AuditAction, AuditCategory, AuditService, AuditSeverity, getAuditRequestContext } from '@/services/audit.service';

function isAdmin(role?: string) {
  return role === 'admin' || role === 'System Admin';
}

// PATCH toggle user status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin role required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user status
    const user = await prisma.user.update({
      where: { user_id: id },
      data: { status },
    });

    await AuditService.log({
      userId: session.user.id,
      action: AuditAction.USER_STATUS_CHANGED,
      entityAffected: 'User',
      entityId: user.user_id,
      details: `Changed status for ${user.name} (${user.email}) from ${existingUser.status} to ${user.status}`,
      severity: status === 'inactive' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      category: AuditCategory.ADMIN,
      ...getAuditRequestContext(request),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.last_login ? user.last_login.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

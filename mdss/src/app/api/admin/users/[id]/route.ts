import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { VALID_ROLES, validateRole } from '@/lib/roles';
import { auth } from '../../../../../../auth';
import { AuditAction, AuditCategory, AuditService, AuditSeverity, getAuditRequestContext } from '@/services/audit.service';

function isAdmin(role?: string) {
  return role === 'admin' || role === 'System Admin';
}

// PUT update user
export async function PUT(
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
    const { name, email, password, role, status } = body;

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

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Validate role if provided
    if (role && !validateRole(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { user_id: id },
      data: updateData,
    });

    await AuditService.log({
      userId: session.user.id,
      action: role && role !== existingUser.role ? AuditAction.USER_ROLE_CHANGED : AuditAction.USER_UPDATED,
      entityAffected: 'User',
      entityId: user.user_id,
      details: role && role !== existingUser.role
        ? `Changed role for ${user.name} (${user.email}) from ${existingUser.role} to ${user.role}`
        : `Updated user ${user.name} (${user.email})`,
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
        createdAt: user.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
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

    // Delete user
    await prisma.user.delete({
      where: { user_id: id },
    });

    await AuditService.log({
      userId: session.user.id,
      action: AuditAction.USER_DELETED,
      entityAffected: 'User',
      entityId: existingUser.user_id,
      details: `Deleted user ${existingUser.name} (${existingUser.email})`,
      severity: AuditSeverity.WARNING,
      category: AuditCategory.ADMIN,
      ...getAuditRequestContext(request),
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

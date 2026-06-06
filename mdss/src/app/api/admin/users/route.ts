import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { VALID_ROLES, validateRole } from '@/lib/roles';

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.last_login ? user.last_login.toISOString() : null,
        createdAt: user.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, facility } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!validateRole(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        user_id: userId,
        name,
        email,
        password_hash: passwordHash,
        role,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

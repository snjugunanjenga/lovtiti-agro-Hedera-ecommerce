import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/auth-helpers';

const validRoles = [
  'BUYER',
  'FARMER',
  'DISTRIBUTOR',
  'TRANSPORTER',
  'AGROEXPERT',
  'VETERINARIAN',
  'ADMIN',
] as const;

export async function GET(req: NextRequest) {
  try {
    let authUser;
    try {
      authUser = requireUser(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[auth/sync-user] error fetching user', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let authUser;
    try {
      authUser = requireUser(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let role: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.role === 'string') {
        role = body.role.toUpperCase();
      }
    } catch {
      // ignore body parse errors (allow empty body)
    }

    if (role && !validRoles.includes(role as (typeof validRoles)[number])) {
      return NextResponse.json(
        { success: false, message: 'Invalid role specified' },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: role ? { role: role as any } : {},
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[auth/sync-user] error updating user', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync user' },
      { status: 500 },
    );
  }
}

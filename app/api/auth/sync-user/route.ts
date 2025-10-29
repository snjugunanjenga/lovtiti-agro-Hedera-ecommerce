import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Valid roles enum
const validRoles = ['BUYER', 'FARMER', 'DISTRIBUTOR', 'TRANSPORTER', 'AGROEXPERT', 'VETERINARIAN', 'ADMIN'] as const;

// Function to validate and normalize role
function validateRole(role: unknown): Role {
  const normalized =
    typeof role === 'string' && role.length > 0 ? role.toUpperCase() : '';

  if (validRoles.includes(normalized as any)) {
    return normalized as Role;
  }
  // Default to BUYER if role is invalid
  if (role) {
    console.warn(`Invalid role '${role}' provided, defaulting to BUYER`);
  }
  return 'BUYER' as Role;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Syncing user to database:', userId);

  // Get user from Clerk
  const clerkUser = await clerkClient().users.getUser(userId);
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    // Extract user data
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const rawRole =
      (clerkUser.publicMetadata?.role as string | undefined) ??
      (clerkUser.unsafeMetadata?.role as string | undefined) ??
      (clerkUser.privateMetadata?.role as string | undefined) ??
      'BUYER';
    const validatedRole = validateRole(rawRole);

    console.log('📋 User data:', { userId, email, role: validatedRole });

    // Create or update user in database - select only existing columns to avoid DB schema mismatch
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        role: validatedRole,
      },
      create: {
        id: userId,
        email,
        role: validatedRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('✅ User synced to database:', user);

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user,
    });

  } catch (error) {
    console.error('❌ Error syncing user:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to sync user',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database (select only existing columns)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('❌ Error fetching user:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}








import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Syncing user to database:', userId);

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    // Extract user data
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const role = (clerkUser.publicMetadata?.role as string) || 'BUYER';

    console.log('📋 User data:', { userId, email, role });

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        role: role as any,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email,
        role: role as any,
      },
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
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





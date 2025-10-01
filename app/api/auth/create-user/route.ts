import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logUserRegistration } from '@/utils/userActivityLogger';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role = 'BUYER' } = body;

    console.log('🔍 Creating user from Google sign-in:', { email, role });

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    // Generate a unique ID for the user (similar to Clerk format)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if user already exists by email
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser.id);
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        data: existingUser
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        role: (role as any)
      }
    });

    console.log('✅ User created successfully:', newUser);

    // Log user registration activity
    logUserRegistration(newUser.id, newUser.role, newUser.email, {
      registrationMethod: 'google_signin',
      timestamp: new Date().toISOString(),
      source: 'manual_creation'
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

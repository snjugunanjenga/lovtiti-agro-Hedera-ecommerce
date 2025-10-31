import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    let authUser;
    try {
      authUser = requireUser(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        profiles: {
          select: {
            type: true,
            hederaWallet: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const farmerProfile = user.profiles.find((profile) => profile.type === 'FARMER');
    const walletAddress = farmerProfile?.hederaWallet?.trim();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      walletAddress: walletAddress || undefined,
      isContractFarmer: Boolean(walletAddress),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

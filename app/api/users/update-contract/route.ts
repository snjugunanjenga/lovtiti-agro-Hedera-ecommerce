import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/users/update-contract
 * Update user contract information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contractAddress, isContractFarmer } = body;

    // Validate required fields
    if (!userId || !contractAddress) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userId, contractAddress' 
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format' 
        },
        { status: 400 }
      );
    }

    // Update user with contract information
    const updateResult = await prisma.profile.updateMany({
      where: {
        userId,
        type: 'FARMER',
      },
      data: {
        hederaWallet: contractAddress,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Farmer profile not found for user',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        contractAddress,
        isContractFarmer: true,
      }
    });

  } catch (error) {
    console.error('Error updating user contract info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user contract information' 
      },
      { status: 500 }
    );
  }
}







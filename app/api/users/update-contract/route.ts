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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        contractAddress,
        isContractFarmer: isContractFarmer || false,
        contractCreatedAt: new Date(),
        contractBalance: 0
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.id,
        contractAddress: updatedUser.contractAddress,
        isContractFarmer: updatedUser.isContractFarmer,
        contractCreatedAt: updatedUser.contractCreatedAt
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







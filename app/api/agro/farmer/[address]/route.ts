import { NextRequest, NextResponse } from 'next/server';
import { createAgroContractService } from '@/utils/agroContract';

// Initialize contract service
const contractService = createAgroContractService(
  process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS || '',
  'testnet'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Basic validation
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format' 
        },
        { status: 400 }
      );
    }

    // Check if the address is registered as a farmer
    const result = await contractService.whoFarmer(address);

    return NextResponse.json({
      success: true,
      data: {
        exists: result.success && result.data?.exists,
        ...result.data
      }
    });

  } catch (error) {
    console.error('Error checking farmer status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check farmer status' 
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { AgroContractService, createAgroContractService } from '@/utils/agroContract';
import { getContractAddress } from '@/utils/getContractAddress';

let contractService: AgroContractService | null = null;

const getContractService = (): AgroContractService | null => {
  if (contractService) {
    return contractService;
  }

  const address = getContractAddress();

  if (!address) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to enable farmer contract endpoints.'
      );
    }
    return null;
  }

  contractService = createAgroContractService(
    address,
    (process.env.NETWORK as 'mainnet' | 'testnet' | 'local') || 'testnet'
  );

  return contractService;
};

/**
 * POST /api/agro/farmer/create
 * Create a farmer account on the smart contract during signup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, privateKey, userId } = body;

    // Validate required fields
    if (!walletAddress || !privateKey || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: walletAddress, privateKey, userId' 
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format' 
        },
        { status: 400 }
      );
    }

    const service = getContractService();

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agro contract address is not configured.'
        },
        { status: 500 }
      );
    }

    // Check if farmer already exists
    const farmerCheck = await service.isFarmer(walletAddress);
    if (farmerCheck.success && farmerCheck.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Farmer already exists on the contract' 
        },
        { status: 409 }
      );
    }

    // Create farmer on contract
    const result = await service.createFarmer({
      walletAddress,
      privateKey,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to create farmer on contract' 
        },
        { status: 500 }
      );
    }

    // Log the transaction for audit purposes
    console.log(`Farmer created: ${walletAddress} for user: ${userId}`, {
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed?.toString()
    });

    return NextResponse.json({
      success: true,
      data: {
        farmerAddress: walletAddress,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed?.toString(),
        userId
      }
    });

  } catch (error) {
    console.error('Error creating farmer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agro/farmer/[address]
 * Get farmer information from the contract
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid wallet address format' 
        },
        { status: 400 }
      );
    }

    const service = getContractService();

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agro contract address is not configured.'
        },
        { status: 500 }
      );
    }

    const result = await service.getFarmerInfo(address);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to get farmer information' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting farmer info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

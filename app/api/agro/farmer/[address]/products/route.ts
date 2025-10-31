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
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to fetch farmer products.'
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
 * GET /api/agro/farmer/[address]/products
 * Get all products for a specific farmer
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

    const result = await service.getFarmerProducts(address);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to get farmer products' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting farmer products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

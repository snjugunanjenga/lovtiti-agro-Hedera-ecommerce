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
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to fetch product information.'
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
 * GET /api/agro/products/[productId]
 * Get specific product information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid product ID' 
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

    const result = await service.getProduct(BigInt(productId));

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to get product information' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

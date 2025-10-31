import { NextRequest, NextResponse } from 'next/server';
import { AgroContractService, createAgroContractService } from '@/utils/agroContract';

let contractService: AgroContractService | null = null;

const getContractService = (): AgroContractService | null => {
  if (contractService) {
    return contractService;
  }

  const contractAddress =
    process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_CONTRACT ||
    process.env.AGRO_CONTRACT_ADDRESS ||
    '';

  if (!contractAddress) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to enable farmer lookup.'
      );
    }
    return null;
  }

  contractService = createAgroContractService(contractAddress, 'testnet');
  return contractService;
};

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

    // Check if the address is registered as a farmer
    const result = await service.getFarmerInfo(address);

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

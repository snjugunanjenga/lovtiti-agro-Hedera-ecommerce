import { NextRequest, NextResponse } from 'next/server';
import { AgroContractService, createAgroContractService } from '@/utils/agroContract';
import { BuyProductParams, WithdrawBalanceParams } from '@/types/agro-contract';
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
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to enable purchase endpoints.'
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
 * POST /api/agro/purchase/buy
 * Buy a product from the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, amount,  walletAddress, privateKey, userId } = body;

    // Validate required fields
    if (!productId || !amount || !walletAddress || !privateKey || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: productId, amount, value, walletAddress, privateKey, userId' 
        },
        { status: 400 }
      );
    }
    // Amount must be > 0
    if (BigInt(amount) <= 0n) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
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
    
    // Get product information to validate purchase
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

    const productResult = await service.getProduct(BigInt(productId));
    if (!productResult.success || !productResult.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }

    const product = productResult.data;

    // Validate purchase conditions
    if (product.stock < BigInt(amount)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient stock available' 
        },
        { status: 400 }
      );
    }

    if (product.owner.toLowerCase() === walletAddress.toLowerCase()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot buy your own product' 
        },
        { status: 400 }
      );
    }
    const totalPriceTinybar = product.price * BigInt(amount);

    // Execute purchase on contract
    const buyParams: BuyProductParams = {
      productId: BigInt(productId),
      amount: BigInt(amount),
      walletAddress,
      privateKey
    };

    const result = await service.buyProduct(buyParams);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to purchase product' 
        },
        { status: 500 }
      );
    }

    // Log the transaction for audit purposes
    console.log(`Product purchased: ${productId} by buyer: ${walletAddress}`, {
      amount: amount,
      valueTinybar: totalPriceTinybar.toString(),
      sellerAddress: product.owner,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed?.toString()
    });

    return NextResponse.json({
      success: true,
      data: {
        productId,
        amount: amount,
        valueTinybar: totalPriceTinybar.toString(),
        buyerAddress: walletAddress,
        sellerAddress: product.owner,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed?.toString(),
        userId
      }
    });

  } catch (error) {
    console.error('Error purchasing product:', error);
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
 * POST /api/agro/purchase/withdraw
 * Withdraw farmer balance
 */
export async function PUT(request: NextRequest) {
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

    // Check if user is a farmer
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

    const farmerCheck = await service.isFarmer(walletAddress);
    if (!farmerCheck.success || !farmerCheck.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User is not a registered farmer' 
        },
        { status: 403 }
      );
    }

    // Get farmer balance
    const farmerInfo = await service.getFarmerInfo(walletAddress);
    if (!farmerInfo.success || !farmerInfo.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get farmer information' 
        },
        { status: 500 }
      );
    }

    if (farmerInfo.data.balance <= 0n) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No balance to withdraw' 
        },
        { status: 400 }
      );
    }

    // Withdraw balance from contract
    const withdrawParams: WithdrawBalanceParams = {
      walletAddress,
      privateKey
    };

    const result = await service.withdrawBalance(withdrawParams);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to withdraw balance' 
        },
        { status: 500 }
      );
    }

    // Log the transaction for audit purposes
    console.log(`Balance withdrawn by farmer: ${walletAddress}`, {
      withdrawnAmount: farmerInfo.data.balance.toString(),
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed?.toString()
    });

    return NextResponse.json({
      success: true,
      data: {
        farmerAddress: walletAddress,
        withdrawnAmount: farmerInfo.data.balance.toString(),
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed?.toString(),
        userId
      }
    });

  } catch (error) {
    console.error('Error withdrawing balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

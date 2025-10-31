// Agro Contract Service for Lovtiti Agro Mart
import { ethers } from 'ethers';
import { 
  AGRO_CONTRACT_ABI, 
  ContractConfig, 
  AddProductParams, 
  BuyProductParams, 
  UpdateStockParams, 
  IncreasePriceParams, 
  WithdrawBalanceParams,
  ContractResponse,
  FarmerInfo,
  ProductInfo,
  Product,
  FarmerStruct,
  BaseContractParams
} from '../types/agro-contract';

// Hedera native currency uses 8 decimal places; EVM msg.value expects 18.
// Multiply tinybars (1e8) by 1e10 to convert to wei (1e18).
const tinybarToWei = (amount: bigint): bigint => amount * 10n ** 10n;

export class AgroContractService {
  private config: ContractConfig;
  private provider: ethers.Provider;
  private contract: ethers.Contract & {
    createFarmer(): Promise<ethers.ContractTransactionResponse>;
    addProduct(price: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse>;
    increasePrice(price: bigint, pid: bigint): Promise<ethers.ContractTransactionResponse>;
    updateStock(stock: bigint, pid: bigint): Promise<ethers.ContractTransactionResponse>;
    buyproduct(pid: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse>;
    withdrawBalance(): Promise<ethers.ContractTransactionResponse>;
    whoFarmer(user: string): Promise<[bigint[], bigint, boolean]>;
    viewProducts(farmer: string): Promise<[bigint, string, bigint, bigint][]>;
    products(id: bigint): Promise<[bigint, string, bigint, bigint]>;
    farmer(address: string): Promise<[bigint[], bigint, boolean]>;
  };

  /**
   * Helper to get contract with signer, handling both injected signer and private key cases
   */
  private async getContractWithSigner(params: BaseContractParams): Promise<typeof this.contract> {
    if (params.signer) {
      // Use provided signer (preferred for MetaMask/injected wallet)
      return this.contract.connect(params.signer) as typeof this.contract;
    } else if (params.privateKey) {
      // Fallback to private key (for testing/server ops only)
      if (!params.privateKey) throw new Error('Private key is required when signer is not provided');
      const wallet = new ethers.Wallet(params.privateKey, this.provider);
      return this.contract.connect(wallet) as typeof this.contract;
    } else {
      throw new Error('Either signer or privateKey must be provided');
    }
  }

  private isBaseParams(input: ethers.Signer | BaseContractParams): input is BaseContractParams {
    return typeof (input as BaseContractParams).walletAddress === 'string';
  }

  constructor(config: ContractConfig) {
    this.config = config;

    const envRpc =
      config.rpcUrl ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.RPC_URL;

    if (envRpc) {
      this.provider = new ethers.JsonRpcProvider(envRpc);
    } else {
      switch (config.network) {
        case 'mainnet':
          this.provider = new ethers.JsonRpcProvider('https://mainnet.hashio.io/api');
          break;
        case 'testnet':
          this.provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
          break;
        case 'local':
          this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
          break;
        default:
          throw new Error('Unsupported network');
      }
    }

    if (!config.address) {
      throw new Error('Contract address is required to initialize AgroContractService');
    }

    this.contract = new ethers.Contract(
      config.address,
      config.abi ?? AGRO_CONTRACT_ABI,
      this.provider
    ) as ethers.Contract & {
      createFarmer(): Promise<ethers.ContractTransactionResponse>;
      addProduct(price: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse>;
      increasePrice(price: bigint, pid: bigint): Promise<ethers.ContractTransactionResponse>;
      updateStock(stock: bigint, pid: bigint): Promise<ethers.ContractTransactionResponse>;
      buyproduct(pid: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse>;
      withdrawBalance(): Promise<ethers.ContractTransactionResponse>;
      whoFarmer(user: string): Promise<[bigint[], bigint, boolean]>;
      viewProducts(farmer: string): Promise<[bigint, string, bigint, bigint][]>;
      products(id: bigint): Promise<[bigint, string, bigint, bigint]>;
      farmer(address: string): Promise<[bigint[], bigint, boolean]>;
    };
  }

  /**
   * Create a farmer account on the contract
   * This should be called during user signup for farmers
   */
  async createFarmer(input: ethers.Signer | BaseContractParams): Promise<ContractResponse> {
    try {
      let signer: ethers.Signer;
      let walletAddress: string;

      if (this.isBaseParams(input)) {
        if (input.signer) {
          signer = input.signer;
        } else if (input.privateKey) {
          signer = new ethers.Wallet(input.privateKey, this.provider);
        } else {
          throw new Error('Signer or private key is required to create a farmer');
        }
        walletAddress = input.walletAddress;
      } else {
        signer = input;
        walletAddress = await signer.getAddress();
      }

      const contractWithSigner = this.contract.connect(signer) as typeof this.contract;

      // Call the createFarmer function on the smart contract
      const tx = await contractWithSigner.createFarmer();
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      const statusValue = typeof receipt.status === 'bigint' ? receipt.status : BigInt(receipt.status ?? 0);
      if (statusValue !== 1n) {
        return {
          success: false,
          error: 'Contract reverted while creating farmer',
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed
        };
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          farmerAddress: walletAddress,
          transactionHash: receipt.hash,
        }
      };
    } catch (error) {
      console.error('Error creating farmer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add a product to the marketplace
   */
  async addProduct(params: AddProductParams): Promise<ContractResponse> {
    try {
      const contractWithSigner = await this.getContractWithSigner(params);

      const tx = await contractWithSigner.addProduct(params.price, params.amount);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      let createdProductId: bigint | null = null;
      const iface = this.contract.interface;

      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'productCreated' || parsed?.name === 'ProductCreated') {
              const idArg = parsed.args?.productId ?? parsed.args?.[0];
              if (idArg !== undefined) {
                createdProductId =
                  typeof idArg === 'bigint'
                    ? idArg
                    : BigInt(idArg.toString());
                break;
              }
            }
          } catch {
            // ignore logs that don't belong to this contract
          }
        }
      }

      let productInfo: ProductInfo | null = null;

      if (createdProductId != null) {
        try {
          const [price, owner, stock, id] = await this.contract.products(createdProductId);
          productInfo = {
            price,
            owner,
            stock,
            id,
            farmerAddress: owner,
          };
        } catch (productError) {
          console.warn('Failed to fetch freshly created product info:', productError);
        }
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          productId: createdProductId,
          price: params.price,
          amount: params.amount,
          farmerAddress: params.walletAddress,
          hederaAccountId: params.hederaAccountId,
          productInfo,
        }
      };
    } catch (error) {
      console.error('Error adding product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Buy a product from the marketplace
   */
  async buyProduct(params: BuyProductParams): Promise<ContractResponse> {
    try {
      const contractWithSigner = await this.getContractWithSigner(params);

      let valueWei = params.value ?? null;
      let computedTinybarTotal: bigint | null = null;

      if (valueWei === null) {
        const rawProductData = await contractWithSigner.products(params.productId);
        let unitPrice: bigint | undefined;

        if (
          rawProductData &&
          typeof rawProductData === 'object' &&
          !Array.isArray(rawProductData) &&
          'price' in (rawProductData as Product)
        ) {
          const candidate = (rawProductData as Product).price;
          if (typeof candidate === 'bigint') {
            unitPrice = candidate;
          }
        }

        if (unitPrice === undefined && Array.isArray(rawProductData)) {
          const tupleCandidate = rawProductData[0];
          if (typeof tupleCandidate === 'bigint') {
            unitPrice = tupleCandidate;
          }
        }

        if (unitPrice === undefined) {
          throw new Error('Unable to determine product price from contract');
        }
        computedTinybarTotal = unitPrice * params.amount;
        valueWei = tinybarToWei(computedTinybarTotal);
      }

      if (valueWei === null) {
        throw new Error('Unable to determine total payment value for purchase');
      }

      console.info('[AgroContract] buyProduct request', {
        productId: params.productId.toString(),
        amount: params.amount.toString(),
        totalValueTinybar: computedTinybarTotal ? computedTinybarTotal.toString() : null,
        totalValueWei: valueWei.toString(),
        suppliedValue: params.value ? params.value.toString() : null,
        wallet: params.walletAddress
      });

      const overrides: ethers.Overrides = {
        value: valueWei
      };

      const attemptBuy = async () =>
        (contractWithSigner.buyproduct as (
          pid: bigint,
          amount: bigint,
          overrides?: ethers.Overrides
        ) => Promise<ethers.ContractTransactionResponse>)(
          params.productId,
          params.amount,
          overrides
        );

      let receipt: ethers.ContractTransactionReceipt | null = null;

      try {
        const tx = await attemptBuy();
        receipt = await tx.wait();
      } catch (rawError) {
        const error = rawError as any;
        console.warn('[AgroContract] primary buyproduct call failed', {
          code: error?.code,
          reason: error?.reason,
          action: error?.action,
          message: error instanceof Error ? error.message : String(error)
        });

        const looksLikeNodeSimulationBug =
          (error?.code === 'CALL_EXCEPTION' && error?.reason === 'insufficient funds' && error?.action === 'estimateGas') ||
          error?.info?.error?.message?.toLowerCase?.().includes('insufficient funds');

        if (!looksLikeNodeSimulationBug) {
          console.error('buyProduct failed during primary send', error);
          throw error;
        }

        try {
          console.info('[AgroContract] attempting fallback sendTransaction');

          const signer =
            (contractWithSigner.runner as ethers.Signer | null | undefined) ??
            params.signer ??
            null;

          if (!signer) {
            throw new Error('Signer unavailable for fallback transaction');
          }

          const populated = await contractWithSigner.getFunction('buyproduct').populateTransaction(
            params.productId,
            params.amount,
            overrides
          );

          const fallbackTx = await signer.sendTransaction({
            ...populated,
            value: valueWei,
            gasLimit: populated.gasLimit ?? 500000n
          });

          console.info('[AgroContract] fallback transaction sent', {
            hash: fallbackTx.hash,
            gasLimit: fallbackTx.gasLimit?.toString(),
            value: fallbackTx.value?.toString()
          });

          receipt = (await fallbackTx.wait()) as ethers.ContractTransactionReceipt;
        } catch (fallbackError) {
          console.error('buyProduct fallback send failed', fallbackError);
          throw fallbackError;
        }
      }

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          productId: params.productId,
          amount: params.amount,
          buyerAddress: params.walletAddress,
          value: valueWei,
          hederaAccountId: params.hederaAccountId
        }
      };
    } catch (error) {
      console.error('Error buying product:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update product stock
   */
  async updateStock(params: UpdateStockParams): Promise<ContractResponse> {
    try {
      const contractWithSigner = await this.getContractWithSigner(params);

      const tx = await contractWithSigner.updateStock(params.stock, params.productId);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          productId: params.productId,
          newStock: params.stock,
          hederaAccountId: params.hederaAccountId
        }
      };
    } catch (error) {
      console.error('Error updating stock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Increase product price
   */
  async increasePrice(params: IncreasePriceParams): Promise<ContractResponse> {
    try {
      const contractWithSigner = await this.getContractWithSigner(params);

      const tx = await contractWithSigner.increasePrice(params.price, params.productId);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          productId: params.productId,
          newPrice: params.price,
          hederaAccountId: params.hederaAccountId
        }
      };
    } catch (error) {
      console.error('Error increasing price:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Withdraw farmer balance
   */
  async withdrawBalance(params: WithdrawBalanceParams): Promise<ContractResponse> {
    try {
      const contractWithSigner = await this.getContractWithSigner(params);

      const tx = await contractWithSigner.withdrawBalance();
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed,
        data: {
          farmerAddress: params.walletAddress,
          withdrawnAmount: BigInt(0), // TODO: Get actual amount from event
          hederaAccountId: params.hederaAccountId
        }
      };
    } catch (error) {
      console.error('Error withdrawing balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get farmer information
   */
  async getFarmerInfo(farmerAddress: string): Promise<ContractResponse<FarmerInfo>> {
    try {
      const [products, balance, exists] = await this.contract.whoFarmer(farmerAddress);
      
      return {
        success: true,
        data: {
          address: farmerAddress,
          products,
          balance,
          exists
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get farmer's products
   */
  async getFarmerProducts(farmerAddress: string): Promise<ContractResponse<ProductInfo[]>> {
    try {
      const products: [bigint, string, bigint, bigint][] = await this.contract.viewProducts(farmerAddress);
      
      const productInfos: ProductInfo[] = products.map(([price, owner, stock, id]) => ({
        price,
        owner,
        stock,
        id,
        farmerAddress
      }));

      return {
        success: true,
        data: productInfos
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get specific product information
   */
  async getProduct(productId: bigint): Promise<ContractResponse<ProductInfo>> {
    try {
      const [price, owner, stock, id] = await this.contract.products(productId);
      
      return {
        success: true,
        data: {
          price,
          owner,
          stock,
          id,
          farmerAddress: owner
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if an address is a registered farmer
   */
  async isFarmer(address: string): Promise<ContractResponse<boolean>> {
    try {
      const [, , exists] = await this.contract.farmer(address);
      
      return {
        success: true,
        data: exists
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(method: string, params: any[]): Promise<ContractResponse<bigint>> {
    try {
      const gasEstimate = await this.contract[method].estimateGas(...params);
      
      return {
        success: true,
        data: gasEstimate
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get contract events
   */
  async getEvents(eventName: string, fromBlock?: number, toBlock?: number): Promise<ContractResponse<any[]>> {
    try {
      const filter = this.contract.filters[eventName]();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      
      return {
        success: true,
        data: events
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Factory function to create contract service instance
export function createAgroContractService(
  contractAddress: string,
  network: 'mainnet' | 'testnet' | 'local' = 'testnet',
  rpcUrl?: string
): AgroContractService {
  const config: ContractConfig = {
    address: contractAddress,
    abi: AGRO_CONTRACT_ABI,
    network,
    rpcUrl: rpcUrl || process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
  };

  return new AgroContractService(config);
}

// Default contract configuration
const resolveContractAddress = () =>
  process.env.NEXT_PUBLIC_CONTRACT ||
  process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
  '';

export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  address: resolveContractAddress(),
  abi: AGRO_CONTRACT_ABI,
  network: (process.env.NEXT_PUBLIC_NETWORK as 'mainnet' | 'testnet' | 'local') || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
};

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, BrowserProvider, Signer } from 'ethers';
import {
  AgroContractService,
  DEFAULT_CONTRACT_CONFIG,
} from '@/utils/agroContract';
import type {
  FarmerInfo,
  ProductInfo,
  AddProductParams,
  BuyProductParams,
  UpdateStockParams,
  IncreasePriceParams,
  WithdrawBalanceParams,
} from '@/types/agro-contract';

type WalletActionResult<T = unknown> = {
  success: boolean;
  transactionHash?: string;
  transactionId?: string;
  data?: T;
  error?: string;
};

type FarmerStatusResult = {
  success: boolean;
  isFarmer: boolean;
  error?: string;
};

type FarmerInfoResult = {
  success: boolean;
  data?: FarmerInfo | null;
  error?: string;
};

type FarmerProductsResult = {
  success: boolean;
  data?: ProductInfo[] | null;
  error?: string;
};

export interface WalletConnection {
  signer: Signer;
  address: string;
  provider: BrowserProvider;
  chainId: number | null;
  isConnected: boolean;
  hederaAccountId?: string | null;
}

export interface UseWalletResult {
  wallet: WalletConnection | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isCreatingFarmer: boolean;
  isAddingProduct: boolean;
  isUpdatingStock: boolean;
  isIncreasingPrice: boolean;
  isBuyingProduct: boolean;
  isWithdrawing: boolean;
  isFarmer: boolean | null;
  farmerInfo: FarmerInfo | null;
  farmerProducts: ProductInfo[] | null;
  connectWallet: () => Promise<WalletConnection | null>;
  disconnectWallet: () => void;
  createFarmerAccount: (userId?: string) => Promise<WalletActionResult>;
  addProduct: (
    price: string | number | bigint,
    amount: string | number | bigint,
    userId?: string
  ) => Promise<WalletActionResult>;
  updateStock: (
    productId: string | number | bigint,
    stock: string | number | bigint,
    userId?: string
  ) => Promise<WalletActionResult>;
  increasePrice: (
    productId: string | number | bigint,
    price: string | number | bigint,
    userId?: string
  ) => Promise<WalletActionResult>;
  buyProduct: (
    productId: string | number | bigint,
    amount: string | number | bigint,
    value: string | number | bigint,
    userId?: string
  ) => Promise<WalletActionResult>;
  withdrawBalance: (userId?: string) => Promise<WalletActionResult>;
  checkFarmerStatus: (address?: string) => Promise<FarmerStatusResult>;
  getFarmerInfo: (address?: string) => Promise<FarmerInfoResult>;
  getFarmerProducts: (address?: string) => Promise<FarmerProductsResult>;
}

let contractServiceSingleton: AgroContractService | null = null;

const HEDERA_CHAIN_ID_DEC = 296;
const HEDERA_CHAIN_ID_HEX = '0x128';

const HEDERA_TESTNET_PARAMS = {
  chainId: HEDERA_CHAIN_ID_HEX,
  chainName: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: ['https://testnet.hashio.io/api'],
  blockExplorerUrls: ['https://hashscan.io/testnet'],
};

const getAgroContractService = (): AgroContractService | null => {
  if (contractServiceSingleton) {
    return contractServiceSingleton;
  }

  if (!DEFAULT_CONTRACT_CONFIG.address) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Agro contract address is not configured. Set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS to enable contract calls.'
      );
    }
    return null;
  }

  try {
    contractServiceSingleton = new AgroContractService(DEFAULT_CONTRACT_CONFIG);
  } catch (error) {
    console.error('Failed to initialize AgroContractService', error);
    contractServiceSingleton = null;
  }

  return contractServiceSingleton;
};

const ensureHederaNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HEDERA_CHAIN_ID_HEX }],
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [HEDERA_TESTNET_PARAMS],
      });
    } else {
      throw error;
    }
  }
};

const toUint256 = (
  value: string | number | bigint,
  label: string
): bigint => {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid ${label} value`);
    }
    if (!Number.isInteger(value)) {
      throw new Error(`${label} must be a whole number`);
    }
    return BigInt(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`${label} is required`);
    }
    if (trimmed.includes('.')) {
      throw new Error(`${label} must be a whole number`);
    }
    return BigInt(trimmed);
  }

  throw new Error(`Unsupported ${label} value`);
};

const toWei = (
  value: string | number | bigint,
  label: string
): bigint => {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    return ethers.parseEther(value.toString());
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`${label} is required`);
    }
    return ethers.parseEther(normalized);
  }

  throw new Error(`Unsupported ${label} value`);
};

export const useWallet = (): UseWalletResult => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingFarmer, setIsCreatingFarmer] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isIncreasingPrice, setIsIncreasingPrice] = useState(false);
  const [isBuyingProduct, setIsBuyingProduct] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isFarmer, setIsFarmer] = useState<boolean | null>(null);
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [farmerProducts, setFarmerProducts] = useState<ProductInfo[] | null>(
    null
  );

  const contractService = useMemo(() => getAgroContractService(), []);

  const ensureWalletReady = useCallback(() => {
    if (!contractService) {
      throw new Error(
        'Smart contract is not configured. Please set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS.'
      );
    }

    if (!wallet?.signer) {
      throw new Error('Wallet not connected');
    }

    return { contract: contractService, currentWallet: wallet };
  }, [contractService, wallet]);

  const checkFarmerStatus = useCallback(
    async (address?: string): Promise<FarmerStatusResult> => {
      if (!contractService) {
        const message =
          'Smart contract is not configured. Please set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS.';
        setError(message);
        return { success: false, isFarmer: false, error: message };
      }

      const targetAddress =
        (typeof address === 'string' && address) || wallet?.address;

      if (!targetAddress) {
        return {
          success: false,
          isFarmer: false,
          error: 'Wallet address is required to check farmer status',
        };
      }

      try {
        const response = await contractService.isFarmer(targetAddress);
        const status = response.data ?? false;

        if (!address || targetAddress === wallet?.address) {
          setIsFarmer(status);
        }

        if (!response.success && response.error) {
          setError(response.error);
        }

        return {
          success: response.success,
          isFarmer: status,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to check farmer status';
        setError(message);
        return { success: false, isFarmer: false, error: message };
      }
    },
    [contractService, wallet?.address]
  );

  const getFarmerInfo = useCallback(
    async (address?: string): Promise<FarmerInfoResult> => {
      if (!contractService) {
        const message =
          'Smart contract is not configured. Please set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS.';
        setError(message);
        return { success: false, data: null, error: message };
      }

      const targetAddress =
        (typeof address === 'string' && address) || wallet?.address;

      if (!targetAddress) {
        return {
          success: false,
          data: null,
          error: 'Wallet address is required to fetch farmer info',
        };
      }

      try {
        const response = await contractService.getFarmerInfo(targetAddress);

        if (!address || targetAddress === wallet?.address) {
          setFarmerInfo(response.data ?? null);
        }

        if (!response.success && response.error) {
          setError(response.error);
        }

        return {
          success: response.success,
          data: response.data ?? null,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch farmer information';
        setError(message);
        return { success: false, data: null, error: message };
      }
    },
    [contractService, wallet?.address]
  );

  const getFarmerProducts = useCallback(
    async (address?: string): Promise<FarmerProductsResult> => {
      if (!contractService) {
        const message =
          'Smart contract is not configured. Please set NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS.';
        setError(message);
        return { success: false, data: null, error: message };
      }

      const targetAddress =
        (typeof address === 'string' && address) || wallet?.address;

      if (!targetAddress) {
        return {
          success: false,
          data: null,
          error: 'Wallet address is required to fetch products',
        };
      }

      try {
        const response = await contractService.getFarmerProducts(
          targetAddress
        );

        if (!address || targetAddress === wallet?.address) {
          setFarmerProducts(response.data ?? null);
        }

        if (!response.success && response.error) {
          setError(response.error);
        }

        return {
          success: response.success,
          data: response.data ?? null,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch farmer products';
        setError(message);
        return { success: false, data: null, error: message };
      }
    },
    [contractService, wallet?.address]
  );

  const refreshFarmerState = useCallback(
    async (address?: string) => {
      const targetAddress = address || wallet?.address;
      if (!targetAddress) {
        return;
      }

      await Promise.allSettled([
        checkFarmerStatus(targetAddress),
        getFarmerInfo(targetAddress),
        getFarmerProducts(targetAddress),
      ]);
    },
    [
      wallet?.address,
      checkFarmerStatus,
      getFarmerInfo,
      getFarmerProducts,
    ]
  );

  const connectWallet = useCallback(async (): Promise<WalletConnection | null> => {
    if (typeof window === 'undefined') {
      setError('Wallet connection is only available in the browser');
      return null;
    }

    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to continue.');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await ensureHederaNetwork();

      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== HEDERA_CHAIN_ID_DEC) {
        throw new Error(
          `Wrong network: expected Hedera Testnet (${HEDERA_CHAIN_ID_DEC}), got ${network.chainId.toString()}`
        );
      }

      const nextWallet: WalletConnection = {
        address,
        signer,
        provider,
        chainId: Number(network.chainId),
        isConnected: true,
        hederaAccountId: null,
      };

      setWallet(nextWallet);
      setIsConnected(true);

      await refreshFarmerState(address);

      return nextWallet;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      setWallet(null);
      setIsConnected(false);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshFarmerState]);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    setIsFarmer(null);
    setFarmerInfo(null);
    setFarmerProducts(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
        return;
      }
      void connectWallet();
    };

    const handleChainChanged = () => {
      void connectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  useEffect(() => {
    if (!wallet?.address) {
      setIsFarmer(null);
      setFarmerInfo(null);
      setFarmerProducts(null);
      return;
    }

    void refreshFarmerState(wallet.address);
  }, [wallet?.address, refreshFarmerState]);

  const createFarmerAccount = useCallback(
    async (userId?: string): Promise<WalletActionResult> => {
      setIsCreatingFarmer(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const response = await contract.createFarmer(currentWallet.signer);

        if (response.success) {
          await refreshFarmerState(currentWallet.address);
        }

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to create farmer account';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsCreatingFarmer(false);
      }
    },
    [ensureWalletReady, refreshFarmerState]
  );

  const addProduct = useCallback(
    async (
      priceInput: string | number | bigint,
      amountInput: string | number | bigint,
      userId?: string
    ): Promise<WalletActionResult> => {
      setIsAddingProduct(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const params: AddProductParams = {
          price: toWei(priceInput, 'price'),
          amount: toUint256(amountInput, 'amount'),
          walletAddress: currentWallet.address,
          signer: currentWallet.signer,
          hederaAccountId: currentWallet.hederaAccountId ?? null,
        };

        const response = await contract.addProduct(params);

        if (response.success) {
          await refreshFarmerState(currentWallet.address);
        }

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add product';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsAddingProduct(false);
      }
    },
    [ensureWalletReady, refreshFarmerState]
  );

  const updateStock = useCallback(
    async (
      productIdInput: string | number | bigint,
      stockInput: string | number | bigint,
      userId?: string
    ): Promise<WalletActionResult> => {
      setIsUpdatingStock(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const params: UpdateStockParams = {
          productId: toUint256(productIdInput, 'product id'),
          stock: toUint256(stockInput, 'stock'),
          walletAddress: currentWallet.address,
          signer: currentWallet.signer,
          hederaAccountId: currentWallet.hederaAccountId ?? null,
        };

        const response = await contract.updateStock(params);

        if (response.success) {
          await refreshFarmerState(currentWallet.address);
        }

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update stock';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsUpdatingStock(false);
      }
    },
    [ensureWalletReady, refreshFarmerState]
  );

  const increasePrice = useCallback(
    async (
      productIdInput: string | number | bigint,
      priceInput: string | number | bigint,
      userId?: string
    ): Promise<WalletActionResult> => {
      setIsIncreasingPrice(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const params: IncreasePriceParams = {
          productId: toUint256(productIdInput, 'product id'),
          price: toWei(priceInput, 'price'),
          walletAddress: currentWallet.address,
          signer: currentWallet.signer,
          hederaAccountId: currentWallet.hederaAccountId ?? null,
        };

        const response = await contract.increasePrice(params);

        if (response.success) {
          await refreshFarmerState(currentWallet.address);
        }

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to increase product price';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsIncreasingPrice(false);
      }
    },
    [ensureWalletReady, refreshFarmerState]
  );

  const buyProduct = useCallback(
    async (
      productIdInput: string | number | bigint,
      amountInput: string | number | bigint,
      valueInput: string | number | bigint,
      userId?: string
    ): Promise<WalletActionResult> => {
      setIsBuyingProduct(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const params: BuyProductParams = {
          productId: toUint256(productIdInput, 'product id'),
          amount: toUint256(amountInput, 'amount'),
          value: toWei(valueInput, 'value'),
          walletAddress: currentWallet.address,
          signer: currentWallet.signer,
          hederaAccountId: currentWallet.hederaAccountId ?? null,
        };

        const response = await contract.buyProduct(params);

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          transactionId: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to buy product';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsBuyingProduct(false);
      }
    },
    [ensureWalletReady]
  );

  const withdrawBalance = useCallback(
    async (userId?: string): Promise<WalletActionResult> => {
      setIsWithdrawing(true);
      try {
        const { contract, currentWallet } = ensureWalletReady();
        const params: WithdrawBalanceParams = {
          walletAddress: currentWallet.address,
          signer: currentWallet.signer,
          hederaAccountId: currentWallet.hederaAccountId ?? null,
        };

        const response = await contract.withdrawBalance(params);

        if (response.success) {
          await refreshFarmerState(currentWallet.address);
        }

        return {
          success: response.success,
          transactionHash: response.transactionHash,
          data: response.data,
          error: response.error,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to withdraw farmer balance';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsWithdrawing(false);
      }
    },
    [ensureWalletReady, refreshFarmerState]
  );

  return {
    wallet,
    isConnected,
    isConnecting,
    error,
    isCreatingFarmer,
    isAddingProduct,
    isUpdatingStock,
    isIncreasingPrice,
    isBuyingProduct,
    isWithdrawing,
    isFarmer,
    farmerInfo,
    farmerProducts,
    connectWallet,
    disconnectWallet,
    createFarmerAccount,
    addProduct,
    updateStock,
    increasePrice,
    buyProduct,
    withdrawBalance,
    checkFarmerStatus,
    getFarmerInfo,
    getFarmerProducts,
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

// React hook for wallet management
import { useState, useEffect, useCallback } from 'react';
import { walletManager, WalletAccount } from '../utils/walletService';

export function useWallet() {
  const [walletAccount, setWalletAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const account = await walletManager.connectWallet();
      setWalletAccount(account);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletManager.disconnectWallet();
      setWalletAccount(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to disconnect wallet";
      setError(errorMessage);
    }
  }, []);

  const signMessage = useCallback(async (message: string) => {
    if (!walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      return await walletManager.signMessage(message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign message";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [walletAccount]);

  const transferHBAR = useCallback(async (to: string, amount: string) => {
    if (!walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      return await walletManager.transferHBAR(to, amount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transfer HBAR";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [walletAccount]);

  const getBalance = useCallback(async () => {
    if (!walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      return await walletManager.getBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get balance";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [walletAccount]);

  const bridgeNFTToHedera = useCallback(async (ethereumTokenId: string, ethereumContract: string) => {
    if (!walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      return await walletManager.bridgeNFTToHedera(ethereumTokenId, ethereumContract);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to bridge NFT to Hedera";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [walletAccount]);

  const bridgeNFTToEthereum = useCallback(async (hederaTokenId: string, hederaContract: string) => {
    if (!walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      return await walletManager.bridgeNFTToEthereum(hederaTokenId, hederaContract);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to bridge NFT to Ethereum";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [walletAccount]);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = () => {
      const currentAccount = walletManager.getCurrentAccount();
      if (currentAccount) {
        setWalletAccount(currentAccount);
      }
    };

    checkConnection();

    // Listen for account changes
    walletManager.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWalletAccount(null);
      } else {
        checkConnection();
      }
    });

    // Listen for chain changes
    walletManager.onChainChanged((chainId) => {
      console.log("Chain changed to:", chainId);
      // Optionally reconnect or update state
    });

    // Cleanup listeners on unmount
    return () => {
      walletManager.removeAllListeners();
    };
  }, []);

  return {
    walletAccount,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    signMessage,
    transferHBAR,
    getBalance,
    bridgeNFTToHedera,
    bridgeNFTToEthereum,
    isConnected: !!walletAccount,
  };
}

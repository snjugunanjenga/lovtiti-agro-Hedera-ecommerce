// NFT Service for Lovtiti Agro Mart Marketplace
import { walletManager, WalletAccount } from "./walletService";
import { 
  BaseNFT, 
  NFTMetadata, 
  NFTAttributes, 
  ProductAttributes, 
  ServiceAttributes, 
  EquipmentAttributes,
  MintNFTRequest,
  MintNFTResponse,
  ListNFTRequest,
  BuyNFTRequest,
  NFTListing,
  NFTTransaction,
  EscrowTransaction,
  ServiceBooking,
  EquipmentLease
} from "../types/nft";

export interface NFTServiceConfig {
  marketplaceContract: string;
  supplyChainContract: string;
  serviceContract: string;
  equipmentContract: string;
  ipfsGateway: string;
  apiBaseUrl: string;
}

export class NFTService {
  private static instance: NFTService;
  private config: NFTServiceConfig;
  private walletAccount: WalletAccount | null = null;

  private constructor(config: NFTServiceConfig) {
    this.config = config;
  }

  public static getInstance(config?: NFTServiceConfig): NFTService {
    if (!NFTService.instance && config) {
      NFTService.instance = new NFTService(config);
    }
    return NFTService.instance;
  }

  public setWalletAccount(account: WalletAccount): void {
    this.walletAccount = account;
  }

  // NFT Minting Functions
  public async mintProductNFT(
    metadata: NFTMetadata,
    royalties: { percentage: number; recipient: string }
  ): Promise<MintNFTResponse> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      // Upload metadata to IPFS
      const ipfsHash = await this.uploadToIPFS(metadata);

      // Create mint request
      const mintRequest: MintNFTRequest = {
        category: "PRODUCT",
        metadata: {
          ...metadata,
          image: `ipfs://${ipfsHash}`,
        },
        royalties,
      };

      // Call API to mint NFT
      const response = await this.callAPI("/nft/mint", {
        method: "POST",
        body: JSON.stringify(mintRequest),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to mint NFT");
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to mint product NFT: ${error.message}`);
    }
  }

  public async mintServiceNFT(
    metadata: NFTMetadata,
    royalties: { percentage: number; recipient: string }
  ): Promise<MintNFTResponse> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      // Upload metadata to IPFS
      const ipfsHash = await this.uploadToIPFS(metadata);

      // Create mint request
      const mintRequest: MintNFTRequest = {
        category: "SERVICE",
        metadata: {
          ...metadata,
          image: `ipfs://${ipfsHash}`,
        },
        royalties,
      };

      // Call API to mint NFT
      const response = await this.callAPI("/nft/mint", {
        method: "POST",
        body: JSON.stringify(mintRequest),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to mint NFT");
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to mint service NFT: ${error.message}`);
    }
  }

  public async mintEquipmentNFT(
    metadata: NFTMetadata,
    royalties: { percentage: number; recipient: string }
  ): Promise<MintNFTResponse> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      // Upload metadata to IPFS
      const ipfsHash = await this.uploadToIPFS(metadata);

      // Create mint request
      const mintRequest: MintNFTRequest = {
        category: "EQUIPMENT",
        metadata: {
          ...metadata,
          image: `ipfs://${ipfsHash}`,
        },
        royalties,
      };

      // Call API to mint NFT
      const response = await this.callAPI("/nft/mint", {
        method: "POST",
        body: JSON.stringify(mintRequest),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to mint NFT");
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to mint equipment NFT: ${error.message}`);
    }
  }

  // Marketplace Functions
  public async listNFT(request: ListNFTRequest): Promise<NFTListing> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI("/marketplace/list", {
        method: "POST",
        body: JSON.stringify(request),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to list NFT");
      }

      return response.listing;
    } catch (error) {
      throw new Error(`Failed to list NFT: ${error.message}`);
    }
  }

  public async buyNFT(request: BuyNFTRequest): Promise<NFTTransaction> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI("/marketplace/buy", {
        method: "POST",
        body: JSON.stringify(request),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to buy NFT");
      }

      return response.transaction;
    } catch (error) {
      throw new Error(`Failed to buy NFT: ${error.message}`);
    }
  }

  public async cancelListing(listingId: string): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/marketplace/listings/${listingId}`, {
        method: "DELETE",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to cancel listing");
      }
    } catch (error) {
      throw new Error(`Failed to cancel listing: ${error.message}`);
    }
  }

  // NFT Query Functions
  public async getNFT(tokenId: string): Promise<BaseNFT> {
    try {
      const response = await this.callAPI(`/nft/${tokenId}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get NFT");
      }

      return response.nft;
    } catch (error) {
      throw new Error(`Failed to get NFT: ${error.message}`);
    }
  }

  public async getListings(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ listings: NFTListing[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await this.callAPI(`/marketplace/listings?${queryParams}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get listings");
      }

      return {
        listings: response.listings,
        pagination: response.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get listings: ${error.message}`);
    }
  }

  public async getUserNFTs(userAddress?: string): Promise<BaseNFT[]> {
    const address = userAddress || this.walletAccount?.hederaAccountId;
    if (!address) {
      throw new Error("User address required");
    }

    try {
      const response = await this.callAPI(`/nft/user/${address}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get user NFTs");
      }

      return response.nfts;
    } catch (error) {
      throw new Error(`Failed to get user NFTs: ${error.message}`);
    }
  }

  // Supply Chain Functions
  public async addSupplyChainStep(
    tokenId: string,
    action: string,
    location: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/supply-chain/${tokenId}/step`, {
        method: "POST",
        body: JSON.stringify({
          action,
          location,
          metadata: JSON.stringify(metadata || {}),
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to add supply chain step");
      }
    } catch (error) {
      throw new Error(`Failed to add supply chain step: ${error.message}`);
    }
  }

  public async getSupplyChainHistory(tokenId: string): Promise<any[]> {
    try {
      const response = await this.callAPI(`/supply-chain/${tokenId}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get supply chain history");
      }

      return response.supplyChain;
    } catch (error) {
      throw new Error(`Failed to get supply chain history: ${error.message}`);
    }
  }

  public async verifySupplyChainStep(
    tokenId: string,
    stepIndex: number,
    verified: boolean,
    notes?: string
  ): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/supply-chain/${tokenId}/verify`, {
        method: "POST",
        body: JSON.stringify({
          stepIndex,
          verified,
          notes,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to verify supply chain step");
      }
    } catch (error) {
      throw new Error(`Failed to verify supply chain step: ${error.message}`);
    }
  }

  // Service Booking Functions
  public async bookService(
    serviceTokenId: string,
    startTime: Date,
    endTime: Date,
    location?: string,
    requirements?: string
  ): Promise<ServiceBooking> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/services/${serviceTokenId}/book`, {
        method: "POST",
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location,
          requirements,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to book service");
      }

      return response.booking;
    } catch (error) {
      throw new Error(`Failed to book service: ${error.message}`);
    }
  }

  public async completeService(
    serviceTokenId: string,
    bookingId: string,
    completionNotes: string,
    evidence?: string[]
  ): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/services/${serviceTokenId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          completionNotes,
          evidence,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to complete service");
      }
    } catch (error) {
      throw new Error(`Failed to complete service: ${error.message}`);
    }
  }

  // Equipment Leasing Functions
  public async leaseEquipment(
    equipmentTokenId: string,
    startDate: Date,
    endDate: Date,
    deliveryAddress: string,
    pickupAddress: string,
    insurance: boolean = true,
    training: boolean = false
  ): Promise<EquipmentLease> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/equipment/${equipmentTokenId}/lease`, {
        method: "POST",
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deliveryAddress,
          pickupAddress,
          insurance,
          training,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to lease equipment");
      }

      return response.lease;
    } catch (error) {
      throw new Error(`Failed to lease equipment: ${error.message}`);
    }
  }

  // Escrow Functions
  public async getEscrowStatus(transactionId: string): Promise<EscrowTransaction> {
    try {
      const response = await this.callAPI(`/escrow/${transactionId}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get escrow status");
      }

      return response.escrow;
    } catch (error) {
      throw new Error(`Failed to get escrow status: ${error.message}`);
    }
  }

  public async updateDeliveryStatus(
    transactionId: string,
    status: string,
    trackingNumber?: string,
    carrier?: string
  ): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/escrow/${transactionId}/delivery`, {
        method: "POST",
        body: JSON.stringify({
          status,
          trackingNumber,
          carrier,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update delivery status");
      }
    } catch (error) {
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }

  public async confirmDelivery(transactionId: string): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/escrow/${transactionId}/confirm-delivery`, {
        method: "POST",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to confirm delivery");
      }
    } catch (error) {
      throw new Error(`Failed to confirm delivery: ${error.message}`);
    }
  }

  public async releaseEscrow(
    transactionId: string,
    rating?: number,
    feedback?: string
  ): Promise<void> {
    if (!this.walletAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await this.callAPI(`/escrow/${transactionId}/release`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          feedback,
        }),
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to release escrow");
      }
    } catch (error) {
      throw new Error(`Failed to release escrow: ${error.message}`);
    }
  }

  // Analytics Functions
  public async getMarketplaceAnalytics(): Promise<any> {
    try {
      const response = await this.callAPI("/analytics/market", {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get marketplace analytics");
      }

      return response.analytics;
    } catch (error) {
      throw new Error(`Failed to get marketplace analytics: ${error.message}`);
    }
  }

  public async getUserPortfolio(userAddress?: string): Promise<any> {
    const address = userAddress || this.walletAccount?.hederaAccountId;
    if (!address) {
      throw new Error("User address required");
    }

    try {
      const response = await this.callAPI(`/analytics/user/${address}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get user portfolio");
      }

      return response.portfolio;
    } catch (error) {
      throw new Error(`Failed to get user portfolio: ${error.message}`);
    }
  }

  // Utility Functions
  private async uploadToIPFS(data: any): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", JSON.stringify(data));

      const response = await fetch(`${this.config.ipfsGateway}/api/v0/add`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      return result.Hash;
    } catch (error) {
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  private async callAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.walletAccount && {
          Authorization: `Bearer ${await this.getAuthToken()}`,
          "X-Hedera-Account": this.walletAccount.hederaAccountId,
        }),
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  private async getAuthToken(): Promise<string> {
    // This would integrate with your authentication system
    // For now, we'll return a placeholder
    return "placeholder-auth-token";
  }

  // Helper functions for creating metadata
  public createProductMetadata(
    name: string,
    description: string,
    attributes: ProductAttributes,
    imageUrl?: string
  ): NFTMetadata {
    return {
      name,
      description,
      image: imageUrl || "ipfs://placeholder-image-hash",
      attributes,
    };
  }

  public createServiceMetadata(
    name: string,
    description: string,
    attributes: ServiceAttributes,
    imageUrl?: string
  ): NFTMetadata {
    return {
      name,
      description,
      image: imageUrl || "ipfs://placeholder-image-hash",
      attributes,
    };
  }

  public createEquipmentMetadata(
    name: string,
    description: string,
    attributes: EquipmentAttributes,
    imageUrl?: string
  ): NFTMetadata {
    return {
      name,
      description,
      image: imageUrl || "ipfs://placeholder-image-hash",
      attributes,
    };
  }
}

// Export singleton instance
export const createNFTService = (config: NFTServiceConfig): NFTService => {
  return NFTService.getInstance(config);
};

// Default configuration
export const defaultNFTServiceConfig: NFTServiceConfig = {
  marketplaceContract: "0.0.123456", // Hedera contract address
  supplyChainContract: "0.0.123457",
  serviceContract: "0.0.123458",
  equipmentContract: "0.0.123459",
  ipfsGateway: "https://ipfs.io",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/nft",
};

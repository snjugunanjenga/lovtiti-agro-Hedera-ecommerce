import { HashConnect } from 'hashconnect';
import { AccountId, LedgerId } from '@hashgraph/sdk';

// NOTE: WalletConnection interface for the useWallet hook should be updated to match this state
export interface HashConnectState {
  accountIds: string[];
  network: string;
  connected: boolean;
}

// Global window declaration for Ethereum (still needed if you mix wallets or want to suppress errors)
declare global {
  interface Window {
    ethereum?: any;
  }
}

class HashConnectService {
  private static instance: HashConnectService;
  private hashConnect: HashConnect | null = null; // Changed to nullable
  private appMetadata = {
    name: "Lovtiti Agro Mart",
    description: "Agricultural NFT Marketplace",
    icon: "favicon.ico",
    url: typeof window !== 'undefined' ? window.location.origin : '',
  };
  private state: HashConnectState | null = null;
  private network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();

  private constructor() {
    // Initialization MUST be deferred until the environment is confirmed (see init below)
    this.loadSavedConnection();
  }

  /**
   * Initializes HashConnect only on the client-side.
   * This prevents "Critical dependency" errors during Next.js server-side rendering (SSR).
   */
  public async init(): Promise<void> {
    if (this.hashConnect === null && typeof window !== 'undefined') {
      try {
        const ledgerId = LedgerId[this.network.toUpperCase() as keyof typeof LedgerId] || LedgerId.TESTNET;
        
        this.hashConnect = new HashConnect(
          false, 
          ledgerId, 
          false
        );
        
        // After initialization, set up the listeners
        this.setupEventListeners();
        
        // Initialize the connection
        const initData = await this.hashConnect.init(this.appMetadata, ledgerId.toString(), true);

        // If a pairing already exists from init, update state
        if (initData.savedPairings.length > 0) {
            const pairing = initData.savedPairings[0];
            if (pairing.accountIds.length > 0) {
                this.state = {
                    accountIds: pairing.accountIds,
                    network: this.network,
                    connected: true
                };
                this.saveConnectionData();
            }
        }
      } catch (error) {
        console.error("Error initializing HashConnect:", error);
        this.hashConnect = null;
      }
    }
  }

  private setupEventListeners() {
    if (!this.hashConnect) return;
    
    // Listen for pairing events
    this.hashConnect.pairingEvent.on((data) => {
      if (data.accountIds?.length) {
        this.state = {
          accountIds: data.accountIds,
          network: this.network,
          connected: true
        };
        this.saveConnectionData();
      }
    });

    // Handle connection status changes
    this.hashConnect.connectionStatusChangeEvent.on((data) => {
      // NOTE: HashConnect state change events often contain status/message rather than simple bool
      if (!data.connected) {
        this.state = null;
        localStorage.removeItem('hashconnect-data');
      }
    });
  }

  // Removed isConnected utility as the listener handles state directly

  private saveConnectionData() {
    if (this.state && typeof window !== 'undefined') {
      localStorage.setItem('hashconnect-data', JSON.stringify({
        accountIds: this.state.accountIds,
        network: this.network
      }));
    }
  }

  private loadSavedConnection() {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('hashconnect-data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.accountIds?.length) {
            this.state = {
              accountIds: parsed.accountIds,
              network: parsed.network,
              connected: true
            };
          }
        } catch {
          localStorage.removeItem('hashconnect-data');
        }
      }
    }
  }

  public static getInstance(): HashConnectService {
    if (!HashConnectService.instance) {
      HashConnectService.instance = new HashConnectService();
    }
    return HashConnectService.instance;
  }

  public async connect(): Promise<HashConnectState | null> {
    await this.init(); // Ensure HashConnect is initialized
    if (!this.hashConnect) return null;

    try {
      if (this.state?.connected) {
        return this.state;
      }

      return new Promise((resolve) => {
        this.hashConnect?.pairingEvent.once((data) => {
          if (data.accountIds?.length) {
            this.state = {
              accountIds: data.accountIds,
              network: this.network,
              connected: true
            };
            this.saveConnectionData();
            resolve(this.state);
          } else {
            resolve(null);
          }
        });

        // Show wallet popup
        if (typeof window !== 'undefined') {
          this.hashConnect?.showConnectFlow();
        }
      });

    } catch (error) {
      console.error("Error connecting to wallet:", error);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.hashConnect) return;
    
    try {
      await this.hashConnect.disconnect();
      this.state = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hashconnect-data');
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  }

  public async signTransaction(
    transaction: Uint8Array
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    if (!this.hashConnect) {
        return { success: false, error: "HashConnect not initialized" };
    }
    
    try {
      if (!this.state?.connected || !this.state.accountIds.length) {
        throw new Error("No active wallet connection");
      }
        
      // Ensure the transaction is converted to the required type if necessary
      // HashConnect's sendTransaction expects the transaction object itself or the bytes

      const transactionRequest = {
        byteArray: transaction,
        metadata: {
          accountToSign: this.state.accountIds[0],
          returnTransaction: false
        }
      };

      // Correct usage for hashConnect.sendTransaction based on the provided SDK types
      const response = await this.hashConnect.sendTransaction(
        this.state.accountIds[0], // Account ID string
        transactionRequest
      );

      return {
        success: true,
        response
      };

    } catch (error) {
      console.error("Error signing transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error signing transaction"
      };
    }
  }

  public getCurrentState(): HashConnectState | null {
    return this.state;
  }

  public getAccountId(): string | null {
    return this.state?.accountIds[0] || null;
  }

  public getHashConnect(): HashConnect | null {
    return this.hashConnect;
  }
}

export const hashConnectService = HashConnectService.getInstance();

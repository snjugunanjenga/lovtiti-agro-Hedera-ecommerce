import { HashConnect } from 'hashconnect';
import { HashConnectConnectionState, SessionData } from 'hashconnect/dist/types';
import { AccountId, LedgerId, Transaction } from '@hashgraph/sdk';

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
  private state: HashConnectState | null = null;
  private network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();
  private projectId =
    process.env.NEXT_PUBLIC_HASHCONNECT_PROJECT_ID ||
    process.env.HASHCONNECT_PROJECT_ID ||
    '';

  private constructor() {
    // Initialization MUST be deferred until the environment is confirmed (see init below)
    this.loadSavedConnection();
  }

  /**
   * Initializes HashConnect only on the client-side.
   * This prevents "Critical dependency" errors during Next.js server-side rendering (SSR).
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined' || this.hashConnect) {
      return;
    }

    if (!this.projectId) {
      console.warn(
        'HashConnect project ID missing. Set NEXT_PUBLIC_HASHCONNECT_PROJECT_ID to enable wallet connections.'
      );
      return;
    }

    try {
      const ledgerId = this.getLedgerId();
      const metadata = this.getAppMetadata();

      this.hashConnect = new HashConnect(
        ledgerId,
        this.projectId,
        metadata,
        process.env.NODE_ENV !== 'production'
      );

      this.setupEventListeners();

      await this.hashConnect.init();

      const connectedAccountIds = this.hashConnect.connectedAccountIds?.map((id) => id.toString()) ?? [];

      if (connectedAccountIds.length > 0) {
        this.state = {
          accountIds: connectedAccountIds,
          network: this.network,
          connected: true
        };
        this.saveConnectionData();
      } else if (this.state?.connected) {
        // Rehydrate existing saved connection if present
        this.state = {
          accountIds: this.state.accountIds,
          network: this.network,
          connected: true
        };
      }
    } catch (error) {
      console.error('Error initializing HashConnect:', error);
      this.hashConnect = null;
    }
  }

  private setupEventListeners() {
    if (!this.hashConnect) return;

    // Listen for pairing events
    this.hashConnect.pairingEvent.on((data: SessionData) => {
      this.handlePairingEvent(data);
    });

    // Handle connection status changes
    this.hashConnect.connectionStatusChangeEvent.on((status: HashConnectConnectionState) => {
      // Reset state when wallet disconnects
      if (
        status !== HashConnectConnectionState.Connected &&
        status !== HashConnectConnectionState.Paired
      ) {
        this.clearConnection();
      }
    });

    this.hashConnect.disconnectionEvent.on(() => {
      this.clearConnection();
    });
  }

  // Removed isConnected utility as the listener handles state directly

  private getAppMetadata() {
    const origin =
      (typeof window !== 'undefined' && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '';
    const iconUrl = origin ? `${origin.replace(/\/$/, '')}/favicon.ico` : 'favicon.ico';

    return {
      name: 'Lovtiti Agro Mart',
      description: 'Agricultural NFT Marketplace',
      icons: [iconUrl],
      url: origin
    };
  }

  private handlePairingEvent(data: SessionData) {
    if (!data.accountIds?.length) return;

    this.state = {
      accountIds: data.accountIds,
      network: data.network || this.network,
      connected: true
    };

    this.saveConnectionData();
  }

  private clearConnection() {
    this.state = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hashconnect-data');
    }
  }

  private getLedgerId(): LedgerId {
    switch (this.network) {
      case 'mainnet':
        return LedgerId.MAINNET;
      case 'previewnet':
        return LedgerId.PREVIEWNET;
      default:
        return LedgerId.TESTNET;
    }
  }

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
    const hashConnect = this.hashConnect;

    if (!hashConnect) return null;

    if (this.state?.connected) {
      return this.state;
    }

    try {
      return await new Promise<HashConnectState | null>(async (resolve) => {
        const pairingListener = (data: SessionData) => {
          this.handlePairingEvent(data);
          resolve(this.state);
        };

        hashConnect.pairingEvent.once(pairingListener);

        try {
          await hashConnect.openPairingModal();
        } catch (modalError) {
          console.error('Error presenting HashConnect pairing modal:', modalError);
          hashConnect.pairingEvent.off(pairingListener);
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.hashConnect) return;

    try {
      await this.hashConnect.disconnect();
      this.clearConnection();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  public async signTransaction(
    transactionBytes: Uint8Array
  ): Promise<{ success: boolean; response?: unknown; error?: string }> {
    if (!this.hashConnect) {
      return { success: false, error: 'HashConnect not initialized' };
    }

    try {
      if (!this.state?.connected || !this.state.accountIds.length) {
        throw new Error('No active wallet connection');
      }

      const [activeAccountId] = this.state.accountIds;
      const accountId = AccountId.fromString(activeAccountId);
      const transaction = Transaction.fromBytes(transactionBytes);

      const response = await this.hashConnect.sendTransaction(
        accountId as unknown as Parameters<HashConnect['sendTransaction']>[0],
        transaction as unknown as Parameters<HashConnect['sendTransaction']>[1]
      );

      return {
        success: true,
        response
      };

    } catch (error) {
      console.error('Error signing transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error signing transaction'
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


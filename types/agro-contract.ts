// Agro Contract ABI for Lovtiti Agro Mart
export const AGRO_CONTRACT_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "productId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "farmer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "productCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "farmer",
        "type": "address"
      }
    ],
    "name": "farmerJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      }
    ],
    "name": "stockUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      }
    ],
    "name": "priceIncreased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "productId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "farmer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "productBought",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "addProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      }
    ],
    "name": "increasePrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stock",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      }
    ],
    "name": "updateStock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createFarmer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "pid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "buyproduct",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "whoFarmer",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256[]",
            "name": "products",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "balance",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct agro.farmerstruct",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_farmer",
        "type": "address"
      }
    ],
    "name": "viewProducts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "stock",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "internalType": "struct agro.product[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "products",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stock",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "farmer",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "products",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// TypeScript interfaces for contract interactions
export interface Product {
  price: bigint;
  owner: string;
  stock: bigint;
  id: bigint;
}

export interface FarmerStruct {
  products: bigint[];
  balance: bigint;
  exists: boolean;
}

export interface ContractConfig {
  address: string;
  abi: typeof AGRO_CONTRACT_ABI;
  network: 'mainnet' | 'testnet' | 'local';
  rpcUrl?: string;
}

// Import ethers types
import { ethers } from 'ethers';

// Contract interaction types with Signer support
export interface BaseContractParams {
  walletAddress: string;
  signer?: ethers.Signer;  // Prefer signer for MetaMask/injected wallet flows
  privateKey?: string;     // Only for testing or server operations
  hederaAccountId?: string | null; // Optional Hedera account ID
}


export interface AddProductParams extends BaseContractParams {
  price: bigint;
  amount: bigint;
}

export interface BuyProductParams extends BaseContractParams {
  productId: bigint;
  amount: bigint;
  value?: bigint; // Optional ETH value to send; if omitted, service computes from contract
}

export interface UpdateStockParams extends BaseContractParams {
  productId: bigint;
  stock: bigint;
}

export interface IncreasePriceParams extends BaseContractParams {
  productId: bigint;
  price: bigint;
}

export interface WithdrawBalanceParams extends BaseContractParams {}

// Response types
export interface ContractResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
  gasUsed?: bigint;
}

export interface FarmerInfo extends FarmerStruct {
  address: string;
}

export interface ProductInfo extends Product {
  farmerAddress: string;
}

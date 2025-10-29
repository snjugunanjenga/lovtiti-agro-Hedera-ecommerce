import { ethers } from 'ethers';
import { AGRO_CONTRACT_ABI } from '@/types/agro-contract';

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.RPC_URL ||
  'https://testnet.hashio.io/api';

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT ||
  process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
  '';

const provider = new ethers.JsonRpcProvider(RPC_URL);

export const getAgroContract = () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Agro contract address is not configured.');
  }

  return new ethers.Contract(CONTRACT_ADDRESS, AGRO_CONTRACT_ABI, provider);
};

export const getAgroProvider = () => provider;

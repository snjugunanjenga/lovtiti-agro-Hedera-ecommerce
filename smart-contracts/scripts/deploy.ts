import { Client, PrivateKey, AccountId, ContractCreateTransaction, ContractFunctionParameters, Hbar } from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { deploySupplyChain } from "./deploy-supply-chain";
import { deployLogistics } from "./deploy-logistics";
import { deployVeterinary } from "./deploy-veterinary";

async function deployMarketplace() {
  // Load environment variables
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set");
  }

  // Create client
  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));

  // Read contract source
  const contractPath = path.join(__dirname, "../contracts/Marketplace.sol");
  const contractSource = fs.readFileSync(contractPath, "utf8");

  // Deploy contract
  const contractCreateTransaction = new ContractCreateTransaction()
    .setBytecode(new TextEncoder().encode(contractSource))
    .setGas(2000000)
    .setConstructorParameters(new ContractFunctionParameters())
    .setInitialBalance(new Hbar(10));

  const contractResponse = await contractCreateTransaction.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);
  const contractId = contractReceipt.contractId;

  console.log(`Marketplace contract deployed with ID: ${contractId}`);
  console.log(`Contract address: ${contractId?.toSolidityAddress()}`);

  return contractId;
}

async function main() {
  console.log("🚀 Starting deployment of all smart contracts...");
  console.log("Network:", process.env.HEDERA_NETWORK || "testnet");
  
  try {
    // Deploy all contracts
    console.log("\n📦 Deploying Marketplace contract...");
    const marketplaceContract = await deployMarketplace();
    
    console.log("\n📦 Deploying SupplyChain contract...");
    const supplyChainContract = await deploySupplyChain();
    
    console.log("\n📦 Deploying Logistics contract...");
    const logisticsContract = await deployLogistics();
    
    console.log("\n📦 Deploying Veterinary contract...");
    const veterinaryContract = await deployVeterinary();

    // Save contract addresses to environment file
    const contracts = {
      marketplace: marketplaceContract?.toString(),
      supplyChain: supplyChainContract?.toString(),
      logistics: logisticsContract?.toString(),
      veterinary: veterinaryContract?.toString(),
      network: process.env.HEDERA_NETWORK || "testnet",
      deployedAt: new Date().toISOString()
    };

    const envPath = path.join(__dirname, "../../.env.contracts");
    const envContent = Object.entries(contracts)
      .map(([key, value]) => `${key.toUpperCase()}_CONTRACT_ID=${value}`)
      .join('\n');

    fs.writeFileSync(envPath, envContent);

    console.log("\n✅ All contracts deployed successfully!");
    console.log("\n📋 Contract Summary:");
    console.log(`Marketplace: ${marketplaceContract}`);
    console.log(`SupplyChain: ${supplyChainContract}`);
    console.log(`Logistics: ${logisticsContract}`);
    console.log(`Veterinary: ${veterinaryContract}`);
    console.log(`\nContract addresses saved to: ${envPath}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Deployment script failed:", err);
  process.exit(1);
});

import { Client, PrivateKey, AccountId, ContractCreateTransaction, ContractFunctionParameters, Hbar } from "@hashgraph/sdk";
import fs from "fs";
import path from "path";

async function deploySupplyChain() {
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
  const contractPath = path.join(__dirname, "../contracts/SupplyChain.sol");
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

  console.log(`SupplyChain contract deployed with ID: ${contractId}`);
  console.log(`Contract address: ${contractId?.toSolidityAddress()}`);

  return contractId;
}

// Run deployment if called directly
if (require.main === module) {
  deploySupplyChain()
    .then((contractId) => {
      console.log("Deployment successful!");
      console.log("Contract ID:", contractId?.toString());
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

export { deploySupplyChain };

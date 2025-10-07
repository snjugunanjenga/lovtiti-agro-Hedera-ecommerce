// Deploy NFT Marketplace Contract to Hedera
import { Client, PrivateKey, AccountId, ContractCreateFlow, Hbar } from "@hashgraph/sdk";
import * as fs from "fs";
import * as path from "path";

async function deployNFTMarketplace() {
  console.log("🚀 Starting NFT Marketplace deployment...");

  // Load environment variables
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!operatorId || !operatorKey) {
    throw new Error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY");
  }

  // Create Hedera client
  const client = network === "testnet" 
    ? Client.forTestnet() 
    : Client.forMainnet();

  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  try {
    // Read contract bytecode
    const contractPath = path.join(__dirname, "../artifacts/LovittiNFTMarketplace.json");
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const bytecode = contractArtifact.bytecode;

    // Deploy contract
    const contractCreateFlow = new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(1000000)
      .setConstructorParameters(new ContractFunctionParameters().addAddress(operatorId));

    console.log("📝 Deploying NFT Marketplace contract...");
    const contractCreateResponse = await contractCreateFlow.execute(client);
    const contractCreateReceipt = await contractCreateResponse.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    console.log(`✅ NFT Marketplace contract deployed successfully!`);
    console.log(`📄 Contract ID: ${contractId}`);
    console.log(`⛽ Gas used: ${contractCreateReceipt.gasUsed}`);

    // Save contract address
    const contractsEnvPath = path.join(__dirname, "../../.env.contracts");
    const contractAddress = `NFT_MARKETPLACE_CONTRACT_ID=${contractId}`;
    
    let envContent = "";
    if (fs.existsSync(contractsEnvPath)) {
      envContent = fs.readFileSync(contractsEnvPath, "utf8");
    }
    
    if (!envContent.includes("NFT_MARKETPLACE_CONTRACT_ID")) {
      envContent += `\n${contractAddress}`;
    } else {
      envContent = envContent.replace(
        /NFT_MARKETPLACE_CONTRACT_ID=.*/,
        contractAddress
      );
    }
    
    fs.writeFileSync(contractsEnvPath, envContent);
    console.log(`💾 Contract address saved to .env.contracts`);

    return {
      contractId: contractId.toString(),
      gasUsed: contractCreateReceipt.gasUsed,
      network,
    };

  } catch (error) {
    console.error("❌ Failed to deploy NFT Marketplace contract:", error);
    throw error;
  } finally {
    client.close();
  }
}

// Execute deployment if run directly
if (require.main === module) {
  deployNFTMarketplace()
    .then((result) => {
      console.log("🎉 Deployment completed successfully!");
      console.log("Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}

export { deployNFTMarketplace };

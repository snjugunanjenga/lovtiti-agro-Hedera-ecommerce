import { Client, PrivateKey, AccountId, ContractCreateFlow, FileCreateTransaction } from "@hashgraph/sdk";

async function main() {
	const accountId = process.env.HEDERA_ACCOUNT_ID as string;
	const privateKey = process.env.HEDERA_PRIVATE_KEY as string;
	if (!accountId || !privateKey) throw new Error("Missing Hedera creds");
	const client = Client.forTestnet().setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
	console.log("Deploy placeholder - integrate bytecode upload/build later");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

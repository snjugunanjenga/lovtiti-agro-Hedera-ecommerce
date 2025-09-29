import { NextResponse } from "next/server";
import { Client, PrivateKey, AccountId, TransferTransaction, Hbar } from "@hashgraph/sdk";

export async function POST(req: Request) {
	try {
		const { to, amountTinybar } = await req.json();
		if (!to || !amountTinybar) return NextResponse.json({ error: "Missing params" }, { status: 400 });
		const accountId = process.env.HEDERA_ACCOUNT_ID as string;
		const privateKey = process.env.HEDERA_PRIVATE_KEY as string;
		if (!accountId || !privateKey) return NextResponse.json({ error: "Missing Hedera env" }, { status: 500 });
		const client = Client.forTestnet().setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
		const tx = await new TransferTransaction()
			.addHbarTransfer(accountId, Hbar.fromTinybars(-BigInt(amountTinybar)))
			.addHbarTransfer(to, Hbar.fromTinybars(BigInt(amountTinybar)))
			.execute(client);
		await tx.getReceipt(client);
		return NextResponse.json({ ok: true, txId: tx.transactionId.toString() });
	} catch (err) {
		console.error("Hedera transfer error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

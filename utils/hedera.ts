import { Client, PrivateKey, AccountId, TransferTransaction, Hbar } from "@hashgraph/sdk";

export type HederaNetwork = "testnet" | "mainnet";
export type HederaConnection = {
	client: Client;
	accountId: string;
};

export type HederaTransfer = {
	to: string;
	amountTinybar: string;
};

const STORAGE_KEY = "hedera_encrypted_key_v1";

export async function connectHedera(network: HederaNetwork = "testnet", accountId: string, privateKey: string): Promise<HederaConnection> {
	const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
	client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
	return { client, accountId };
}

export async function signAndTransfer(
	conn: HederaConnection,
	transfers: HederaTransfer[]
): Promise<{ txId: string }> {
	const tx = new TransferTransaction();
	for (const t of transfers) {
		tx.addHbarTransfer(conn.accountId, Hbar.fromTinybars(-BigInt(t.amountTinybar)));
		tx.addHbarTransfer(t.to, Hbar.fromTinybars(BigInt(t.amountTinybar)));
	}
	const response = await tx.execute(conn.client);
	const receipt = await response.getReceipt(conn.client);
	return { txId: response.transactionId.toString() };
}

// Secure key cache
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const pwKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
	return crypto.subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
		pwKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

export async function cachePrivateKeyEncrypted(privateKey: string, password: string): Promise<void> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await deriveKey(password, salt);
	const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(privateKey));
	const payload = {
		iv: Array.from(iv),
		salt: Array.from(salt),
		ciphertext: Array.from(new Uint8Array(ciphertext)),
	};
	if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadPrivateKeyDecrypted(password: string): Promise<string | null> {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { iv: number[]; salt: number[]; ciphertext: number[] };
		const key = await deriveKey(password, new Uint8Array(parsed.salt));
		const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(parsed.iv) }, key, new Uint8Array(parsed.ciphertext));
		return new TextDecoder().decode(plaintext);
	} catch {
		return null;
	}
}

export function isOfflineWalletPresent(): boolean {
	if (typeof window === "undefined") return false;
	return !!window.localStorage.getItem(STORAGE_KEY);
}

export async function loginOfflineWithPrivateKey(privateKey: string, password: string): Promise<boolean> {
	try {
		await cachePrivateKeyEncrypted(privateKey, password);
		return true;
	} catch {
		return false;
	}
}

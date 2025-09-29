'use client';
import { SignIn } from "@clerk/nextjs";
import { isOfflineWalletPresent, loginOfflineWithPrivateKey } from "@/utils/hedera";
import { useState } from "react";

export default function LoginPage() {
	const [privKey, setPrivKey] = useState("");
	const [password, setPassword] = useState("");
	const [ok, setOk] = useState(false);

	return (
		<main className="p-8 flex flex-col items-center gap-6">
			<SignIn routing="hash" />
			<section className="w-full max-w-md border rounded p-4">
				<h2 className="font-semibold mb-2">Offline Hedera Login</h2>
				{isOfflineWalletPresent() ? (
					<p className="text-green-700">Encrypted Hedera key cached. You can use the app offline.</p>
				) : (
					<form
						onSubmit={async (e) => {
							e.preventDefault();
							const result = await loginOfflineWithPrivateKey(privKey, password);
							setOk(result);
						}}
						className="grid gap-2"
					>
						<label className="grid gap-1">
							<span className="text-sm">Hedera Private Key</span>
							<input className="border rounded px-2 py-1" value={privKey} onChange={(e) => setPrivKey(e.target.value)} required />
						</label>
						<label className="grid gap-1">
							<span className="text-sm">Encrypt with Password</span>
							<input type="password" className="border rounded px-2 py-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
						</label>
						<button className="px-3 py-2 bg-black text-white rounded">Save Encrypted</button>
						{ok && <p className="text-green-700">Saved.</p>}
					</form>
				)}
			</section>
		</main>
	);
}

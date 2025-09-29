'use client';
import { useState } from "react";
import { kycSchema } from "@/utils/validators";

export default function BuyerOnboardingPage() {
	const [form, setForm] = useState({ fullName: "", country: "", address: "", idNumber: "", phone: "", hederaWallet: "" });
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		setError(null);
		const parsed = kycSchema.safeParse({ ...form, type: "BUYER" as const });
		if (!parsed.success) {
			setError("Please correct the highlighted fields.");
			return;
		}
		const res = await fetch("/api/kyc/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
		if (!res.ok) {
			setError("Failed to submit KYC.");
			return;
		}
		const json = await res.json();
		setStatus(json.profile?.kycStatus ?? "PENDING");
	}

	return (
		<main className="p-8 max-w-xl mx-auto">
			<h1 className="text-2xl font-semibold">Buyer Onboarding</h1>
			<div className="grid gap-3 mt-4">
				{["fullName","country","address","idNumber","phone","hederaWallet"].map((key) => (
					<label key={key} className="grid gap-1 capitalize">
						<span className="text-sm">{key}</span>
						<input className="border rounded px-2 py-1" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
					</label>
				))}
				<button onClick={submit} className="px-4 py-2 bg-black text-white rounded">Submit KYC</button>
				{status && <p className="text-green-700">KYC status: {status}</p>}
				{error && <p className="text-red-700">{error}</p>}
			</div>
		</main>
	);
}

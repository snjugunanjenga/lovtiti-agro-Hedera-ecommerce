import Link from "next/link";

export default function HomePage() {
	return (
		<main className="p-8 max-w-3xl mx-auto">
			<h1 className="text-3xl font-bold">Lovitti Agro Mart</h1>
			<p className="text-gray-600 mt-2">Connecting farmers and buyers with secure escrow payments via Hedera.</p>
			<nav className="mt-6 grid gap-2">
				<Link className="text-blue-600 hover:underline" href="/auth/login">Login</Link>
				<Link className="text-blue-600 hover:underline" href="/onboarding/buyer">Buyer Onboarding</Link>
				<Link className="text-blue-600 hover:underline" href="/onboarding/farmer">Farmer Onboarding</Link>
				<Link className="text-blue-600 hover:underline" href="/listings/browse">Browse Listings</Link>
			</nav>
		</main>
	);
}

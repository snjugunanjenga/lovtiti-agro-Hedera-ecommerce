'use client';
import { SignOutButton, SignedIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LogoutPage() {
	return (
		<main className="p-8 flex flex-col items-center gap-4">
			<h1 className="text-2xl font-semibold">Logout</h1>
			<SignedIn>
				<SignOutButton signOutOptions={{ redirectUrl: "/" }}>
					<button className="px-4 py-2 bg-black text-white rounded">Sign out</button>
				</SignOutButton>
			</SignedIn>
			<Link className="text-blue-600 hover:underline" href="/">Go home</Link>
		</main>
	);
}

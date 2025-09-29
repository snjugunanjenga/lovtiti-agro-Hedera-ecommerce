import "../styles.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import React from "react";

export const metadata = {
	title: "Lovitti Agro Mart",
	description: "Marketplace connecting farmers and buyers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className="min-h-screen bg-white text-gray-900">
					<header className="p-4 border-b flex items-center justify-between">
						<div className="font-semibold">Lovitti Agro Mart</div>
						<nav className="flex items-center gap-3">
							<SignedOut>
								<SignInButton />
								<SignUpButton />
							</SignedOut>
							<SignedIn>
								<UserButton />
							</SignedIn>
						</nav>
					</header>
					{children}
				</body>
			</html>
		</ClerkProvider>
	);
}

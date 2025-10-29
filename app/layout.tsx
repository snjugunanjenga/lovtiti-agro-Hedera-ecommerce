import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { hasValidClerkKeys } from "@/lib/clerk-config";
import UserSync from "@/components/UserSync";
import { SafeClerkProvider } from "@/components/SafeClerkProvider";
import "@/lib/suppress-warnings";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Lovtiti Agro Mart - Blockchain-Powered Agricultural Marketplace",
	description: "Connecting African farmers, buyers, distributors, transporters, and agro experts through blockchain technology",
	keywords: "agriculture, marketplace, blockchain, farmers, buyers, Hedera, Africa",
};

// Check keys at module level (server-side)
const validKeys = hasValidClerkKeys();

export default function RootLayout({ children }: { children: React.ReactNode }) {
	// Always wrap in SafeClerkProvider so Navbar can use useUser() hook
	// SafeClerkProvider will handle invalid keys gracefully
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
				<SafeClerkProvider>
					{validKeys && <UserSync />}
					<Navbar />
					<main className="min-h-screen">
						{children}
					</main>
					<Toaster />
				</SafeClerkProvider>
			</body>
		</html>
	);
}

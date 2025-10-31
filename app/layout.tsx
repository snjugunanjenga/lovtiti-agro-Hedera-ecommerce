import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/lib/suppress-warnings";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lovtiti Agro Mart - Blockchain-Powered Agricultural Marketplace",
  description:
    "Connecting African farmers, buyers, distributors, transporters, and agro experts through blockchain technology",
  keywords: "agriculture, marketplace, blockchain, farmers, buyers, Hedera, Africa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

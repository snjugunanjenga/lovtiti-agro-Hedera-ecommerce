'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { BlockchainStatus } from "@/components/profile/BlockchainStatus";

export function CustomClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          // Add custom styles if needed
          card: "rounded-xl shadow-lg",
          navbar: "hidden", // Hide default navigation
        }
      }}
      components={{
        // Add our custom component to profile page
        UserProfile: {
          additionalSections: () => (
            <>
              <BlockchainStatus />
            </>
          )
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
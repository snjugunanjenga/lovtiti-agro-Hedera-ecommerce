'use client';

import { UserProfile } from "@clerk/nextjs";
import { BlockchainStatus } from "@/components/profile/BlockchainStatus";

export default function AccountPage() {
  return (
    <UserProfile
      path="/account"
      routing="path"
      appearance={{
        elements: {
          rootBox: "mx-auto max-w-3xl px-4 py-8",
          card: "shadow-none",
          navbar: "hidden",
          // Add custom section after main content
          profileSectionContent: {
            after: BlockchainStatus
          }
        }
      }}
    />
  );
}
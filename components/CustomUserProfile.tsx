import { UserProfile } from "@clerk/nextjs";
import { BlockchainStatus } from "@/components/profile/BlockchainStatus";

export function CustomUserProfile() {
  return (
    <UserProfile appearance={{
      elements: {
        rootBox: "max-w-3xl mx-auto py-8",
        card: "rounded-lg shadow-md",
        pageScrollBox: "gap-0",
        // Add blockchain status after the main profile sections
        profileSectionPrimaryContent: "flex flex-col gap-6 after:content-[' '] after:block after:order-last",
        profileSection: {
          after: BlockchainStatus
        }
      }
    }} />
  );
}
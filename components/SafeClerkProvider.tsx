'use client';

import { clerkConfig, hasValidClerkKeys } from "@/lib/clerk-config";
import { BlockchainStatus } from "@/components/profile/BlockchainStatus";
import React, { ReactNode } from 'react';

interface SafeClerkProviderProps {
  children: ReactNode;
}

/**
 * SafeClerkProvider - Conditionally provides ClerkProvider
 * - When keys are valid: Uses real ClerkProvider with explicit valid publishableKey
 * - When keys are invalid: Does NOT render ClerkProvider (prevents initialization error)
 * 
 * This prevents the "invalid publishableKey" error when keys are invalid.
 * Note: Components using useUser() will need to handle missing ClerkProvider gracefully.
 */
export function SafeClerkProvider({ children }: SafeClerkProviderProps) {
  const validKeys = hasValidClerkKeys();
  const { publishableKey, ...baseConfig } = clerkConfig;

  // Only render ClerkProvider when we have valid keys
  // This prevents ClerkProvider from initializing with invalid keys (which causes errors)
  if (!validKeys || !publishableKey) {
    // Keys are invalid - don't render ClerkProvider to prevent initialization error
    // This fixes the "invalid publishableKey" error
    // NOTE: This means components using Clerk hooks (like useUser) will error
    // but the app won't crash on ClerkProvider initialization
    return <>{children}</>;
  }

  // Keys are valid - dynamically import ClerkProvider to avoid loading it when keys are invalid
  // This prevents ClerkProvider from reading invalid env vars during module initialization
  const { ClerkProvider } = require('@clerk/nextjs');
  
  // Render ClerkProvider with explicit publishableKey
  // Passing publishableKey explicitly prevents ClerkProvider from reading invalid env vars
  return (
    <ClerkProvider 
      {...baseConfig}
      publishableKey={publishableKey}
      appearance={{
        ...clerkConfig.appearance,
        elements: {
          ...clerkConfig.appearance?.elements,
          userProfile: {
            layout: "profile_only",
            afterSections: [
              {
                label: "Blockchain",
                url: "/blockchain",
                children: BlockchainStatus,
              },
            ],
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}


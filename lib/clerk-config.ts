// Clerk configuration for Lovtiti Agro Mart
import { BlockchainStatus } from '@/components/profile/BlockchainStatus';

// Helper function to check if Clerk keys are valid
export const hasValidClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  // Must have both keys
  if (!publishableKey || !secretKey) return false;
  
  // Must start with correct prefixes
  if (!publishableKey.startsWith('pk_')) return false;
  if (!secretKey.startsWith('sk_')) return false;
  
  // Must not be placeholder values
  if (publishableKey === 'pk_test_placeholder_key_for_development_only') return false;
  if (secretKey === 'sk_test_placeholder_secret_key_for_development_only') return false;
  
  // Real Clerk keys are much longer than placeholders (typically 100+ characters)
  // Placeholder keys are usually around 40-50 characters
  if (publishableKey.length < 50) return false;
  if (secretKey.length < 50) return false;
  
  return true;
};

// Only include publishableKey if it's valid to prevent Clerk validation errors
const getPublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return undefined;
  if (key === 'pk_test_placeholder_key_for_development_only') return undefined;
  if (!key.startsWith('pk_')) return undefined;
  // Must be a reasonable length (placeholder keys are short)
  if (key.length < 50) return undefined;
  return key;
};

export const clerkConfig: {
  appearance: any;
  publishableKey?: string;
  localization: { locale: string };
  __clerk_ssr_interstitial_html?: string;
} = {
  appearance: {
    baseTheme: undefined,
    variables: {
      colorPrimary: '#16a34a', // green-600
      colorBackground: '#f9fafb', // gray-50
      colorText: '#111827', // gray-900
      colorTextSecondary: '#6b7280', // gray-500
      borderRadius: '0.5rem', // rounded-lg
    },
    elements: {
      formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
      card: 'shadow-lg border border-gray-200',
      headerTitle: 'text-green-600 font-bold',
      headerSubtitle: 'text-gray-600',
      socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
      socialButtonsBlockButtonText: 'text-gray-700',
      formFieldInput: 'border border-gray-300 focus:border-green-500 focus:ring-green-500',
      footerActionLink: 'text-green-600 hover:text-green-700',
      // User Profile page elements
      userProfilePage: {
        root: "max-w-2xl mx-auto px-4 py-8",
      },
      userProfile: {
        additionalSections: [
          {
            label: "Blockchain Status",
            url: "/account/blockchain",
            component: BlockchainStatus,
          },
        ],
      },
    },
  },
  localization: {
    locale: 'en',
  },
};

// Only add publishableKey if it's valid
const publishableKey = getPublishableKey();
if (publishableKey) {
  clerkConfig.publishableKey = publishableKey;
}

// Add SSR interstitial HTML
clerkConfig.__clerk_ssr_interstitial_html = `
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f9fafb;">
    <div style="text-align: center; padding: 2rem;">
      <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #16a34a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="color: #6b7280; font-size: 0.875rem;">Loading Lovtiti Agro Mart...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </div>
`;

// Suppress Clerk development warnings
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = String(args[0] || '');
    
    // Suppress Clerk development warnings
    if (
      message.includes('Clerk has been loaded with development keys') ||
      message.includes('Development instances have strict usage limits') ||
      message.includes('should not be used when deploying your application to production')
    ) {
      // Optionally log a cleaner message
      console.info('🔧 Clerk: Using development keys (this is normal for local development)');
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = String(args[0] || '');
    
    // Suppress hydration warnings
    if (
      message.includes('Warning: Extra attributes from the server') ||
      message.includes('cz-shortcut-listen')
    ) {
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
}








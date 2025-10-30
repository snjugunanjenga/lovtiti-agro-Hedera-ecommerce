'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { updateUserRole, UserRole } from '@/utils/roleManager';
import { getRoleDashboardPath } from '@/utils/dashboardRoutes';

type Step = 'syncing' | 'wallet' | 'creating' | 'complete' | 'error';

export default function SignupSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState<Step>('syncing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);

  // Get role from URL and normalize to uppercase
  const roleParam = searchParams.get('role') || 'buyer';
  const role = roleParam.toUpperCase() as UserRole;
  
  // Use your wallet hook
  const { wallet, isConnected, isConnecting, connectWallet, createFarmerAccount, error: walletError } = useWallet();

  // Handle authentication checking with retries
  useEffect(() => {
    // Wait for Clerk to load
    if (!isUserLoaded) {
      setDebugMessage('Verifying your authentication...');
      return;
    }

    // If already processing onboarding, don't restart
    if (hasStartedOnboarding) return;

    // If no user and signed out, try waiting a bit (Clerk might still be loading)
    if (!isSignedIn && authCheckAttempts < 3) {
      console.log(`Auth check attempt ${authCheckAttempts + 1}/3 - waiting for sign-in...`);
      const timer = setTimeout(() => {
        setAuthCheckAttempts(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // If still no user after attempts, redirect to login
    if (!user || !isSignedIn) {
      console.log('User not authenticated after signup - redirecting to login');
      setDebugMessage('Authentication required. Redirecting to login...');
      setStep('error');
      setErrorMessage('Please sign in to complete your registration.');

      setTimeout(() => {
        router.push(`/auth/login?redirect=/auth/signup/success?role=${roleParam}`);
      }, 2000);
      return;
    }

    const handleOnboarding = async () => {
      setStep('syncing');
      setErrorMessage(null);
      setDebugMessage('Syncing your Lovtiti profile...');

      try {
        await updateUserRole(user, role);
        setDebugMessage('Saving your selected role to the Lovtiti database...');

        const token = await getToken();
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });
        setDebugMessage('Database sync complete.');
      } catch (err) {
        console.error('Error syncing user:', err);
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(`Failed to update user role: ${message}`);
        setDebugMessage('Onboarding stopped before blockchain registration.');
        setStep('error');
        return;
      }

      if (role === 'FARMER') {
        // Check if wallet is available
        const hasWallet = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

        if (!hasWallet) {
          // Instead of blocking, allow them to complete signup
          // and connect wallet later from their dashboard
          console.log('No wallet detected - user can connect later from dashboard');
          setDebugMessage('Wallet setup can be completed later from your dashboard. Proceeding...');
          setStep('complete');
          return;
        }

        setStep('wallet');
        setDebugMessage('Optional: Connect your wallet now for blockchain features. You can skip this step.');
        try {
          if (!isConnected) {
            const connection = await connectWallet();
            if (!connection?.address) {
              // User cancelled - that's OK, let them proceed
              console.log('Wallet connection skipped by user');
              setDebugMessage('Wallet connection skipped. You can connect later from your dashboard.');
              setStep('complete');
              return;
            }
          }

          // Wallet connected, try to create farmer account
          setStep('creating');
          setDebugMessage('Creating your farmer profile on blockchain...');
          const result = await createFarmerAccount();

          if (result.success) {
            setDebugMessage('Farmer account created successfully!');
            setStep('complete');
          } else {
            // Creation failed, but don't block - they can try again later
            console.log('Farmer account creation failed:', result.error);
            setDebugMessage('Blockchain registration will be completed from your dashboard.');
            setStep('complete');
          }
        } catch (err) {
          // Error occurred, but don't block signup
          console.error('Wallet/blockchain error:', err);
          setDebugMessage('Continuing to dashboard. Blockchain features can be set up later.');
          setStep('complete');
        }
      } else {
        setDebugMessage('Setup complete! Redirecting you to your dashboard...');
        setStep('complete');
      }
    };

    setHasStartedOnboarding(true);
    handleOnboarding();
  }, [isUserLoaded, isSignedIn, user, role, getToken, router, authCheckAttempts, hasStartedOnboarding, roleParam, connectWallet, isConnected, createFarmerAccount]);

  // Removed auto farmer creation - now handled in main onboarding flow

  // Effect to handle wallet connection errors
  useEffect(() => {
    if (walletError) {
      setErrorMessage(walletError);
      setStep('error');
      setDebugMessage(walletError);
    }
  }, [walletError]);

  useEffect(() => {
    if (step === 'complete') {
      setDebugMessage('All set! Redirecting you to your dashboard...');
    }
  }, [step]);


  const getStepContent = () => {
    switch (step) {
      case 'syncing':
        return {
          title: "Finishing Setup",
          description: "We're preparing your experience. Hang tight!",
          status: "Assigning your role...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        };
      case 'wallet':
        return {
          title: "Connect Your Wallet (Optional)",
          description: "Connect now or skip and set up blockchain features later from your dashboard.",
          status: "Optional step...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-green-600" />,
          customContent: (
            <div className="space-y-4">
              <Button onClick={connectWallet} disabled={isConnecting} className="w-full bg-green-600 hover:bg-green-700">
                {isConnecting ? 'Connecting...' : 'Connect Wallet (MetaMask)'}
              </Button>
              <Button
                onClick={() => {
                  setDebugMessage('Skipping wallet connection. You can connect later from your dashboard.');
                  setStep('complete');
                }}
                variant="outline"
                className="w-full"
              >
                Skip for Now
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Blockchain features require MetaMask or another Ethereum wallet.
                You can install and connect it anytime from your dashboard.
              </p>
            </div>
          )
        };
      case 'creating':
        return {
          title: "Creating Farmer Account",
          description: "We're setting up your Farmer profile on the blockchain.",
          status: "Submitting transaction...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        };
      case 'complete':
        return {
          title: "Setup Complete!",
          description: "You're all set. Redirecting you to your dashboard...",
          status: "Success!",
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          customContent: (
            <Button onClick={() => router.push(getRoleDashboardPath(role))} className="bg-green-600 hover:bg-green-700">
              Go to Dashboard
            </Button>
          )
        };
      case 'error':
        const isWalletError = errorMessage?.toLowerCase().includes('wallet') ||
                              errorMessage?.toLowerCase().includes('metamask');
        return {
          title: "Setup Issue",
          description: "We encountered an issue, but you can still continue.",
          status: "Needs Attention",
          icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
          customContent: (
            <div className="text-center space-y-4">
              <p className="text-sm text-orange-700 mb-4">{errorMessage}</p>
              {isWalletError ? (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-900">
                  <p className="font-semibold mb-2">MetaMask Required for Blockchain Features</p>
                  <p className="text-xs mb-3 text-blue-700">
                    You can still access your dashboard. Install MetaMask later to unlock blockchain features.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Install MetaMask
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => router.push(getRoleDashboardPath(role))}
                      className="w-full"
                    >
                      Continue to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(getRoleDashboardPath(role))}
                  >
                    Continue to Dashboard Anyway
                  </Button>
                </div>
              )}
            </div>
          )
        };
    }
  };

  const { title, description, status, icon, customContent } = getStepContent();
  
  // Automatically redirect on completion
  useEffect(() => {
    if (step === 'complete') {
      setTimeout(() => {
        router.push(getRoleDashboardPath(role));
      }, 3000);
    }
  }, [step, router, role]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2 rounded-lg border bg-gray-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Selected role</span>
              <span className="font-semibold text-green-700">{role.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold text-gray-900">{status}</span>
            </div>
          </div>
          
          {debugMessage && (
            <div
              className={`mt-4 rounded-lg border p-4 text-sm ${
                step === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : step === 'complete'
                  ? 'border-green-300 bg-green-100 text-green-800 font-medium'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
              {debugMessage}
            </div>
          )}
          
          {customContent && (
            <div className="mt-6 flex justify-center">
              {customContent}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-500">
            Need help? Contact support@lovtiti.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

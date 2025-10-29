'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet'; // Ensure this path is correct
import { updateUserRole, UserRole } from '@/utils/roleManager'; // Ensure this path is correct

type Step = 'syncing' | 'wallet' | 'creating' | 'complete' | 'error';

export default function SignupSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [step, setStep] = useState<Step>('syncing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);
  
  const role = (searchParams.get('role') as UserRole) || 'buyer';
  
  // Use your wallet hook
  const { wallet, isConnected, isConnecting, connectWallet, createFarmerAccount, error: walletError } = useWallet();

  useEffect(() => {
    if (!isUserLoaded || hasStartedOnboarding) return;

    if (!user) {
      router.push('/auth/signup');
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

      if (role === 'farmer') {
        setStep('wallet');
        setDebugMessage('Calling your wallet provider. Approve the connection prompt to continue.');
        try {
          if (!isConnected) {
            const connection = await connectWallet();
            if (!connection?.address) {
              throw new Error('Wallet connection was cancelled.');
            }
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to connect wallet';
          setErrorMessage(message);
          setDebugMessage(message);
          setStep('error');
        }
      } else {
        setDebugMessage('Setup complete! Redirecting you to your dashboard...');
        setStep('complete');
      }
    };

    setHasStartedOnboarding(true);
    handleOnboarding();
  }, [isUserLoaded, user, role, getToken, router, updateUserRole, connectWallet, isConnected, hasStartedOnboarding]);

  // Effect to move from wallet connection to farmer creation
  useEffect(() => {
    if (role === 'farmer' && isConnected && step === 'wallet') {
      const createAccount = async () => {
        setStep('creating');
        setDebugMessage('Submitting createFarmer transaction. Confirm the action in your wallet.');
        const result = await createFarmerAccount();
        if (result.success) {
          setDebugMessage('Farmer registered on-chain. Finalizing setup...');
          setStep('complete');
        } else {
          const message = result.error || 'Failed to create farmer account.';
          setErrorMessage(message);
          setDebugMessage(message);
          setStep('error');
        }
      };
      createAccount();
    }
  }, [role, isConnected, step, createFarmerAccount]);

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
          title: "Connect Your Wallet",
          description: "As a Farmer, you need to connect a Hedera wallet to continue.",
          status: "Awaiting wallet connection...",
          icon: <Loader2 className="h-8 w-8 animate-spin text-green-600" />,
          customContent: (
            <Button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect HashPack Wallet'}
            </Button>
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
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          )
        };
      case 'error':
        return {
          title: "An Error Occurred",
          description: "Something went wrong during setup.",
          status: "Failed",
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
          customContent: (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
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
        router.push('/dashboard');
      }, 3000);
    }
  }, [step, router]);


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
                  : 'border-green-200 bg-green-50 text-green-800'
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

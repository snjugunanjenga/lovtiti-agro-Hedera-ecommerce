'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, Wallet, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface WalletSetupGuideProps {
  onComplete?: () => void;
}

export default function WalletSetupGuide({ onComplete }: WalletSetupGuideProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasWallet, setHasWallet] = useState<boolean>(
    typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  );

  const { connectWallet, isConnecting, isConnected, wallet, createFarmerAccount, isCreatingFarmer, error } = useWallet();

  const checkWalletInstalled = () => {
    const installed = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    setHasWallet(installed);
    if (installed) {
      setCurrentStep(2);
    }
  };

  const handleConnect = async () => {
    const result = await connectWallet();
    if (result?.address) {
      setCurrentStep(3);
    }
  };

  const handleCreateFarmer = async () => {
    const result = await createFarmerAccount();
    if (result.success) {
      setCurrentStep(4);
      onComplete?.();
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Install MetaMask',
      description: 'Download and install the MetaMask browser extension',
      completed: hasWallet,
      action: !hasWallet ? (
        <div className="space-y-3">
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download MetaMask
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <Button
            variant="outline"
            onClick={checkWalletInstalled}
            className="w-full"
          >
            I've Installed MetaMask
          </Button>
          <p className="text-xs text-gray-500 text-center">
            After installing, refresh this page or click the button above
          </p>
        </div>
      ) : null,
    },
    {
      number: 2,
      title: 'Connect Wallet',
      description: 'Connect your MetaMask wallet to our platform',
      completed: isConnected,
      action: !isConnected ? (
        <div className="space-y-3">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            Connected: <span className="font-mono">{wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}</span>
          </p>
        </div>
      ),
    },
    {
      number: 3,
      title: 'Register on Blockchain',
      description: 'Create your farmer profile on the Hedera blockchain',
      completed: currentStep > 3,
      action: currentStep === 3 && !isCreatingFarmer ? (
        <div className="space-y-3">
          <Button
            onClick={handleCreateFarmer}
            disabled={isCreatingFarmer}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingFarmer ? 'Registering...' : 'Register as Farmer'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            This will create a transaction on the Hedera blockchain
          </p>
        </div>
      ) : currentStep === 3 && isCreatingFarmer ? (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">Processing transaction...</p>
        </div>
      ) : null,
    },
    {
      number: 4,
      title: 'All Set!',
      description: 'Your blockchain wallet is configured and ready',
      completed: currentStep === 4,
      action: currentStep === 4 ? (
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-800 mb-1">
            Blockchain Setup Complete!
          </p>
          <p className="text-xs text-green-700">
            You can now use all blockchain features
          </p>
        </div>
      ) : null,
    },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-600" />
          Blockchain Wallet Setup
        </CardTitle>
        <CardDescription>
          Complete these steps to enable blockchain features for your farmer account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`border rounded-lg p-4 transition-all ${
                step.number === currentStep
                  ? 'border-green-500 bg-green-50/50'
                  : step.completed
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step Number/Status */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step.completed
                      ? 'bg-green-600 text-white'
                      : step.number === currentStep
                      ? 'bg-green-100 text-green-700 border-2 border-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {step.description}
                  </p>
                  {step.action && (
                    <div className="mt-3">
                      {step.action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Why do I need this?</strong> Blockchain features allow you to:
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Register products on-chain for transparency</li>
            <li>Receive payments in cryptocurrency</li>
            <li>Build verifiable transaction history</li>
            <li>Access decentralized marketplace features</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

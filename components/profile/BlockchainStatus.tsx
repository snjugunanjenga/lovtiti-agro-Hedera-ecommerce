"use client";
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function BlockchainStatus() {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { user } = useAuth();
  const { wallet, connectWallet, createFarmerAccount } = useWallet();
  const { toast } = useToast();

  // Check if farmer exists on blockchain
  useEffect(() => {
    const checkFarmerStatus = async () => {
      if (!wallet?.address) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/agro/farmer/${wallet.address}`);
        const data = await response.json();
        setIsRegistered(data.success && data.data?.exists);
      } catch (error) {
        console.error('Error checking farmer status:', error);
        setIsRegistered(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (wallet?.address) {
      checkFarmerStatus();
    }
  }, [wallet?.address]);

  const handleRegister = async () => {
    try {
      // Connect wallet if not connected
      if (!wallet) {
        await connectWallet();
      }

      const result = await createFarmerAccount(user?.id);

      if (result.success) {
        setIsRegistered(true);
        toast({
          title: "Success!",
          description: "Your farmer account has been registered on the blockchain.",
        });
      } else {
        throw new Error(result.error || 'Failed to create farmer account');
      }
    } catch (error) {
      console.error('Error registering on blockchain:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register on blockchain",
        variant: "destructive"
      });
    }
  };

  // If not a farmer role, don't show anything
  const userRole = user?.role ?? null;
  if (userRole !== 'FARMER') {
    return null;
  }

  return (
    <div className="cl-page-root">
      <div className="cl-internal-b3fm6y">
        <div className="cl-card">
          <div className="cl-card-text">
            <h3 className="cl-card-title">Blockchain Registration</h3>
            
            {isChecking ? (
              <div className="cl-form-row">
                <div className="cl-processing-indicator">Checking registration status...</div>
              </div>
            ) : isRegistered ? (
              <div className="cl-form-row">
                <div className="cl-success-text">✓ Your farmer account is registered on the blockchain</div>
              </div>
            ) : (
              <div className="cl-form-row">
                <p className="cl-body-text mb-4">Your farmer account needs to be registered on the blockchain to access all features.</p>
                <button
                  onClick={handleRegister}
                  className="cl-button-primary"
                  type="button"
                >
                  Register on Blockchain
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

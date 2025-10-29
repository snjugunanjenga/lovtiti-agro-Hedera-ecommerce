import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

interface RegisterOnBlockchainProps {
  userId: string;
  walletAddress?: string;
}

export function RegisterOnBlockchain({ userId, walletAddress }: RegisterOnBlockchainProps) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { wallet, connectWallet, createFarmerAccount } = useWallet();
  const { toast } = useToast();
  
  // Check if farmer exists on blockchain
  useEffect(() => {
    const checkFarmerStatus = async () => {
      if (!walletAddress) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/agro/farmer/${walletAddress}`);
        const data = await response.json();
        setIsRegistered(data.success && data.data?.exists);
      } catch (error) {
        console.error('Error checking farmer status:', error);
        setIsRegistered(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkFarmerStatus();
  }, [walletAddress]);

  const handleRegister = async () => {
    try {
      // Connect wallet if not connected
      if (!wallet?.isConnected) {
        await connectWallet();
      }

      // Create farmer account on blockchain
      const result = await createFarmerAccount();

      if (result.success) {
        // Update user record with contract address
        const updateResponse = await fetch('/api/users/update-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            contractAddress: wallet?.address,
            isContractFarmer: true
          }),
        });

        if (updateResponse.ok) {
          setIsRegistered(true);
          toast({
            title: "Success!",
            description: "Your farmer account has been registered on the blockchain.",
          });
        } else {
          throw new Error('Failed to update user record');
        }
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

  if (isChecking) {
    return <Button disabled>Checking registration status...</Button>;
  }

  if (isRegistered) {
    return <Button disabled variant="outline" className="bg-green-50">✓ Registered on Blockchain</Button>;
  }

  return (
    <Button onClick={handleRegister} variant="default">
      Register as Farmer on Blockchain
    </Button>
  );
}
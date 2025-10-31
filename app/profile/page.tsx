'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterOnBlockchain } from '@/components/RegisterOnBlockchain';

export default function ProfilePage() {
  const [userData, setUserData] = useState<{
    id: string;
    email: string;
    role: string;
    walletAddress?: string;
    isContractFarmer: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Role:</strong> {userData.role}</p>
            {userData.walletAddress && (
              <p><strong>Wallet Address:</strong> {userData.walletAddress}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {userData.role === 'FARMER' && (
        <Card>
          <CardHeader>
            <CardTitle>Farmer Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterOnBlockchain 
              userId={userData.id} 
              walletAddress={userData.walletAddress} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

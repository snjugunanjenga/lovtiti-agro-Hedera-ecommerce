'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockchainStatus } from '@/components/profile/BlockchainStatus';
import Link from 'next/link';

export default function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Sign in required</h1>
        <p className="text-gray-600">Please sign in to view your account details.</p>
        <Link href="/auth/login" className="text-green-700 hover:underline">
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-semibold text-gray-900">My Account</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="font-medium text-gray-700">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium text-gray-700">Role:</span> {user.role}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Blockchain status</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockchainStatus />
        </CardContent>
      </Card>
    </main>
  );
}

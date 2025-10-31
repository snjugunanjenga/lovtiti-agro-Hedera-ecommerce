'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <h1 className="text-3xl font-semibold text-gray-900">Sign out</h1>
      <p className="text-gray-600">End your session on Lovtiti Agro Mart.</p>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button onClick={handleLogout} disabled={isLoggingOut} className="min-w-[180px]">
        {isLoggingOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing out...
          </>
        ) : (
          'Sign out'
        )}
      </Button>
      <Link className="text-sm text-green-700 hover:underline" href="/">
        Return to home
      </Link>
    </main>
  );
}

/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isOfflineWalletPresent, loginOfflineWithPrivateKey } from '@/utils/hedera';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [privKey, setPrivKey] = useState('');
  const [offlinePassword, setOfflinePassword] = useState('');
  const [offlineOk, setOfflineOk] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Invalid email or password');
      }

      await refresh();
      setStatusMessage('Login successful. Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row">
        <Card className="w-full md:w-1/2 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in with your email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {statusMessage && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {statusMessage}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/2 shadow-xl">
          <CardHeader>
            <CardTitle>Offline Hedera Login</CardTitle>
            <CardDescription>
              Cache an encrypted Hedera private key for offline signing and quick wallet access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOfflineWalletPresent() ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Encrypted Hedera key cached. You can use the app offline.
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const result = await loginOfflineWithPrivateKey(privKey, offlinePassword);
                  setOfflineOk(result);
                  if (!result) {
                    setError('Failed to save encrypted key. Check the private key and password.');
                  }
                }}
              >
                <div>
                  <Label htmlFor="hed-era-key">Hedera Private Key</Label>
                  <Input
                    id="hed-era-key"
                    value={privKey}
                    onChange={(event) => setPrivKey(event.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="offline-password">Encrypt with Password</Label>
                  <Input
                    id="offline-password"
                    type="password"
                    value={offlinePassword}
                    onChange={(event) => setOfflinePassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Save encrypted key
                </Button>
                {offlineOk && (
                  <p className="text-sm text-green-700">
                    Encrypted key saved. You can now authenticate offline.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

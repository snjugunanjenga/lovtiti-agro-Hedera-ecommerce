/* eslint-disable @typescript-eslint/no-misused-promises */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, User, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';

type SignupRole =
  | 'BUYER'
  | 'FARMER'
  | 'DISTRIBUTOR'
  | 'TRANSPORTER'
  | 'AGROEXPERT'
  | 'VETERINARIAN'
  | 'ADMIN';

type Step = 'role' | 'details' | 'complete';

const SIGNUP_ROLES: Array<{
  value: SignupRole;
  title: string;
  description: string;
  bulletPoints: string[];
}> = [
  {
    value: 'BUYER',
    title: 'Buyer',
    description:
      'Purchase fresh agricultural produce directly from trusted farmers and distributors.',
    bulletPoints: ['Browse verified listings', 'Place secure orders', 'Track deliveries'],
  },
  {
    value: 'FARMER',
    title: 'Farmer',
    description:
      'Sell your produce, manage on-chain inventory, and access financial tools built for farmers.',
    bulletPoints: [
      'Publish blockchain-backed listings',
      'Manage stock effortlessly',
      'Receive secure payments',
    ],
  },
  {
    value: 'DISTRIBUTOR',
    title: 'Distributor',
    description:
      'Bridge farmers and buyers with streamlined procurement and logistics management tools.',
    bulletPoints: ['Manage supply pipelines', 'Coordinate shipments', 'Access buyer networks'],
  },
  {
    value: 'TRANSPORTER',
    title: 'Transporter',
    description:
      'Offer logistics and delivery services tailored for agricultural supply chains.',
    bulletPoints: ['Schedule deliveries', 'Optimize routes', 'Update delivery statuses'],
  },
  {
    value: 'AGROEXPERT',
    title: 'Agro Expert',
    description:
      'Provide advisory services, lease equipment, and support farmers with actionable insights.',
    bulletPoints: ['Offer consultations', 'Lease equipment', 'Share expertise'],
  },
  {
    value: 'VETERINARIAN',
    title: 'Veterinarian',
    description:
      'Support livestock farmers with specialized products and professional services.',
    bulletPoints: ['Sell vet supplies', 'Manage appointments', 'Share best practices'],
  },
  {
    value: 'ADMIN',
    title: 'Administrator',
    description:
      'Oversee the platform, manage users, resolve disputes, and ensure marketplace integrity.',
    bulletPoints: ['Manage user roles', 'Review KYC submissions', 'Monitor platform health'],
  },
];

const INITIAL_FORM = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  country: '',
  address: '',
  idNumber: '',
  notes: '',
};

type CreatedUser = {
  id: string;
  email: string;
  role: string;
};

export default function SignupPage() {
  const router = useRouter();
  const {
    wallet,
    isConnected,
    isConnecting,
    connectWallet,
    createFarmerAccount,
    isCreatingFarmer,
  } = useWallet();
  const { setUser, refresh } = useAuth();
  const [didAttemptChainReg, setDidAttemptChainReg] = useState(false);

  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const walletSummary = useMemo(() => {
    if (!wallet) return null;
    return {
      address: wallet.address,
      hederaAccountId: wallet.hederaAccountId ?? null,
    };
  }, [wallet]);

  useEffect(() => {
    if (!walletSummary) return;
    setDetailErrors((prev) => {
      if (!prev.wallet) return prev;
      const { wallet: _removed, ...rest } = prev;
      return rest;
    });
  }, [walletSummary]);

  const resetErrors = () => {
    setError(null);
    setStatusMessage(null);
    setDetailErrors({});
  };

  const clearFieldError = (field: keyof typeof form) => {
    setDetailErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };
  const ensureWalletConnected = async () => {
    // Fast path: already have an address
    if (walletSummary?.address) {
      return {
        address: walletSummary.address,
        hederaAccountId: walletSummary.hederaAccountId ?? undefined,
      };
    }

    // Attempt connection
    const connected = await connectWallet();
    if (!connected || !connected.address) {
      throw new Error('Wallet connection was cancelled or failed.');
    }
    return {
      address: connected.address,
      hederaAccountId: connected.hederaAccountId ?? undefined,
    };
  };

  const validateDetailForm = () => {
    const errors: Record<string, string> = {};
    if (form.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters long.';
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!form.phone.trim()) {
      errors.phone = 'Provide a phone number.';
    }
    return errors;
  };

  const extractZodErrors = (errors: any) => {
    const collected: Record<string, string> = {};
    if (!errors || typeof errors !== 'object') return collected;
    for (const [key, value] of Object.entries(errors)) {
      if (key === '_errors') continue;
      if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as any)._errors) &&
        (value as any)._errors.length > 0
      ) {
        const mappedKey = key === 'walletInfo' ? 'wallet' : key;
        collected[mappedKey] = (value as any)._errors[0] as string;
      }
    }
    return collected;
  };

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    resetErrors();
    setStep('details');
  };

  const handleDetailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetErrors();

    const validation = validateDetailForm();
    if (Object.keys(validation).length > 0) {
      setDetailErrors(validation);
      setError('Please correct the highlighted fields.');
      return;
    }

    setIsSubmitting(true);

    try {
         let walletInfoToSend:
     | { walletAddress: string; hederaAccountId?: string | null; walletType: 'walletconnect' }
     | undefined;
   if (selectedRole === 'FARMER') {
     try {
       const w = await ensureWalletConnected();
       walletInfoToSend = {
         walletAddress: w.address,
         hederaAccountId: w.hederaAccountId ?? null,
         walletType: 'walletconnect',
       };
     } catch (werr) {
       setError(werr instanceof Error ? werr.message : 'Failed to connect wallet');
       return;
     }
   }
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          role: selectedRole,
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          country: form.country.trim() || undefined,
          address: form.address.trim() || undefined,
          idNumber: form.idNumber.trim() || undefined,
          metadata: form.notes.trim() ? { notes: form.notes.trim() } : undefined,
          walletInfo: walletInfoToSend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result?.errors) {
          const serverErrors = extractZodErrors(result.errors);
          if (Object.keys(serverErrors).length > 0) {
            setDetailErrors(serverErrors);
          }
        }
        console.error('[signup] server rejected payload', {
          status: response.status,
          body: result,
        });
        throw new Error(result.message || 'Failed to create account');
      }

      const user = result?.data?.user as CreatedUser | undefined;
      if (user) {
        setCreatedUser(user);
        setUser(user);
      } else {
        await refresh();
      }
      setStatusMessage('Account created successfully.');
      if (selectedRole === 'FARMER' && !didAttemptChainReg) {
        setDidAttemptChainReg(true);
        try {
          if (!user?.id) throw new Error('Missing user id after signup.');
          setError(null);
          setStatusMessage('Registering your farmer profile on-chain. Approve the transaction in your wallet…');
          const res = await createFarmerAccount(user.id);
          if (!res?.success) throw new Error(res?.error || 'On-chain registration failed.');
          setStatusMessage('Great! Your farmer account is registered on-chain.');
        } catch (chainErr) {
          console.error('[signup] on-chain registration failed', chainErr);
          const msg = chainErr instanceof Error ? chainErr.message : 'On-chain registration failed.';
          const isUserCancel = /user denied|rejected|cancel/i.test(msg);
          setError(isUserCancel ? 'Transaction cancelled in wallet.' : msg);
        }
      }
      setStep('complete');
      

    } catch (err) {
      console.error('[signup] failed to create account', err);
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFarmerRegistration = async () => {
    if (!walletSummary) {
      setDetailErrors((prev) => ({ ...prev, wallet: 'Connect your Hedera wallet first.' }));
      return;
    }

    if (!isConnected) {
      try {
        const connected = await connectWallet();
        if (!connected || !connected.address) {
          throw new Error('Wallet connection was cancelled.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        return;
      }
    }

    resetErrors();
    setStatusMessage('Submitting farmer registration on-chain. Approve the transaction in your wallet.');

    const result = await createFarmerAccount(createdUser?.id);
    if (!result.success) {
      setError(result.error || 'On-chain registration failed.');
      return;
    }

    setStatusMessage('Great! Your farmer account is registered on-chain.');
    setStep('complete');
  };

  const renderRoleStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Create Your Lovtiti Account</h1>
          <p className="mt-2 text-lg text-gray-600">
            Select the profile that best matches how you will use the marketplace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SIGNUP_ROLES.map((roleCard) => {
            const isSelected = selectedRole === roleCard.value;
            return (
              <Card
                key={roleCard.value}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                    : 'hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedRole(roleCard.value)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>{roleCard.title}</span>
                    {isSelected && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                  </CardTitle>
                  <CardDescription>{roleCard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {roleCard.bulletPoints.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto max-w-2xl">
          <Button
            onClick={handleRoleContinue}
            disabled={!selectedRole}
            className="w-full bg-green-600 text-lg font-medium text-white hover:bg-green-700"
          >
            Continue
          </Button>
          {!selectedRole && (
            <p className="mt-2 text-center text-sm text-gray-500">
              Choose a role to unlock the tailored onboarding steps.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-2xl">Tell us about you</span>
              <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                {selectedRole}
              </span>
            </CardTitle>
            <CardDescription>
              We create your Lovtiti account and immediately authenticate you with a secure token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleDetailSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(event) => {
                      clearFieldError('fullName');
                      setForm((prev) => ({ ...prev, fullName: event.target.value }));
                    }}
                    placeholder="Jane Doe"
                    required
                    className={
                      detailErrors.fullName
                        ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                        : undefined
                    }
                  />
                  {detailErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{detailErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      clearFieldError('email');
                      setForm((prev) => ({ ...prev, email: event.target.value }));
                    }}
                    placeholder="you@example.com"
                    required
                    className={
                      detailErrors.email
                        ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                        : undefined
                    }
                  />
                  {detailErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{detailErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => {
                      clearFieldError('password');
                      setForm((prev) => ({ ...prev, password: event.target.value }));
                    }}
                    placeholder="At least 8 characters"
                    required
                    className={
                      detailErrors.password
                        ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                        : undefined
                    }
                  />
                  {detailErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{detailErrors.password}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => {
                      clearFieldError('phone');
                      setForm((prev) => ({ ...prev, phone: event.target.value }));
                    }}
                    placeholder="+254 700 000 000"
                    className={
                      detailErrors.phone
                        ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
                        : undefined
                    }
                  />
                  {detailErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{detailErrors.phone}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, country: event.target.value }))
                    }
                    placeholder="Kenya"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, address: event.target.value }))
                    }
                    placeholder="Farm road, county"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="idNumber">Government ID</Label>
                  <Input
                    id="idNumber"
                    value={form.idNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, idNumber: event.target.value }))
                    }
                    placeholder="National ID or registration number"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional notes (optional)</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Share context for faster verification"
                    rows={3}
                    className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {selectedRole === 'FARMER' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <Wallet className="mt-1 h-5 w-5 text-green-600" />
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-green-800">Connect Hedera wallet</h3>
                        <p className="text-sm text-green-700">
                          We store your wallet address with the signup so we can deploy your farmer
                          profile on-chain right after registration.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-green-800">
                          {walletSummary ? (
                            <>
                              <p>Address: {walletSummary.address}</p>
                              {walletSummary.hederaAccountId && (
                                <p>Hedera ID: {walletSummary.hederaAccountId}</p>
                              )}
                            </>
                          ) : (
                            <p>No wallet connected yet.</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={connectWallet}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect HashPack or WalletConnect'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {detailErrors.wallet && (
                    <p className="mt-3 text-sm text-red-600">{detailErrors.wallet}</p>
                  )}
                </div>
              )}

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

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setStep('role')} disabled={isSubmitting}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFarmerRegistrationStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Register on Hedera</CardTitle>
            <CardDescription>
              We now connect your verified account to the Hedera smart contract so buyers can trust
              your listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">Wallet status</p>
              {walletSummary ? (
                <ul className="mt-2 space-y-1">
                  <li>Wallet address: {walletSummary.address}</li>
                  {walletSummary.hederaAccountId && <li>Hedera ID: {walletSummary.hederaAccountId}</li>}
                </ul>
              ) : (
                <p>No wallet connected yet.</p>
              )}
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

            <div className="flex flex-col gap-3 md:flex-row md:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={connectWallet}
                disabled={isConnecting || isCreatingFarmer}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting wallet...
                  </>
                ) : (
                  'Reconnect wallet'
                )}
              </Button>
              <Button
                type="button"
                onClick={handleFarmerRegistration}
                disabled={isCreatingFarmer || !walletSummary}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isCreatingFarmer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Waiting for wallet approval...
                  </>
                ) : (
                  'Register farmer on-chain'
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('complete')}
              disabled={isCreatingFarmer}
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="mx-auto max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
            <CardDescription>
              Welcome to Lovtiti Agro Mart. We&apos;ve issued your access token and prepared your
              dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {statusMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {statusMessage}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-green-600 text-white hover:bg-green-700"
              onClick={() => router.push('/dashboard')}
            >
              Go to my dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  switch (step) {
    case 'role':
      return renderRoleStep();
    case 'details':
      return renderDetailStep();
    case 'complete':
      return renderCompleteStep();
    default:
      return null;
  }
}

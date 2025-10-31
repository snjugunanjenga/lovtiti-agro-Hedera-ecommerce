'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SignedIn({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return null;
  return <>{children}</>;
}

export function useUser() {
  const { user, loading } = useAuth();
  return {
    user,
    isLoaded: !loading,
  };
}

type UserButtonProps = {
  afterSignOutUrl?: string;
  className?: string;
};

export function UserButton({ afterSignOutUrl = '/', className }: UserButtonProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const label = user.email ?? 'Account';

  return (
    <button
      type="button"
      className={className ?? 'rounded-full border border-green-200 px-3 py-1 text-sm text-green-700'}
      onClick={async () => {
        await logout();
        router.push(afterSignOutUrl);
      }}
    >
      {label}
    </button>
  );
}

export { useAuth } from '@/contexts/AuthContext';

'use client';

import { hasValidClerkKeys } from '@/lib/clerk-config';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const valid = hasValidClerkKeys();

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Password reset unavailable</h1>
          <p className="text-gray-600 mb-4">
            Authentication is not configured for this environment. Add valid Clerk keys to enable password reset.
          </p>
          <div className="space-x-2">
            <Link href="/auth/login" className="text-green-600 hover:underline">Back to Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  // Dynamically require to avoid loading when keys are invalid
  const { ResetPassword } = require('@clerk/nextjs');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <ResetPassword appearance={{ elements: { card: 'shadow-lg' } }} />
      </div>
    </div>
  );
}



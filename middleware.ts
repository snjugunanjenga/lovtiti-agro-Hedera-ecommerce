import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if Clerk keys are valid before initializing
const isValidClerkKey = (key: string | undefined): boolean => {
  if (!key) return false;
  if (!key.startsWith('pk_') && !key.startsWith('sk_')) return false;
  if (key === 'pk_test_placeholder_key_for_development_only') return false;
  if (key === 'sk_test_placeholder_secret_key_for_development_only') return false;
  // Basic validation - must be longer than placeholder keys (real keys are much longer)
  if (key.length < 50) return false;
  return true;
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const hasValidKeys = isValidClerkKey(publishableKey) && isValidClerkKey(secretKey);

// Following Clerk rules: always use clerkMiddleware
// If keys are invalid, wrap it to catch and pass through errors
const baseMiddleware = clerkMiddleware();

export default async function middleware(request: NextRequest, event: any) {
  // If keys are invalid, pass through without authentication
  if (!hasValidKeys) {
    return NextResponse.next();
  }
  
  // Use Clerk middleware if keys are valid
  try {
    return await baseMiddleware(request, event);
  } catch (error) {
    // If Clerk fails, log and pass through
    console.warn('Clerk middleware error (continuing without auth):', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

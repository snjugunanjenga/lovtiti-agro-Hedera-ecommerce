import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, verifyAuthToken } from './auth';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

function extractTokenFromHeader(reqHeaders: Headers) {
  const authHeader = reqHeaders.get('authorization') || reqHeaders.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }
  return null;
}

export function getTokenFromRequest(req?: NextRequest): string | null {
  if (req) {
    const headerToken = extractTokenFromHeader(req.headers);
    if (headerToken) return headerToken;
    const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
    if (cookieToken) return cookieToken;
  }

  try {
    const hdrs = headers();
    const headerToken = extractTokenFromHeader(hdrs);
    if (headerToken) return headerToken;
  } catch {
    // headers() not available (non-request context)
  }

  try {
    const cookieStore = cookies();
    const cookieToken = cookieStore.get(AUTH_COOKIE)?.value;
    if (cookieToken) return cookieToken;
  } catch {
    // cookies() not available
  }

  return null;
}

export function requireUser(req?: NextRequest): AuthenticatedUser {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error('Authentication token missing');
  }

  const payload = verifyAuthToken(token);
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

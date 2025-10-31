import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out',
    },
    { status: 200 },
  );

  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

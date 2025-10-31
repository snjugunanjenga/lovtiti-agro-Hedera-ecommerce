import { NextRequest, NextResponse } from 'next/server';
import { ProfileType, Role } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logUserRegistration } from '@/utils/userActivityLogger';
import { getRoleDisplayName, getRolePermissions, UserRole } from '@/utils/roleManager';
import { AUTH_COOKIE, hashPassword, signAuthToken } from '@/lib/auth';

const allowedRoles = [
  'BUYER',
  'FARMER',
  'DISTRIBUTOR',
  'TRANSPORTER',
  'AGROEXPERT',
  'VETERINARIAN',
  'ADMIN',
] as const;

type AllowedRole = (typeof allowedRoles)[number];

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(allowedRoles).default('BUYER'),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    idNumber: z.string().optional(),
    walletInfo: z
      .object({
        walletAddress: z.string(),
        hederaAccountId: z.string().nullable(),
        walletType: z.enum(['metamask', 'walletconnect']),
      })
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => data.role !== 'FARMER' || (data.walletInfo && data.walletInfo.walletAddress),
    {
      message: 'Wallet information is required for farmers',
      path: ['walletInfo'],
    },
  );

const dashboardMap: Record<AllowedRole, string> = {
  BUYER: '/dashboard/buyer',
  FARMER: '/dashboard/farmer',
  DISTRIBUTOR: '/dashboard/distributor',
  TRANSPORTER: '/dashboard/transporter',
  AGROEXPERT: '/dashboard/agro-vet',
  VETERINARIAN: '/dashboard/veterinarian',
  ADMIN: '/dashboard/admin',
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (payload.role) {
      payload.role = String(payload.role).toUpperCase();
    }

    const parsed = signupSchema.safeParse(payload);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      console.warn('[signup] invalid payload received:', JSON.stringify(formatted, null, 2));
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid signup data',
          errors: formatted,
        },
        { status: 400 },
      );
    }

    const {
      email,
      password,
      role,
      fullName,
      phone,
      country,
      address,
      idNumber,
      walletInfo,
      metadata,
    } = parsed.data;

    const prismaRole = role as Role;
    const profileType =
      (ProfileType as Record<string, ProfileType>)[prismaRole] ?? ProfileType.BUYER;

    const walletMetadata = walletInfo
      ? {
          type: walletInfo.walletType,
          hederaAccountId: walletInfo.hederaAccountId,
          address: walletInfo.walletAddress,
        }
      : undefined;

    const profileMetadata = {
      ...(metadata ?? {}),
      wallet: walletMetadata,
    };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account already exists for this email',
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: prismaRole,
        passwordHash,
      },
      create: {
        email,
        role: prismaRole,
        passwordHash,
      },
    });

    const upsertProfile = async (includeMetadata: boolean) =>
      prisma.profile.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type: profileType,
          },
        },
        update: {
          fullName,
          country: country || '',
          address: address || '',
          phone: phone || '',
          idNumber: idNumber || '',
          hederaWallet: walletInfo?.walletAddress ?? '',
          ...(includeMetadata ? { metadata: profileMetadata as any } : {}),
          kycStatus: 'PENDING',
        },
        create: {
          userId: user.id,
          type: profileType,
          fullName,
          country: country || '',
          address: address || '',
          phone: phone || '',
          idNumber: idNumber || '',
          hederaWallet: walletInfo?.walletAddress ?? '',
          ...(includeMetadata ? { metadata: profileMetadata as any } : {}),
        },
      });

    try {
      await upsertProfile(true);
    } catch (profileError: any) {
      if (profileError?.code === 'P2022' && profileError?.meta?.column === 'metadata') {
        console.warn(
          '[signup] profile.metadata column missing in DB; continuing without metadata payload.',
        );
        await upsertProfile(false);
      } else {
        throw profileError;
      }
    }

    logUserRegistration(user.id, user.role, user.email, {
      registrationMethod: 'api_signup_jwt',
      walletAttached: Boolean(walletInfo?.walletAddress),
      metadata,
    });

    const normalizedRole = user.role as UserRole;

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          dashboardPath: dashboardMap[role as AllowedRole] ?? '/dashboard/buyer',
          roleInfo: {
            role: user.role,
            displayName: getRoleDisplayName(normalizedRole),
            permissions: getRolePermissions(normalizedRole),
          },
          requiresOnChainRegistration: role === 'FARMER',
        },
      },
      { status: 201 },
    );

    response.cookies.set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[signup] error creating account:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Signup failed due to a server error.',
        details: error instanceof Error ? { message: error.message } : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const roles = allowedRoles.map((role) => ({
    value: role,
    displayName: getRoleDisplayName(role as UserRole),
    description: `Signup option for ${role.toLowerCase()}`,
    dashboardPath: dashboardMap[role],
  }));

  return NextResponse.json({
    success: true,
    data: {
      roles,
      defaultRole: 'BUYER',
    },
  });
}

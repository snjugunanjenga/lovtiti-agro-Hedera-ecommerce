import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role, ProfileType } from '@prisma/client';
import { z } from 'zod';
import { logUserRegistration } from '@/utils/userActivityLogger';
import { getRoleDisplayName, getRolePermissions, UserRole } from '@/utils/roleManager';

const prisma = new PrismaClient();

const allowedRoles = ['BUYER', 'FARMER', 'DISTRIBUTOR', 'TRANSPORTER', 'AGROEXPERT', 'VETERINARIAN', 'ADMIN'] as const;
type AllowedRole = typeof allowedRoles[number];

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(allowedRoles).default('BUYER'),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  walletInfo: z.object({
    walletAddress: z.string(),
    hederaAccountId: z.string().nullable(),
    walletType: z.enum(['metamask', 'walletconnect'])
  }).optional(),
  metadata: z.record(z.unknown()).optional()
}).refine(
  (data) => (data.role !== 'FARMER') || (data.walletInfo && data.walletInfo.walletAddress),
  { message: 'Wallet information is required for farmers', path: ['walletInfo'] }
);

const dashboardMap: Record<AllowedRole, string> = {
  BUYER: '/dashboard/buyer',
  FARMER: '/dashboard/farmer',
  DISTRIBUTOR: '/dashboard/distributor',
  TRANSPORTER: '/dashboard/transporter',
  AGROEXPERT: '/dashboard/agro-vet',
  VETERINARIAN: '/dashboard/veterinarian',
  ADMIN: '/dashboard/admin'
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (payload.role) {
      payload.role = String(payload.role).toUpperCase();
    }

    const parsed = signupSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid signup data',
          errors: parsed.error.format()
        },
        { status: 400 }
      );
    }

    const {
      email,
      role,
      fullName,
      phone,
      country,
      address,
      idNumber,
      walletInfo,
      metadata
    } = parsed.data;

    const walletAddress = walletInfo?.walletAddress;
    const hederaAccountId = walletInfo?.hederaAccountId;
    const walletType = walletInfo?.walletType;

    console.log(
      '[signup] user schema preview:',
      JSON.stringify(
        {
          email,
          role,
          fullName,
          phone,
          country,
          address,
          idNumber,
          wallet: walletInfo && {
            address: walletAddress,
            hederaId: hederaAccountId,
            type: walletType
          },
          metadata
        },
        null,
        2
      )
    );
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account already exists for this email'
        },
        { status: 409 }
      );
    }

    const userRole = role as AllowedRole;
    const prismaRole = role as Role;
    const profileType = (ProfileType as Record<string, ProfileType>)[userRole] ?? ProfileType.BUYER;

    console.log('[signup] preparing user creation', {
      user: {
        email,
        role,
        walletAddress,
        hederaWallet
      },
      profile: {
        fullName,
        phone,
        country,
        address,
        idNumber
      }
    });

    // Convert metadata to Prisma-compatible JSON value
    const walletMetadata = walletInfo ? {
      type: walletInfo.walletType,
      hederaAccountId: walletInfo.hederaAccountId,
      address: walletInfo.walletAddress
    } : undefined;

    const userMetadata = metadata || {};
    const finalMetadata = {
      ...userMetadata,
      wallet: walletMetadata
    };

    const newUser = await prisma.user.create({
      data: {
        email,
        role: prismaRole,
        walletAddress: walletAddress || null,
        contractAddress: walletAddress || null,
        hederaAccountId: hederaAccountId || null,
        metadata: finalMetadata as any // Type assertion for Prisma JSON field
      }
    });

    const profile = await prisma.profile.upsert({
      where: {
        userId_type: {
          userId: newUser.id,
          type: profileType
        }
      },
      update: {
        fullName,
        country: country || '',
        address: address || '',
        phone: phone || '',
        idNumber: idNumber || '',
        hederaWallet: hederaAccountId || '',
        metadata: finalMetadata as any, // Type assertion for Prisma JSON field
        kycStatus: 'PENDING'
      },
      create: {
        userId: newUser.id,
        type: profileType,
        fullName,
        country: country || '',
        address: address || '',
        phone: phone || '',
        idNumber: idNumber || '',
        hederaWallet: hederaAccountId || '',
        metadata: finalMetadata as any // Type assertion for Prisma JSON field
      }
    });

    const contractRegistration = await maybeQueueFarmerOnChain(newUser.id, userRole, walletAddress);

    logUserRegistration(newUser.id, newUser.role, newUser.email, {
      registrationMethod: 'api_signup',
      walletAttached: Boolean(walletAddress),
      metadata
    });

    const normalizedRole = newUser.role as UserRole;

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user: newUser,
          profile,
          dashboardPath: dashboardMap[userRole] ?? '/dashboard/buyer',
          roleInfo: {
            role: newUser.role,
            displayName: getRoleDisplayName(normalizedRole),
            permissions: getRolePermissions(normalizedRole)
          },
          contractRegistration
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create account',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const roles = allowedRoles.map((role) => ({
    value: role,
    displayName: getRoleDisplayName(role as UserRole),
    description: `Signup option for ${role.toLowerCase()}`,
    dashboardPath: dashboardMap[role]
  }));

  return NextResponse.json({
    success: true,
    data: {
      roles,
      defaultRole: 'BUYER'
    }
  });
}

async function maybeQueueFarmerOnChain(userId: string, role: AllowedRole, walletAddress?: string) {
  if (role !== 'FARMER' || !walletAddress) {
    return {
      status: 'not_required',
      notes: role === 'FARMER' ? 'Wallet address missing, contract sync deferred' : 'Only farmers require contract registration'
    };
  }

  try {
    // Get user with wallet info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        hederaAccountId: true
      }
    });

    if (!user?.walletAddress) {
      return {
        status: 'error',
        notes: 'Wallet address not found in user record'
      };
    }

    // Placeholder for future smart contract interaction.
    console.log(
      '[signup] Farmer %s queued for smart-contract registration with:\n' +
      'Wallet: %s\nHedera Account: %s',
      userId,
      user.walletAddress,
      user.hederaAccountId || 'Not provided'
    );

    return {
      status: 'queued',
      walletAddress: user.walletAddress,
      hederaAccountId: user.hederaAccountId,
      notes: 'Farmer will be registered on-chain once contract automation is connected'
    };
  } catch (error) {
    console.error('[signup] Error queueing farmer for on-chain registration:', error);
    return {
      status: 'error',
      notes: 'Failed to queue farmer for contract registration'
    };
  }
}

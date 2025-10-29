import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAgroContract } from '@/lib/server-contract';
import { ethers } from 'ethers';

const prisma = new PrismaClient();
const contract = getAgroContract();

export async function POST() {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        contractProductId: {
          not: null,
        },
      },
      select: {
        id: true,
        contractProductId: true,
      },
    });

    if (listings.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No contract-backed listings found.',
      });
    }

    const updates = await Promise.all(
      listings.map(async (listing) => {
        if (!listing.contractProductId) {
          return { id: listing.id, isVerified: false };
        }

        try {
          const product = await contract.products(BigInt(listing.contractProductId));
          const owner = product?.owner ?? product?.[1];
          const exists = owner && owner !== ethers.ZeroAddress;

          return { id: listing.id, isVerified: Boolean(exists) };
        } catch (error) {
          console.warn(
            `Failed to read product ${listing.contractProductId} from contract:`,
            error
          );
          return { id: listing.id, isVerified: false };
        }
      })
    );

    await prisma.$transaction(
      updates.map((update) =>
        prisma.listing.update({
          where: { id: update.id },
          data: { isVerified: update.isVerified },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
    });
  } catch (error) {
    console.error('Error syncing listings with contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync listings' },
      { status: 500 }
    );
  }
}

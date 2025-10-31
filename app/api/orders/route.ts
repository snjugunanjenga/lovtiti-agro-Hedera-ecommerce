import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/orders
 * Create order with contract information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, deliveryInfo, paymentMethod, totals, contractBuyerAddr } = body;

    // Validate required fields
    if (!items || !deliveryInfo || !paymentMethod || !totals || !contractBuyerAddr) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: items, deliveryInfo, paymentMethod, totals, contractBuyerAddr' 
        },
        { status: 400 }
      );
    }

    const buyerProfile = await prisma.profile.findFirst({
      where: { hederaWallet: contractBuyerAddr },
      include: { user: true },
    });

    if (!buyerProfile?.user) {
      return NextResponse.json(
        {
          success: false,
          error: `Buyer not found for wallet address: ${contractBuyerAddr}`,
        },
        { status: 404 }
      );
    }

    // Create orders for each item
    const createdOrders = [];

    for (const item of items) {
      // Find the listing by contract product ID
      const listing = await prisma.listing.findUnique({
        where: { contractProductId: item.contractProductId },
        include: {
          seller: {
            include: {
              profiles: true,
            },
          },
        },
      });

      if (!listing) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Listing not found for contract product ID: ${item.contractProductId}` 
          },
          { status: 404 }
        );
      }

      const sellerWallet =
        listing.seller.profiles.find(
          (profile) =>
            profile.type === 'FARMER' &&
            profile.hederaWallet &&
            profile.hederaWallet.trim().length > 0
        )?.hederaWallet ?? '';

      // Create order
      const order = await prisma.order.create({
        data: {
          buyerId: buyerProfile.user.id,
          listingId: listing.id,
          status: 'PAID',
          amountCents: item.amount,
          currency: 'ETH',
          deliveryAddress: `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.state}, ${deliveryInfo.country}`,
          deliveryStatus: 'PENDING',
          
          // Contract integration fields
          contractTxHash: item.transactionHash,
          contractAmount: item.amount / 100, // Convert from cents to ETH
          contractBuyerAddr: contractBuyerAddr,
          contractSellerAddr: sellerWallet,
          contractPurchasedAt: new Date()
        }
      });

      createdOrders.push(order);
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: createdOrders,
        totalAmount: totals.total,
        paymentMethod,
        deliveryInfo
      }
    });

  } catch (error) {
    console.error('Error creating orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create orders' 
      },
      { status: 500 }
    );
  }
}







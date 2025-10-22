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
    if (!items || !deliveryInfo || !paymentMethod || !totals) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: items, deliveryInfo, paymentMethod, totals' 
        },
        { status: 400 }
      );
    }

    // Create orders for each item
    const createdOrders = [];

    for (const item of items) {
      // Find the listing by contract product ID
      const listing = await prisma.listing.findUnique({
        where: { contractProductId: item.contractProductId },
        include: { seller: true }
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

      // Find buyer user by contract address
      const buyer = await prisma.user.findUnique({
        where: { contractAddress: contractBuyerAddr }
      });

      if (!buyer) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Buyer not found for contract address: ${contractBuyerAddr}` 
          },
          { status: 404 }
        );
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          buyerId: buyer.id,
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
          contractSellerAddr: listing.seller.contractAddress || '',
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






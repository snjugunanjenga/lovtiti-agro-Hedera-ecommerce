import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "productIds array is required" },
        { status: 400 }
      );
    }

    const listings = await prisma.listing.findMany({
      where: {
        contractProductId: {
          in: productIds,
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            profiles: {
              where: { type: "FARMER" },
              select: {
                fullName: true,
                country: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings by contract product IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

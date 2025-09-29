import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET /api/listings - Get all listings with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.priceCents = {};
      if (minPrice) where.priceCents.gte = parseInt(minPrice) * 100;
      if (maxPrice) where.priceCents.lte = parseInt(maxPrice) * 100;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price-low':
        orderBy = { priceCents: 'asc' };
        break;
      case 'price-high':
        orderBy = { priceCents: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              profiles: {
                where: { type: 'FARMER' },
                select: {
                  fullName: true,
                  country: true,
                },
              },
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      productDescription,
      priceCents,
      quantity,
      unit,
      category,
      location,
      harvestDate,
      expiryDate,
      images,
      video,
    } = body;

    // Validate required fields
    if (!title || !description || !priceCents || !quantity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has farmer profile
    const farmerProfile = await prisma.profile.findFirst({
      where: {
        userId,
        type: 'FARMER',
        kycStatus: 'APPROVED',
      },
    });

    if (!farmerProfile) {
      return NextResponse.json(
        { error: 'Farmer profile required and KYC must be approved' },
        { status: 403 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        productDescription,
        priceCents: parseInt(priceCents),
        quantity: parseFloat(quantity),
        unit,
        category,
        location,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        images: images || [],
        video,
        sellerId: userId,
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            profiles: {
              where: { type: 'FARMER' },
              select: {
                fullName: true,
                country: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

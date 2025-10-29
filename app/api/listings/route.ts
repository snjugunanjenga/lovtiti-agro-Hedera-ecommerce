import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
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
    const verifiedParam = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (verifiedParam !== 'false') {
      where.isVerified = true;
    }

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
    // Graceful fallback for local dev when DB is not configured
    const message = String((error as any)?.message || '');
    const looksLikePrismaInit =
      message.includes('PrismaClientInitializationError') ||
      message.includes('database string is invalid') ||
      message.includes('P1000') ||
      message.includes('P1001') ||
      message.includes('Error parsing connection string');

    if (process.env.NODE_ENV !== 'production' && looksLikePrismaInit) {
      const mockListings = Array.from({ length: 12 }).map((_, idx) => ({
        id: `mock-${idx + 1}`,
        title: `Sample Produce ${idx + 1}`,
        description: 'Delicious and fresh produce from local farmers',
        productDescription: 'High-quality agricultural product suitable for export and local markets.',
        priceCents: 1500 + idx * 100,
        quantity: 10 + idx,
        unit: 'kg',
        category: ['Vegetables', 'Fruits', 'Grains'][idx % 3],
        location: ['Lagos', 'Kano', 'Abuja'][idx % 3],
        images: [],
        video: null,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        seller: {
          id: `seller-mock-${idx + 1}`,
          email: `seller${idx + 1}@mock.dev`,
          profiles: [
            {
              fullName: `Farmer ${idx + 1}`,
              country: 'NG',
            },
          ],
        },
      }));

      return NextResponse.json({
        listings: mockListings,
        pagination: {
          page: 1,
          limit: mockListings.length,
          total: mockListings.length,
          pages: 1,
        },
      });
    }

    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
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
      contractProductId,
      contractTxHash,
      contractPrice,
      contractStock,
      contractMetadata,
      isVerified,
    } = body;

    // Validate required fields
    if (!title || !description || !priceCents || !quantity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find or create user in database
    const user = await prisma.user.findUnique({
      where: { email: `${userId}@clerk.local` },
      include: {
        profiles: {
          where: {
            type: { in: ['FARMER', 'AGROEXPERT'] },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    // Check if user has farmer or agro expert profile (KYC not strictly required for now)
    const hasValidProfile = user.profiles.length > 0;

    if (!hasValidProfile) {
      return NextResponse.json(
        { error: 'Farmer or Agro Expert profile required. Please complete KYC verification.' },
        { status: 403 }
      );
    }

    const normalizedPriceCents =
      typeof priceCents === 'number' ? priceCents : parseInt(priceCents, 10);

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        productDescription,
        priceCents: normalizedPriceCents,
        quantity: typeof quantity === 'number' ? quantity : parseFloat(quantity),
        unit,
        category,
        location,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        images: images || [],
        video,
        sellerId: user.id,
        contractProductId: contractProductId ? String(contractProductId) : null,
        contractTxHash: contractTxHash || null,
        contractPrice: contractPrice
          ? new Prisma.Decimal(contractPrice)
          : null,
        contractStock: contractStock
          ? parseInt(contractStock, 10)
          : null,
        contractMetadata: contractMetadata || null,
        contractCreatedAt: contractProductId ? new Date() : null,
        isVerified: Boolean(contractProductId || isVerified),
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

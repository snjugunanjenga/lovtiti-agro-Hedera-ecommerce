import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

const MIN_SUPPORTED_YEAR = 1900;
const MAX_SUPPORTED_YEAR = 9999;

function parseOptionalDate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getUTCFullYear();
  if (year < MIN_SUPPORTED_YEAR || year > MAX_SUPPORTED_YEAR) {
    return null;
  }

  return parsed;
}

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

    console.log('[listings] GET result', {
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        sortBy,
        verifiedParam,
        page,
        limit,
      },
      pageCount: listings.length,
      total,
    });

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
    // Parse body first so we can echo parts back predictably
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

    // Basic payload validation
    if (!title || !description || !priceCents || !quantity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let authUser;
    try {
      authUser = requireUser();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[listings] create payload received', {
      user: authUser,
      body,
    });

    const isDbFarmer = (user: any) => {
      if (!user) return false;
      if (user.role === 'FARMER') return true;
      if (Array.isArray(user.profiles)) {
        return user.profiles.some((p: any) => p?.type === 'FARMER');
      }
      return false;
    };

    const farmer = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { profiles: { select: { type: true } } },
    });

    // 4) Authorize using DB ONLY
    if (!farmer || !isDbFarmer(farmer)) {
      return NextResponse.json(
        { error: 'You are not registered as a farmer in the database.' },
        { status: 401 }
      );
    }

    // 5) Create listing (no on-chain checks here)
    const normalizedPriceCents =
      typeof priceCents === 'number' ? priceCents : parseInt(String(priceCents), 10);

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        productDescription,
        priceCents: normalizedPriceCents,
        quantity: typeof quantity === 'number' ? quantity : parseFloat(String(quantity)),
        unit,
        category,
        location,
        harvestDate: parseOptionalDate(harvestDate),
        expiryDate: parseOptionalDate(expiryDate),
        images: images || [],
        video,
        sellerId: farmer.id,
        contractProductId: contractProductId ? String(contractProductId) : null,
        contractTxHash: contractTxHash || null,
        contractPrice: contractPrice ? new Prisma.Decimal(contractPrice) : null,
        contractStock: contractStock ? parseInt(String(contractStock), 10) : null,
        contractMetadata: contractMetadata || null,
        contractCreatedAt: contractProductId ? new Date() : null,
        isVerified: Boolean(contractProductId || isVerified),
      },
    });

    console.log('[listings] listing persisted', {
      id: listing.id,
      sellerId: listing.sellerId,
      createdAt: listing.createdAt,
      contractProductId: listing.contractProductId,
      contractMetadata: listing.contractMetadata,
      priceCents: listing.priceCents,
      quantity: listing.quantity,
    });

    // Predictable response for client to toast
    return NextResponse.json(
      {
        id: listing.id,
        title: listing.title,
        ownerId: farmer.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

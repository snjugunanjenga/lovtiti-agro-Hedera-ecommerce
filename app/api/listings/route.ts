import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { ContractExecuteTransaction, ContractFunctionParameters, } from "@hashgraph/sdk";
import { uploadToIPFS } from "@/utils/pinata"; //Use your Pinata util
import { auth } from "@clerk/nextjs/server";
import dotenv from "dotenv";
import { AGRO_CONTRACT_ID, hederaClient } from "@/lib/hederaClient";

dotenv.config();

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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    if (!title || !description || !priceCents || !quantity || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const hasValidProfile = user.profiles.some((p) =>
      ["FARMER", "AGROEXPERT"].includes(p.type)
    );
    if (!hasValidProfile) {
      return NextResponse.json(
        { error: "Farmer or Agro Expert profile required." },
        { status: 403 }
      );
    }

    // ✅ Upload images to Pinata (instead of Infura IPFS)
    const uploadedImages: string[] = [];
    for (const file of images || []) {
      if (typeof file === "string") {
        uploadedImages.push(file); // already uploaded or base64 URL
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadToIPFS(buffer, title);
        uploadedImages.push(`https://gateway.pinata.cloud/ipfs/${uploaded.IpfsHash}`);
      }
    }

    // ✅ Call Hedera smart contract
    const tx = new ContractExecuteTransaction()
      .setContractId(AGRO_CONTRACT_ID)
      .setGas(300000)
      .setFunction(
        "addProduct",
        new ContractFunctionParameters()
          .addUint256(Number(priceCents))
          .addUint256(Math.floor(Number(quantity)))
      );

    const submitTx = await tx.execute(hederaClient);
    const receipt = await submitTx.getReceipt(hederaClient);
    const status = receipt.status.toString();

    if (status !== "SUCCESS") {
      return NextResponse.json(
        { error: `Hedera contract execution failed: ${status}` },
        { status: 500 }
      );
    }

    // Store contract transaction hash for future use
    const contractTxHash = submitTx.transactionId.toString();
    console.log(`✅ Hedera contract transaction: ${contractTxHash}`);

    // ✅ Save to Prisma DB
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        productDescription,
        priceCents: parseInt(priceCents),
        currency: "HBAR",
        quantity: parseFloat(quantity),
        unit,
        category,
        location,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        images: uploadedImages,
        video,
        sellerId: user.id,
      },
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (err) {
    console.error("Error creating listing:", err);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}


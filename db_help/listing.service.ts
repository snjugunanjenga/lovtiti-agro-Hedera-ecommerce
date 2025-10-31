import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { CreateListing, UpdateListing } from './validator';

type CreateListingInput = z.infer<typeof CreateListing>;
type UpdateListingInput = z.infer<typeof UpdateListing>;

function assertInteger(value: number, field: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be an integer value`);
  }
  return value;
}

function normalizeContractPrice(value: number | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(String(value));
}

function normalizeContractStock(value: number | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    throw new Error('contractStock must be a valid integer');
  }
  return parsed;
}

function normalizeDate(value: Date | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value;
}

function normalizeContractMetadata(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function createListing(rawInput: unknown) {
  const input: CreateListingInput = CreateListing.parse(rawInput);

  const seller = await prisma.user.findUnique({
    where: { id: input.sellerId },
  });
  if (!seller) {
    throw new Error('Seller not found');
  }

  const data: Prisma.ListingCreateInput = {
    title: input.title,
    description: input.description,
    productDescription: input.productDescription ?? null,
    priceCents: assertInteger(input.priceCents, 'priceCents'),
    quantity: input.quantity,
    unit: input.unit,
    category: input.category,
    location: input.location ?? null,
    images: input.images ?? [],
    video: input.video ?? null,
    isActive: input.isActive ?? true,
    isVerified: input.isVerified ?? Boolean(input.contractProductId),
    contractProductId: input.contractProductId ?? null,
    contractTxHash: input.contractTxHash ?? null,
    seller: { connect: { id: input.sellerId } },
  };
  const contractMetadata = normalizeContractMetadata(input.contractMetadata);
  if (contractMetadata !== undefined) {
    data.contractMetadata = contractMetadata;
  }

  const harvestDate = normalizeDate(input.harvestDate);
  if (harvestDate !== undefined) data.harvestDate = harvestDate;

  const expiryDate = normalizeDate(input.expiryDate);
  if (expiryDate !== undefined) data.expiryDate = expiryDate;

  const contractPrice = normalizeContractPrice(input.contractPrice);
  if (contractPrice !== undefined) data.contractPrice = contractPrice;

  const contractStock = normalizeContractStock(input.contractStock);
  if (contractStock !== undefined) data.contractStock = contractStock;

  if (input.contractProductId) {
    data.contractCreatedAt = new Date();
  }

  return prisma.listing.create({ data });
}

export async function updateListing(rawInput: unknown) {
  const input: UpdateListingInput = UpdateListing.parse(rawInput);

  const { id, sellerId, ...rest } = input;

  const existing = await prisma.listing.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error('Listing not found');
  }

  if (sellerId && existing.sellerId !== sellerId) {
    throw new Error('Forbidden');
  }

  const data: Prisma.ListingUpdateInput = {};

  if (rest.title !== undefined) data.title = rest.title;
  if (rest.description !== undefined) data.description = rest.description;
  if (rest.productDescription !== undefined) data.productDescription = rest.productDescription;
  if (rest.priceCents !== undefined) data.priceCents = assertInteger(rest.priceCents, 'priceCents');
  if (rest.quantity !== undefined) data.quantity = rest.quantity;
  if (rest.unit !== undefined) data.unit = rest.unit;
  if (rest.category !== undefined) data.category = rest.category;
  if (rest.location !== undefined) data.location = rest.location ?? null;
  if (rest.images !== undefined) data.images = rest.images;
  if (rest.video !== undefined) data.video = rest.video ?? null;
  if (rest.harvestDate !== undefined) data.harvestDate = normalizeDate(rest.harvestDate);
  if (rest.expiryDate !== undefined) data.expiryDate = normalizeDate(rest.expiryDate);
  if (rest.contractProductId !== undefined) data.contractProductId = rest.contractProductId ?? null;
  if (rest.contractTxHash !== undefined) data.contractTxHash = rest.contractTxHash ?? null;
  if (rest.contractPrice !== undefined) {
    const normalized = normalizeContractPrice(rest.contractPrice);
    data.contractPrice = normalized ?? null;
  }
  if (rest.contractStock !== undefined) {
    const normalized = normalizeContractStock(rest.contractStock);
    data.contractStock = normalized ?? null;
  }
  if (rest.contractMetadata !== undefined) {
    const normalizedMetadata = normalizeContractMetadata(rest.contractMetadata);
    data.contractMetadata = normalizedMetadata ?? Prisma.JsonNull;
  }
  if (rest.isActive !== undefined) data.isActive = rest.isActive;
  if (rest.isVerified !== undefined) data.isVerified = rest.isVerified;

  return prisma.listing.update({
    where: { id },
    data,
  });
}

export async function getListing(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: { seller: true },
  });
}

export async function listListings(params: {
  q?: string;
  sellerId?: string;
  activeOnly?: boolean;
  take?: number;
  skip?: number;
  cursor?: { id: string };
}) {
  const where: Prisma.ListingWhereInput = {};
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { category: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.sellerId) where.sellerId = params.sellerId;
  if (params.activeOnly) where.isActive = true;

  return prisma.listing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.take ?? 20,
    skip: params.skip ?? 0,
    cursor: params.cursor,
    include: { seller: true },
  });
}

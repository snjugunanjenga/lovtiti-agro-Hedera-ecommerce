import { Role } from '@prisma/client';
import { z } from 'zod';

const numberLike = z.union([z.string(), z.number()]);
const nullableNumberLike = numberLike.or(z.null());

const toInt = numberLike
  .transform((value) => {
    const parsed = typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10);
    return Number.isNaN(parsed) ? NaN : parsed;
  })
  .refine((value) => Number.isInteger(value), {
    message: 'Expected a whole number value',
  });

const toFloat = numberLike
  .transform((value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  })
  .refine((value) => Number.isFinite(value), {
    message: 'Expected a numeric value',
  });

const optionalDate = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  })
  .optional();

export const CreateUser = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).default(Role.BUYER),
});

export const CreateListing = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(1).max(5000),
  productDescription: z.string().max(5000).optional(),
  priceCents: toInt.refine((value) => value >= 0, {
    message: 'Price must be zero or greater',
  }),
  quantity: toFloat.refine((value) => value >= 0, {
    message: 'Quantity must be zero or greater',
  }),
  unit: z.string().min(1),
  category: z.string().min(1),
  location: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  video: z.string().url().optional(),
  sellerId: z.string().min(1),
  harvestDate: optionalDate,
  expiryDate: optionalDate,
  contractProductId: z.string().optional(),
  contractTxHash: z.string().optional(),
  contractPrice: nullableNumberLike.optional(),
  contractStock: nullableNumberLike.optional(),
  contractMetadata: z.unknown().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const UpdateListing = z.object({
  id: z.string().min(1),
  title: z.string().min(2).max(120).optional(),
  description: z.string().min(1).max(5000).optional(),
  productDescription: z.string().max(5000).optional(),
  priceCents: toInt
    .refine((value) => value >= 0, {
      message: 'Price must be zero or greater',
    })
    .optional(),
  quantity: toFloat
    .refine((value) => value >= 0, {
      message: 'Quantity must be zero or greater',
    })
    .optional(),
  unit: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  location: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
  sellerId: z.string().min(1).optional(),
  harvestDate: optionalDate,
  expiryDate: optionalDate,
  contractProductId: z.string().optional(),
  contractTxHash: z.string().optional(),
  contractPrice: nullableNumberLike.optional(),
  contractStock: nullableNumberLike.optional(),
  contractMetadata: z.unknown().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

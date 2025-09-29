import { z } from "zod";

export const kycSchema = z.object({
	fullName: z.string().min(3),
	country: z.string().min(2),
	address: z.string().min(5),
	idNumber: z.string().min(5),
	phone: z.string().min(7),
	hederaWallet: z.string().min(10),
	type: z.enum(["BUYER", "FARMER"]) as unknown as z.ZodEnum<["BUYER", "FARMER"]>,
});

export const listingSchema = z.object({
	title: z.string().min(3),
	description: z.string().min(10),
	priceCents: z.number().int().positive(),
	currency: z.string().default("USD"),
});

export type KycInput = z.infer<typeof kycSchema>;
export type ListingInput = z.infer<typeof listingSchema>;

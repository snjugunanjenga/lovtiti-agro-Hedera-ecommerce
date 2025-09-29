import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { kycSchema } from "@/utils/validators";

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const { userId } = auth();
		if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		const json = await req.json();
		const parsed = kycSchema.safeParse(json);
		if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

		const { fullName, country, address, idNumber, phone, hederaWallet, type } = parsed.data;

		// Find or create user by Clerk userId email is not stored here; using userId in profiles
		// For simplicity, ensure user exists
		const user = await prisma.user.upsert({
			where: { email: `${userId}@clerk.local` },
			create: { email: `${userId}@clerk.local`, role: type === "FARMER" ? "FARMER" : "BUYER" },
			update: {},
		});

		const profile = await prisma.profile.upsert({
			where: { userId_type: { userId: user.id, type } },
			create: { userId: user.id, type, fullName, country, address, idNumber, phone, hederaWallet, kycStatus: "PENDING" },
			update: { fullName, country, address, idNumber, phone, hederaWallet },
		});

		return NextResponse.json({ ok: true, profile });
	} catch (err) {
		console.error("KYC submit error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

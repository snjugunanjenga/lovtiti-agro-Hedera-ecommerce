import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		let authUser;
		try {
			authUser = requireUser();
		} catch {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(req.url);
		const type = url.searchParams.get("type") as "BUYER" | "FARMER" | null;
		if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

		const profile = await prisma.profile.findUnique({
			where: { userId_type: { userId: authUser.id, type } },
		});

		return NextResponse.json({ status: profile?.kycStatus ?? "NONE", profile });
	} catch (err) {
		console.error("KYC status error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

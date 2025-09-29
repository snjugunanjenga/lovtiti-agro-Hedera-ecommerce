import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const type = body?.type as string | undefined;
		const data = body?.data as any;

		if (!type || !data) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		if (type === "user.created" || type === "user.updated") {
			const primaryEmail: string | undefined = data?.email_addresses?.find((e: any) => e.id === data?.primary_email_address_id)?.email_address || data?.email_addresses?.[0]?.email_address;
			if (!primaryEmail) {
				return NextResponse.json({ error: "Missing email" }, { status: 400 });
			}

			await prisma.user.upsert({
				where: { email: primaryEmail },
				create: {
					email: primaryEmail,
					role: "BUYER",
				},
				update: {},
			});
		}

		if (type === "user.deleted") {
			const primaryEmail: string | undefined = data?.email_addresses?.[0]?.email_address;
			if (primaryEmail) {
				await prisma.user.deleteMany({ where: { email: primaryEmail } });
			}
		}

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("Clerk webhook error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

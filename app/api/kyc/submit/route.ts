import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { kycSchema } from "@/utils/validators";
import { requireUser } from "@/lib/auth-helpers";

export async function POST(req: Request) {
	try {
		let authUser;
		try {
			authUser = requireUser();
		} catch {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const json = await req.json();
		const parsed = kycSchema.safeParse(json);
		if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

		const { fullName, country, address, idNumber, phone, hederaWallet, type } = parsed.data;

		// Map the type to the correct role enum
		const roleMapping: Record<string, string> = {
			"BUYER": "BUYER",
			"FARMER": "FARMER",
			"DISTRIBUTOR": "DISTRIBUTOR", 
			"TRANSPORTER": "TRANSPORTER",
			"AGROEXPERT": "AGROEXPERT"
		};

		const userRole = roleMapping[type] || "FARMER";

		// Find or create user by Clerk userId email is not stored here; using userId in profiles
		// For simplicity, ensure user exists
		const user = await prisma.user.upsert({
			where: { id: authUser.id },
			create: { id: authUser.id, email: authUser.email, role: userRole as any },
			update: { role: userRole as any },
		});

		// Create profile with role-specific data
		const profile = await prisma.profile.upsert({
			where: { userId_type: { userId: user.id, type: type as any } },
			create: { 
				userId: user.id, 
				type: type as any, 
				fullName, 
				country, 
				address, 
				idNumber, 
				phone, 
				hederaWallet, 
				kycStatus: "PENDING" 
			},
			update: { 
				fullName, 
				country, 
				address, 
				idNumber, 
				phone, 
				hederaWallet,
				kycStatus: "PENDING" // Reset to pending when updating
			},
		});

		// Log role-specific KYC requirements for verification
		if (type === "DISTRIBUTOR") {
			const { businessLicense, warehouseCert, taxId, businessType, storageCapacity } = parsed.data;
			console.log("Distributor KYC:", { businessLicense, warehouseCert, taxId, businessType, storageCapacity });
		} else if (type === "TRANSPORTER") {
			const { vehicleRegistrations, insurancePolicy, drivingLicense, fleetSize, vehicleTypes } = parsed.data;
			console.log("Transporter KYC:", { vehicleRegistrations, insurancePolicy, drivingLicense, fleetSize, vehicleTypes });
		} else if (type === "VETERINARIAN") {
			const { professionalLicense, productSupplierPermits, agriculturalExpertiseCert, specialization, yearsOfExperience } = parsed.data;
			console.log("Veterinarian KYC:", { professionalLicense, productSupplierPermits, agriculturalExpertiseCert, specialization, yearsOfExperience });
		} else if (type === "FARMER") {
			const { landOwnership, certifications, farmSize, cropTypes } = parsed.data;
			console.log("Farmer KYC:", { landOwnership, certifications, farmSize, cropTypes });
		}

		return NextResponse.json({ ok: true, profile });
	} catch (err) {
		console.error("KYC submit error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

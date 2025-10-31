import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/utils/roleManager";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    let authUser;
    try {
      authUser = requireUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    
    if (
      !role ||
      !['FARMER', 'BUYER', 'DISTRIBUTOR', 'TRANSPORTER', 'VETERINARIAN', 'AGROEXPERT', 'ADMIN'].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedUser = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        role: role as any,
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        role: role as any,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log(`Role ${role} assigned to user ${authUser.id}`);

    return NextResponse.json({ 
      success: true, 
      message: `Role ${role} assigned successfully`,
      role: role as UserRole,
      user: updatedUser
    });

  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

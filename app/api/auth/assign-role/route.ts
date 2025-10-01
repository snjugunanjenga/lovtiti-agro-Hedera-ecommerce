import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/utils/roleManager";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    
    if (!role || !['FARMER', 'BUYER', 'DISTRIBUTOR', 'TRANSPORTER', 'VETERINARIAN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Update the user's role in Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    });

    // Update the user's role in your database
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: { role: role as any },
      create: {
        id: userId,
        email: "", // Will be updated by webhook
        role: role as any,
      }
    });

    console.log(`Role ${role} assigned to user ${userId} in both Clerk metadata and database`);

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

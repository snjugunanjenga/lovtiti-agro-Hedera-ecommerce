import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, public_metadata } = evt.data;
    
    console.log("User created:", {
      id,
      email: email_addresses[0]?.email_address,
      metadata: public_metadata
    });

    // In a real application, you would:
    // 1. Save the user to your database
    // 2. Set up their role-based permissions
    // 3. Send welcome emails
    // 4. Create their profile

    // For now, we'll just log the event
    console.log("User created successfully:", id);
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, public_metadata } = evt.data;
    
    console.log("User updated:", {
      id,
      email: email_addresses[0]?.email_address,
      metadata: public_metadata
    });

    // In a real application, you would:
    // 1. Update the user in your database
    // 2. Update their role-based permissions
    // 3. Sync any changes with your application state
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    console.log("User deleted:", id);

    // In a real application, you would:
    // 1. Soft delete or hard delete the user from your database
    // 2. Clean up any associated data
    // 3. Revoke any active sessions
  }

  return new Response("", { status: 200 });
}
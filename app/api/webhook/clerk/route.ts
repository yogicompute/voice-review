import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    if (!WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return new Response("Server misconfiguration", { status: 500 });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

  // ── user.created ───────────────────────────────────────────────────
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Create user row
    const [newUser] = await db
      .insert(users)
      .values({ clerkId: id, email, name, plan: "free" })
      .returning();

    // Create default free subscription row
    await db.insert(subscriptions).values({
      userId: newUser.id,
      plan: "free",
      reviewsPerMonth: 50,
      audioAccess: false,
      advancedMetrics: false,
      maxBusinesses: 1,
    });

    console.log(`Created user + subscription for ${email}`);
  }

  // ── user.updated ───────────────────────────────────────────────────
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await db
      .update(users)
      .set({ email, name, updatedAt: new Date() })
      .where(eq(users.clerkId, id));
  }

  // ── user.deleted ───────────────────────────────────────────────────
  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      // cascade deletes businesses + reviews + subscription
      await db.delete(users).where(eq(users.clerkId, id));
    }
  }

  return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
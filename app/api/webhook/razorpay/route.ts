import { NextResponse } from "next/server";
import { db, subscriptions, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { planLimits, PlanKey } from "@/lib/plans";

/**
 * Razorpay subscription webhook.
 * Configure in Razorpay Dashboard → Settings → Webhooks with events:
 *   subscription.activated, subscription.charged,
 *   subscription.cancelled, subscription.completed, subscription.halted
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let valid = false;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("Razorpay webhook config error:", err);
    return new NextResponse("Server misconfiguration", { status: 500 });
  }
  if (!valid) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: {
      subscription?: {
        entity?: {
          id?: string;
          notes?: Record<string, string>;
          current_start?: number | null;
          current_end?: number | null;
        };
      };
    };
  };

  const sub = event.payload?.subscription?.entity;
  const subId = sub?.id;
  const notesPlan = sub?.notes?.plan as PlanKey | undefined;
  const notesUserId = sub?.notes?.userId;

  if (!subId && !notesUserId) {
    return new NextResponse("OK", { status: 200 });
  }

  // Resolve the local subscription row by Razorpay subscription id, else by userId note.
  const row = subId
    ? await db.query.subscriptions.findFirst({
        where: eq(subscriptions.razorpaySubscriptionId, subId),
      })
    : notesUserId
      ? await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, notesUserId) })
      : undefined;

  const targetUserId = row?.userId ?? notesUserId;
  if (!targetUserId) return new NextResponse("OK", { status: 200 });

  const toDate = (s?: number | null) => (s ? new Date(s * 1000) : null);

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      const plan = notesPlan ?? (row?.plan as PlanKey) ?? "pro";
      await db
        .update(subscriptions)
        .set({
          ...planLimits(plan),
          razorpaySubscriptionId: subId ?? row?.razorpaySubscriptionId,
          status: "active",
          currentPeriodStart: toDate(sub?.current_start) ?? new Date(),
          currentPeriodEnd: toDate(sub?.current_end),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, targetUserId));
      await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, targetUserId));
      break;
    }

    case "subscription.halted":
    case "subscription.cancelled":
    case "subscription.completed": {
      // Downgrade to free.
      await db
        .update(subscriptions)
        .set({
          ...planLimits("free"),
          status: "cancelled",
          razorpaySubscriptionId: null,
          currentPeriodEnd: toDate(sub?.current_end),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, targetUserId));
      await db.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, targetUserId));
      break;
    }

    default:
      break;
  }

  return new NextResponse("OK", { status: 200 });
}

import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cancelSubscription } from "@/lib/razorpay";

export async function POST() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (!sub?.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    // Cancel at cycle end so the user keeps access until the period ends.
    await cancelSubscription(sub.razorpaySubscriptionId, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await db
    .update(subscriptions)
    .set({ status: "cancelling", updatedAt: new Date() })
    .where(eq(subscriptions.userId, user.id));

  // Note: limits/plan are downgraded by the webhook once the subscription
  // actually ends (subscription.cancelled / completed).
  return NextResponse.json({ success: true });
}

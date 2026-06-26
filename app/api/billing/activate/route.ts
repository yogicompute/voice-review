import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, subscriptions, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { planLimits, RAZORPAY_ENABLED, PlanKey } from "@/lib/plans";

/**
 * Instantly grants a plan WITHOUT payment.
 * Only works while the Razorpay feature flag is OFF (pre-launch).
 * Once NEXT_PUBLIC_RAZORPAY_ENABLED=true, this route is disabled and the
 * real Razorpay checkout flow must be used instead.
 */
export async function POST(req: Request) {
  if (RAZORPAY_ENABLED) {
    return NextResponse.json(
      { error: "Payments are live — use checkout." },
      { status: 403 },
    );
  }

  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: PlanKey };
  if (plan !== "free" && plan !== "pro" && plan !== "business") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const limits = planLimits(plan);

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        ...limits,
        status: "active",
        razorpaySubscriptionId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, user.id));
  } else {
    await db.insert(subscriptions).values({ userId: user.id, ...limits, status: "active" });
  }

  await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ success: true, plan });
}

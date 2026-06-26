import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, subscriptions, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { planLimits, PlanKey } from "@/lib/plans";

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
    plan?: PlanKey;
  };

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = body;

  if (
    !razorpay_payment_id ||
    !razorpay_subscription_id ||
    !razorpay_signature ||
    (plan !== "pro" && plan !== "business")
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const valid = verifyCheckoutSignature({
    razorpayPaymentId: razorpay_payment_id,
    razorpaySubscriptionId: razorpay_subscription_id,
    razorpaySignature: razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const limits = planLimits(plan);

  // Update the subscription row + mirror plan on the user.
  await db
    .update(subscriptions)
    .set({
      ...limits,
      razorpaySubscriptionId: razorpay_subscription_id,
      status: "active",
      currentPeriodStart: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, user.id));

  await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ success: true, plan });
}

import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { createSubscription } from "@/lib/razorpay";
import { getRazorpayPlanId, PlanKey } from "@/lib/plans";

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = (await req.json()) as { plan?: PlanKey };
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planId = getRazorpayPlanId(plan);
  if (!planId) {
    return NextResponse.json(
      { error: `Razorpay plan ID for "${plan}" is not configured.` },
      { status: 500 },
    );
  }

  try {
    const subscription = await createSubscription({
      planId,
      notes: { userId: user.id, plan, email: user.email },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      plan,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

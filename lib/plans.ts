export const PLANS = {
  free: {
    label: "Free",
    price: "₹0/mo",
    reviewsPerMonth: 50,
    audioAccess: false,
    advancedMetrics: false,
    maxBusinesses: 1,
    color: "gray",
  },
  pro: {
    label: "Pro",
    price: "₹1999/mo",
    reviewsPerMonth: 500,
    audioAccess: true,
    advancedMetrics: true,
    maxBusinesses: 5,
    color: "violet",
  },
  business: {
    label: "Business",
    price: "₹4999/mo",
    reviewsPerMonth: 5000,
    audioAccess: true,
    advancedMetrics: true,
    maxBusinesses: 20,
    color: "emerald",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: PlanKey) {
  return PLANS[plan];
}

export function canAccessAudio(plan: PlanKey) {
  return PLANS[plan].audioAccess;
}

export function canAccessAdvancedMetrics(plan: PlanKey) {
  return PLANS[plan].advancedMetrics;
}

export function canAddBusiness(plan: PlanKey, currentCount: number) {
  return currentCount < PLANS[plan].maxBusinesses;
}

// Feature flag: when false, plan changes are granted instantly without
// going through Razorpay checkout (useful before the gateway is live).
// Enable by setting NEXT_PUBLIC_RAZORPAY_ENABLED=true at deploy time.
export const RAZORPAY_ENABLED = process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true";

// Maps a paid plan to its Razorpay Plan ID (set in the Razorpay dashboard).
export function getRazorpayPlanId(plan: PlanKey): string | null {
  if (plan === "pro") return process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID ?? null;
  if (plan === "business") return process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID ?? null;
  return null;
}

// Server-side limits applied when a plan becomes active.
export function planLimits(plan: PlanKey) {
  return {
    plan,
    reviewsPerMonth: PLANS[plan].reviewsPerMonth,
    audioAccess: PLANS[plan].audioAccess,
    advancedMetrics: PLANS[plan].advancedMetrics,
    maxBusinesses: PLANS[plan].maxBusinesses,
  };
}
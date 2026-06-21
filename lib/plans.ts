export const PLANS = {
  free: {
    label: "Free",
    price: "$0/mo",
    reviewsPerMonth: 50,
    audioAccess: false,
    advancedMetrics: false,
    maxBusinesses: 1,
    color: "gray",
  },
  pro: {
    label: "Pro",
    price: "$19/mo",
    reviewsPerMonth: 500,
    audioAccess: true,
    advancedMetrics: true,
    maxBusinesses: 5,
    color: "violet",
  },
  business: {
    label: "Business",
    price: "$49/mo",
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
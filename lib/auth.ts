import { auth, currentUser } from "@clerk/nextjs/server";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";

// Returns the DB user row for the currently signed-in Clerk user
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  return user ?? null;
}

// Returns user + their subscription in one call
export async function getDbUserWithSub() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { subscription: true },
  });

  return user ?? null;
}

// Plan limit helpers
export const PLAN_LIMITS = {
  free:     { reviewsPerMonth: 50,   audioAccess: false, advancedMetrics: false, maxBusinesses: 1 },
  pro:      { reviewsPerMonth: 500,  audioAccess: true,  advancedMetrics: true,  maxBusinesses: 5 },
  business: { reviewsPerMonth: 5000, audioAccess: true,  advancedMetrics: true,  maxBusinesses: 20 },
} as const;
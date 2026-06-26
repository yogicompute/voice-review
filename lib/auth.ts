import { auth, currentUser } from "@clerk/nextjs/server";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";

// Returns the DB user row for the currently signed-in Clerk user.
// Falls back to creating the row (+ free subscription) if the Clerk
// webhook never fired (common in local dev), so dashboard pages never
// render blank due to a missing users row.
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (existing) return existing;

  // No row yet — provision one from the Clerk profile.
  const cu = await currentUser();
  const email = cu?.emailAddresses[0]?.emailAddress ?? "";
  const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || null;

  const [created] = await db
    .insert(users)
    .values({ clerkId: userId, email, name, plan: "free" })
    .returning();

  await db.insert(subscriptions).values({
    userId: created.id,
    plan: "free",
    reviewsPerMonth: 50,
    audioAccess: false,
    advancedMetrics: false,
    maxBusinesses: 1,
  });

  return created;
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
import { db, businesses, reviews } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export async function getOnboardingStatus(userId: string) {
  const bizList = await db.query.businesses.findMany({
    where: eq(businesses.userId, userId),
  });

  const hasBusiness = bizList.length > 0;
  const firstBusiness = bizList[0] ?? null;

  let hasReview = false;
  if (firstBusiness) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(reviews)
      .where(eq(reviews.businessId, firstBusiness.id));
    hasReview = value > 0;
  }

  return {
    hasBusiness,
    hasReview,
    firstBusiness,
    isComplete: hasBusiness && hasReview,
  };
}
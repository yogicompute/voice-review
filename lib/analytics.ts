import { db, reviews, businesses } from "@/lib/db";
import { eq, and, gte, desc, inArray } from "drizzle-orm";

export async function getBusinessAnalytics(businessId: string) {
  // Last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const allReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.businessId, businessId),
      eq(reviews.status, "completed"),
      gte(reviews.createdAt, since)
    ),
    orderBy: desc(reviews.createdAt),
  });

  // ── Summary stats ────────────────────────────────────────────────────
  const total = allReviews.length;
  const avgRating =
    total > 0
      ? allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total
      : 0;
  const avgReturnRate =
    total > 0
      ? allReviews.reduce((s, r) => s + (r.likelyReturnRate ?? 0), 0) / total
      : 0;
  const issueCount = allReviews.filter((r) => r.issueFlag).length;

  // ── Sentiment breakdown ──────────────────────────────────────────────
  const sentimentMap: Record<string, number> = {
    superhappy: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    angry: 0,
  };
  allReviews.forEach((r) => {
    if (r.sentiment) sentimentMap[r.sentiment] = (sentimentMap[r.sentiment] ?? 0) + 1;
  });
  const sentimentData = Object.entries(sentimentMap).map(([name, value]) => ({
    name,
    value,
  }));

  // ── Ratings over time (group by day) ────────────────────────────────
  const dayMap: Record<string, { total: number; count: number }> = {};
  allReviews.forEach((r) => {
    const day = new Date(r.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
    dayMap[day].total += r.rating ?? 0;
    dayMap[day].count += 1;
  });
  const ratingsOverTime = Object.entries(dayMap)
    .map(([date, { total, count }]) => ({
      date,
      avgRating: parseFloat((total / count).toFixed(2)),
      count,
    }))
    .reverse();

  // ── Return rate over time ────────────────────────────────────────────
  const returnRateOverTime = Object.entries(dayMap)
    .map(([date]) => {
      const dayReviews = allReviews.filter(
        (r) =>
          new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }) === date
      );
      const avg =
        dayReviews.reduce((s, r) => s + (r.likelyReturnRate ?? 0), 0) /
        dayReviews.length;
      return { date, returnRate: parseFloat(avg.toFixed(1)) };
    })
    .reverse();

  return {
    total,
    avgRating: parseFloat(avgRating.toFixed(2)),
    avgReturnRate: parseFloat(avgReturnRate.toFixed(1)),
    issueCount,
    sentimentData,
    ratingsOverTime,
    returnRateOverTime,
  };
}

export type BusinessAnalytics = Awaited<ReturnType<typeof getBusinessAnalytics>>;

/**
 * Aggregated analytics across ALL of a user's businesses (last 30 days).
 * Used on the dashboard overview.
 */
export async function getOverviewAnalytics(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.userId, userId),
    columns: { id: true },
  });
  const bizIds = userBusinesses.map((b) => b.id);

  const empty = {
    hasData: false,
    ratingsOverTime: [] as { date: string; avgRating: number; count: number }[],
    sentimentData: [] as { name: string; value: number }[],
  };
  if (bizIds.length === 0) return empty;

  const allReviews = await db.query.reviews.findMany({
    where: and(
      inArray(reviews.businessId, bizIds),
      eq(reviews.status, "completed"),
      gte(reviews.createdAt, since),
    ),
    orderBy: desc(reviews.createdAt),
  });

  if (allReviews.length === 0) return empty;

  // Sentiment breakdown
  const sentimentMap: Record<string, number> = {
    superhappy: 0, happy: 0, neutral: 0, sad: 0, angry: 0,
  };
  allReviews.forEach((r) => {
    if (r.sentiment) sentimentMap[r.sentiment] = (sentimentMap[r.sentiment] ?? 0) + 1;
  });
  const sentimentData = Object.entries(sentimentMap).map(([name, value]) => ({ name, value }));

  // Ratings over time (group by day)
  const dayKey = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dayMap: Record<string, { total: number; count: number }> = {};
  allReviews.forEach((r) => {
    const day = dayKey(r.createdAt);
    if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
    dayMap[day].total += r.rating ?? 0;
    dayMap[day].count += 1;
  });
  const ratingsOverTime = Object.entries(dayMap)
    .map(([date, { total, count }]) => ({
      date,
      avgRating: parseFloat((total / count).toFixed(2)),
      count,
    }))
    .reverse();

  return { hasData: true, ratingsOverTime, sentimentData };
}

export type OverviewAnalytics = Awaited<ReturnType<typeof getOverviewAnalytics>>;
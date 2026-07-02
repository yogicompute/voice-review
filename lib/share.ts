import { db, reviews, businesses } from "@/lib/db";
import { and, eq, inArray, desc } from "drizzle-orm";
import type { Review } from "@/lib/db";

const POSITIVE_SENTIMENTS = ["happy", "superhappy"];

/** A review worth showing off: completed, high rating, positive, no issues. */
export function isGlowingReview(r: {
  status: string;
  rating: number | null;
  sentiment: string | null;
  issueFlag: boolean | null;
}): boolean {
  return (
    r.status === "completed" &&
    (r.rating ?? 0) >= 4 &&
    !!r.sentiment &&
    POSITIVE_SENTIMENTS.includes(r.sentiment) &&
    !r.issueFlag
  );
}

/** A ready-to-post social caption for a glowing review. */
export function buildCaption(review: Review, businessName: string): string {
  const quote = review.summary?.trim();
  const stars = "⭐".repeat(Math.max(0, Math.min(5, review.rating ?? 5)));
  const lines = [
    `${stars} Another happy customer at ${businessName}!`,
    quote ? `\n"${quote}"` : "",
    `\nLeave your own voice review 👇`,
    `\n#${businessName.replace(/[^a-z0-9]+/gi, "")} #CustomerLove #VoiceReview`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Glowing reviews across all of a user's businesses (most recent first). */
export async function getGlowingReviews(userId: string, limit = 30) {
  const biz = await db.query.businesses.findMany({
    where: eq(businesses.userId, userId),
    columns: { id: true, name: true, logoUrl: true },
  });
  if (biz.length === 0) return [];

  const bizById = new Map(biz.map((b) => [b.id, b]));
  const bizIds = biz.map((b) => b.id);

  const rows = await db.query.reviews.findMany({
    where: and(
      inArray(reviews.businessId, bizIds),
      eq(reviews.status, "completed"),
    ),
    orderBy: desc(reviews.createdAt),
    limit: 200,
  });

  return rows
    .filter((r) => isGlowingReview(r))
    .slice(0, limit)
    .map((r) => ({ review: r, business: bizById.get(r.businessId)! }));
}

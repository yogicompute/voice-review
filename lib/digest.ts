import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, reviews, digests, type Digest } from "@/lib/db";
import { and, eq, gte, lt, desc } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Numeric weighting used to turn sentiment into a 0–100 score.
const SENTIMENT_WEIGHT: Record<string, number> = {
  superhappy: 100,
  happy: 75,
  neutral: 50,
  sad: 25,
  angry: 0,
};

interface PeriodStats {
  total: number;
  avgRating: number;
  sentimentScore: number;
  issueCount: number;
}

function summarize(rows: { rating: number | null; sentiment: string | null }[]): PeriodStats {
  const total = rows.length;
  if (total === 0) return { total: 0, avgRating: 0, sentimentScore: 0, issueCount: 0 };

  const avgRating = rows.reduce((s, r) => s + (r.rating ?? 0), 0) / total;
  const sentimentScore =
    rows.reduce((s, r) => s + (SENTIMENT_WEIGHT[r.sentiment ?? "neutral"] ?? 50), 0) / total;

  return {
    total,
    avgRating: parseFloat(avgRating.toFixed(2)),
    sentimentScore: Math.round(sentimentScore),
    issueCount: 0,
  };
}

interface AiNarrative {
  headline: string;
  topComplaint: string;
  topComplaintMentions: number;
  topPraise: string;
  topPraiseMentions: number;
  recommendation: string;
  retentionLift: number;
}

const NARRATIVE_PROMPT = `You are a customer-experience analyst. You are given this week's customer review summaries for a local business.
Cluster the feedback into themes and return ONLY a valid JSON object with exactly these fields:
{
  "headline": <one punchy sentence describing the week, max 18 words>,
  "topComplaint": <the single most common complaint theme as a short label, max 6 words; "None" if no complaints>,
  "topComplaintMentions": <integer count of reviews mentioning that complaint>,
  "topPraise": <the single most common praise theme as a short label, max 6 words; "None" if no praise>,
  "topPraiseMentions": <integer count of reviews mentioning that praise>,
  "recommendation": <one concrete action the owner should take this week, max 20 words>,
  "retentionLift": <integer 0-25, estimated % retention improvement if they act on the recommendation>
}
Rules: Return ONLY the JSON object, no markdown or backticks. Base counts on the data provided. Never invent themes not present.`;

async function generateNarrative(input: {
  complaints: string[];
  praise: string[];
  total: number;
}): Promise<AiNarrative> {
  const fallback: AiNarrative = {
    headline: `${input.total} review${input.total === 1 ? "" : "s"} collected this week.`,
    topComplaint: "None",
    topComplaintMentions: 0,
    topPraise: "None",
    topPraiseMentions: 0,
    recommendation: "Keep collecting reviews to unlock richer insights.",
    retentionLift: 0,
  };

  if (input.total === 0) return fallback;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const prompt = `${NARRATIVE_PROMPT}

Complaint summaries (${input.complaints.length}):
${input.complaints.map((c) => `- ${c}`).join("\n") || "- (none)"}

Praise summaries (${input.praise.length}):
${input.praise.map((p) => `- ${p}`).join("\n") || "- (none)"}

Total reviews this week: ${input.total}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim()) as Partial<AiNarrative>;

    return {
      headline: parsed.headline || fallback.headline,
      topComplaint: parsed.topComplaint || "None",
      topComplaintMentions: Math.max(0, Math.round(parsed.topComplaintMentions ?? 0)),
      topPraise: parsed.topPraise || "None",
      topPraiseMentions: Math.max(0, Math.round(parsed.topPraiseMentions ?? 0)),
      recommendation: parsed.recommendation || fallback.recommendation,
      retentionLift: Math.min(25, Math.max(0, Math.round(parsed.retentionLift ?? 0))),
    };
  } catch {
    return fallback;
  }
}

/**
 * Computes the weekly digest for a business and stores it.
 * Compares the last 7 days against the previous 7 days.
 */
export async function generateDigest(businessId: string): Promise<Digest> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    db.query.reviews.findMany({
      where: and(
        eq(reviews.businessId, businessId),
        eq(reviews.status, "completed"),
        gte(reviews.createdAt, weekAgo),
      ),
      orderBy: desc(reviews.createdAt),
    }),
    db.query.reviews.findMany({
      where: and(
        eq(reviews.businessId, businessId),
        eq(reviews.status, "completed"),
        gte(reviews.createdAt, twoWeeksAgo),
        lt(reviews.createdAt, weekAgo),
      ),
    }),
  ]);

  const cur = summarize(current);
  const prev = summarize(previous);

  const complaints = current
    .filter((r) => r.issueFlag || (r.rating ?? 5) <= 2)
    .map((r) => r.summary || r.transcript || "")
    .filter(Boolean);
  const praise = current
    .filter((r) => !r.issueFlag && (r.rating ?? 0) >= 4)
    .map((r) => r.summary || r.transcript || "")
    .filter(Boolean);

  const narrative = await generateNarrative({ complaints, praise, total: cur.total });

  const [digest] = await db
    .insert(digests)
    .values({
      businessId,
      periodStart: weekAgo,
      periodEnd: now,
      totalReviews: cur.total,
      prevTotalReviews: prev.total,
      avgRating: cur.avgRating,
      sentimentScore: cur.sentimentScore,
      sentimentDelta: cur.sentimentScore - prev.sentimentScore,
      issueCount: complaints.length,
      headline: narrative.headline,
      topComplaint: narrative.topComplaint,
      topComplaintMentions: narrative.topComplaintMentions,
      topPraise: narrative.topPraise,
      topPraiseMentions: narrative.topPraiseMentions,
      recommendation: narrative.recommendation,
      retentionLift: narrative.retentionLift,
    })
    .returning();

  return digest;
}

/**
 * Returns this week's digest, generating one only if none exists yet.
 * "This week" = a digest created within the last 7 days.
 */
export async function getOrCreateWeeklyDigest(
  businessId: string,
): Promise<{ digest: Digest; generated: boolean }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const existing = await db.query.digests.findFirst({
    where: and(eq(digests.businessId, businessId), gte(digests.createdAt, weekAgo)),
    orderBy: desc(digests.createdAt),
  });
  if (existing) return { digest: existing, generated: false };

  const digest = await generateDigest(businessId);
  return { digest, generated: true };
}

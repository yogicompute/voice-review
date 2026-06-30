import { NextResponse } from "next/server";
import { db, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";

// Status/result lookup for a review (used by the SDK / test console to poll
// after an async submission). Review IDs are unguessable nanoids.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
  });

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    reviewId: review.id,
    status: review.status,
    rating: review.rating,
    sentiment: review.sentiment,
    likelyReturnRate: review.likelyReturnRate,
    issueFlag: review.issueFlag,
    summary: review.summary,
    transcript: review.transcript,
    audioUrl: review.audioUrl,
    audioDuration: review.audioDuration,
  });
}

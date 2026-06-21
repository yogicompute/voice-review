import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, reviews } from "@/lib/db";
import { validateApiKey } from "@/lib/validateApiKeys";
import { uploadAudio } from "@/lib/cloudinary";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { analyzeReview } from "@/lib/ai/gemini";

export const maxDuration = 30; // Vercel: allow up to 30s for AI calls

export async function POST(req: Request) {
  try {
    // ── 1. Auth via API key ──────────────────────────────────────────
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing x-api-key header" },
        { status: 401 },
      );
    }

    const business = await validateApiKey(apiKey);
    if (!business) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 },
      );
    }

    // ── 2. Plan: check monthly review limit ──────────────────────────
    const sub = business.user?.subscription;
    const limit = sub?.reviewsPerMonth ?? 50;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const recentReviews = await db.query.reviews.findMany({
      where: (r, { eq, and, gte }) =>
        and(eq(r.businessId, business.id), gte(r.createdAt, startOfMonth)),
    });

    if (recentReviews.length >= limit) {
      return NextResponse.json(
        {
          error: `Monthly review limit of ${limit} reached. Upgrade your plan.`,
        },
        { status: 429 },
      );
    }

    // ── 3. Parse multipart form data ─────────────────────────────────
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const customerRef = formData.get("customerRef") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 },
      );
    }

    // Max 5MB guard
    if (audioFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 5MB)" },
        { status: 400 },
      );
    }

    // ── 4. Create a processing placeholder row immediately ───────────
    const [review] = await db
      .insert(reviews)
      .values({
        businessId: business.id,
        status: "processing",
        customerRef: customerRef ?? null,
      })
      .returning();

    // ── 5. Upload audio to Cloudinary ────────────────────────────────
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    let audioUrl: string | null = null;
    let audioDuration: number | null = null;

    try {
      const uploaded = await uploadAudio(
        audioBuffer,
        `voicereview/${business.id}`,
      );
      audioUrl = uploaded.url;
      audioDuration = uploaded.duration;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      // Continue even if upload fails — we still transcribe + analyze
    }

    // ── 6. Transcribe with Groq Whisper ──────────────────────────────
    let transcript = "";
    try {
      transcript = await transcribeAudio(audioBuffer);
      console.log("✅ Transcript:", transcript); // add this
    } catch (err) {
      console.error("❌ Transcription failed:", err); // already there
    }

    // ── 7. Analyze with Gemini Flash ─────────────────────────────────
    let metrics = {
      rating: 3,
      sentiment: "neutral",
      likelyReturnRate: 50,
      issueFlag: false,
      summary: "Could not analyze feedback",
    };

    console.log("Sending to Gemini, transcript length:", transcript.length); // add this
    try {
      metrics = await analyzeReview(transcript);
      console.log("✅ Gemini metrics:", metrics); // add this
    } catch (err) {
      console.error("❌ Gemini analysis failed:", err);
    }

    // ── 8. Update review row with all results ────────────────────────
    const [completed] = await db
      .update(reviews)
      .set({
        status: "completed",
        audioUrl,
        audioDuration,
        transcript,
        rating: metrics.rating,
        sentiment: metrics.sentiment as
          | "superhappy"
          | "happy"
          | "neutral"
          | "sad"
          | "angry",
        likelyReturnRate: metrics.likelyReturnRate,
        issueFlag: metrics.issueFlag,
        summary: metrics.summary,
        rawMetrics: JSON.stringify(metrics),
      })
      .where(eq(reviews.id, review.id))
      .returning();

    // ── 9. Return result to SDK ───────────────────────────────────────
    return NextResponse.json({
      reviewId: completed.id,
      rating: completed.rating,
      sentiment: completed.sentiment,
      likelyReturnRate: completed.likelyReturnRate,
      issueFlag: completed.issueFlag,
      summary: completed.summary,
    });
  } catch (err) {
    console.error("Review endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

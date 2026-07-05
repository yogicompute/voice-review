import { eq, and, gte, count } from "drizzle-orm";
import { NextResponse, after } from "next/server";
import { db, reviews } from "@/lib/db";
import { validateApiKey } from "@/lib/validateApiKeys";
import { uploadAudio } from "@/lib/cloudinary";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { analyzeReview } from "@/lib/ai/gemini";
import { QUEUE_ENABLED } from "@/lib/flags";
import { inngest } from "@/lib/inngest/client";

export const maxDuration = 30; // Vercel: allow up to 30s for AI calls

// The SDK is embedded on other businesses' sites, so browsers make a
// cross-origin request here. Allow it (the API key in the header is the auth).
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-api-key",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

// Preflight (browsers send OPTIONS before a POST with custom headers).
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  return withCors(await handlePost(req));
}


async function handlePost(req: Request): Promise<NextResponse> {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
    }

    // ── 1. Auth + body parse in parallel ─────────────────────────────
    const [business, formData] = await Promise.all([
      validateApiKey(apiKey),
      req.formData(),
    ]);

    if (!business) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 });
    }

    const audioFile = formData.get("audio") as File | null;
    const textInput = (formData.get("text") as string | null)?.trim() || null;
    const customerRef = formData.get("customerRef") as string | null;

    // A review can be left by voice (audio) OR by typing (text). Require one.
    if (!audioFile && !textInput) {
      return NextResponse.json({ error: "Provide either audio or text" }, { status: 400 });
    }
    if (audioFile && audioFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 5MB)" }, { status: 400 });
    }
    if (textInput && textInput.length > 2000) {
      return NextResponse.json({ error: "Feedback is too long (max 2000 characters)" }, { status: 400 });
    }

    // ── 2. Plan limit check (single remaining awaited DB query) ──────
    const limit = business.user?.subscription?.reviewsPerMonth ?? 50;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [{ value: monthCount }] = await db
      .select({ value: count() })
      .from(reviews)
      .where(and(eq(reviews.businessId, business.id), gte(reviews.createdAt, startOfMonth)));

    if (monthCount >= limit) {
      return NextResponse.json(
        { error: `Monthly review limit of ${limit} reached. Upgrade your plan.` },
        { status: 429 },
      );
    }

    // ── 3. Generate ID here; do NOT insert yet ───────────────────────
    const reviewId = crypto.randomUUID();

    // Buffer the audio now (already in memory after formData(); cheap).
    const audioBuffer = audioFile ? Buffer.from(await audioFile.arrayBuffer()) : null;

    // ── 4. Everything else, including the insert, runs in background ─
    after(async () => {
      try {
        // Insert placeholder row first so status polling works ASAP
        await db.insert(reviews).values({
          id: reviewId,
          businessId: business.id,
          status: "processing",
          customerRef: customerRef ?? null,
        });

        // ── Text review: no audio, no transcription — analyze directly ──
        if (!audioBuffer) {
          let metrics = {
            rating: 3,
            sentiment: "neutral",
            likelyReturnRate: 50,
            issueFlag: false,
            summary: "Could not analyze feedback",
          };
          try {
            metrics = await analyzeReview(textInput ?? "");
          } catch (err) {
            console.error("❌ Gemini analysis failed:", err);
          }

          await db
            .update(reviews)
            .set({
              status: "completed",
              transcript: textInput,
              rating: metrics.rating,
              sentiment: metrics.sentiment as
                | "superhappy" | "happy" | "neutral" | "sad" | "angry",
              likelyReturnRate: metrics.likelyReturnRate,
              issueFlag: metrics.issueFlag,
              summary: metrics.summary,
              rawMetrics: JSON.stringify(metrics),
            })
            .where(eq(reviews.id, reviewId));
          return;
        }

        // ── Voice review: upload audio, then transcribe + analyze ──
        let audioUrl: string | null = null;
        try {
          const uploaded = await uploadAudio(audioBuffer, `voicereview/${business.id}`);
          audioUrl = uploaded.url;
          await db
            .update(reviews)
            .set({ audioUrl, audioDuration: uploaded.duration })
            .where(eq(reviews.id, reviewId));
        } catch (err) {
          console.error("Cloudinary upload failed:", err);
        }

        if (QUEUE_ENABLED) {
          await inngest.send({
            name: "review/created",
            data: { reviewId, businessId: business.id, audioUrl },
          });
          return;
        }

        let transcript = "";
        try {
          transcript = await transcribeAudio(audioBuffer);
        } catch (err) {
          console.error("❌ Transcription failed:", err);
        }

        let metrics = {
          rating: 3,
          sentiment: "neutral",
          likelyReturnRate: 50,
          issueFlag: false,
          summary: "Could not analyze feedback",
        };
        try {
          metrics = await analyzeReview(transcript);
        } catch (err) {
          console.error("❌ Gemini analysis failed:", err);
        }

        await db
          .update(reviews)
          .set({
            status: "completed",
            transcript,
            rating: metrics.rating,
            sentiment: metrics.sentiment as
              | "superhappy" | "happy" | "neutral" | "sad" | "angry",
            likelyReturnRate: metrics.likelyReturnRate,
            issueFlag: metrics.issueFlag,
            summary: metrics.summary,
            rawMetrics: JSON.stringify(metrics),
          })
          .where(eq(reviews.id, reviewId));
      } catch (err) {
        console.error("Background review processing failed:", err);
        await db.update(reviews).set({ status: "failed" }).where(eq(reviews.id, reviewId));
      }
    });

    // ── 5. Respond immediately ───────────────────────────────────────
    return NextResponse.json({ reviewId, status: "processing" }, { status: 202 });
  } catch (err) {
    console.error("Review endpoint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { inngest } from "./client";
import { db, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import { transcribeAudio } from "@/lib/ai/transcribe";
import { analyzeReview } from "@/lib/ai/gemini";

/**
 * Processes a voice review in the background:
 *   fetch audio → transcribe (Whisper) → analyze (Gemini) → save.
 * Each step retries independently on failure.
 */
export const processReview = inngest.createFunction(
  { id: "process-review", retries: 3 },
  { event: "review/created" },
  async ({ event, step }) => {
    const { reviewId, audioUrl } = event.data;

    // 1. Transcribe (fetch the uploaded audio, then Whisper)
    const transcript = await step.run("transcribe", async () => {
      if (!audioUrl) return "";
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error(`Failed to fetch audio (${res.status})`);
      const buffer = Buffer.from(await res.arrayBuffer());
      return transcribeAudio(buffer);
    });

    // 2. Analyze with Gemini
    const metrics = await step.run("analyze", () => analyzeReview(transcript));

    // 3. Persist results
    await step.run("save", async () => {
      await db
        .update(reviews)
        .set({
          status: "completed",
          transcript,
          rating: metrics.rating,
          sentiment: metrics.sentiment,
          likelyReturnRate: metrics.likelyReturnRate,
          issueFlag: metrics.issueFlag,
          summary: metrics.summary,
          rawMetrics: JSON.stringify(metrics),
        })
        .where(eq(reviews.id, reviewId));
    });

    return { reviewId, ...metrics };
  },
);

export const inngestFunctions = [processReview];

"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceReviewButton, type ReviewResult } from "@/sdk/VoiceReviewButton";
import { StarRating } from "@/components/dashboard/StarRating";
import { SentimentBadge } from "@/components/dashboard/SentimentBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, AlertTriangle, FileText, CheckCircle2, Mic, Plus } from "lucide-react";

type Business = { id: string; name: string; apiKey: string };

type ReviewStatus = {
  reviewId: string;
  status: string;
  rating: number | null;
  sentiment: string | null;
  likelyReturnRate: number | null;
  issueFlag: boolean | null;
  summary: string | null;
  transcript: string | null;
};

type Panel =
  | { state: "idle" }
  | { state: "processing"; reviewId: string }
  | { state: "done"; result: ReviewStatus }
  | { state: "error"; message: string };

export function TestConsole({ businesses }: { businesses: Business[] }) {
  const [selectedId, setSelectedId] = useState(businesses[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>({ state: "idle" });
  const [attempt, setAttempt] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fresh customerRef per recording attempt.
  const customerRef = `test_${attempt}`;

  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function changeBusiness(id: string) {
    stopPolling();
    setSelectedId(id);
    setPanel({ state: "idle" });
    setAttempt((a) => a + 1);
  }

  function addAnother() {
    stopPolling();
    setPanel({ state: "idle" });
    setAttempt((a) => a + 1);
  }

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  function pollUntilDone(reviewId: string) {
    stopPolling();
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      // Give up after 90s
      if (Date.now() - started > 90_000) {
        stopPolling();
        setPanel({ state: "error", message: "Timed out waiting for analysis." });
        return;
      }
      try {
        const res = await fetch(`/api/review/${reviewId}`);
        if (!res.ok) return;
        const data = (await res.json()) as ReviewStatus;
        if (data.status === "completed") {
          stopPolling();
          setPanel({ state: "done", result: data });
        } else if (data.status === "failed") {
          stopPolling();
          setPanel({ state: "error", message: "Analysis failed. Check server logs." });
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
  }

  function handleSuccess(result: ReviewResult) {
    // Inline mode returns full metrics; queue mode returns just an id + processing.
    const hasMetrics =
      typeof result.rating === "number" && result.rating > 0 && result.sentiment;

    if (hasMetrics) {
      setPanel({
        state: "done",
        result: {
          reviewId: result.reviewId,
          status: "completed",
          rating: result.rating,
          sentiment: result.sentiment,
          likelyReturnRate: result.likelyReturnRate,
          issueFlag: result.issueFlag,
          summary: result.summary,
          transcript: null,
        },
      });
    } else if (result.reviewId) {
      setPanel({ state: "processing", reviewId: result.reviewId });
      pollUntilDone(result.reviewId);
    }
  }

  if (!business) return null;

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Business selector */}
      <div className="space-y-1.5">
        <label htmlFor="biz" className="text-sm font-medium">
          Testing for
        </label>
        <select
          id="biz"
          value={selectedId}
          onChange={(e) => changeBusiness(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* SDK button — keyed so it fully resets when business changes */}
      <div className="flex justify-center">
        <VoiceReviewButton
          key={`${business.id}-${attempt}`}
          apiKey={business.apiKey}
          businessId={business.id}
          customerRef={customerRef}
          maxDuration={30}
          showResultCard={false}
          theme={{ primary: "#059669", borderRadius: "16px" }}
          labels={{
            idle: "How was your experience?",
            recording: "Listening... tap to stop",
            processing: "Uploading your feedback...",
            success: "Thanks! See the analysis below.",
          }}
          onSuccess={handleSuccess}
          onError={(msg) => setPanel({ state: "error", message: msg })}
        />
      </div>

      {/* Result panel — mirrors the async pipeline */}
      {panel.state !== "idle" && (
        <Card>
          <CardContent className="space-y-3 py-4">
            {panel.state === "processing" && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 size={18} className="animate-spin text-primary" />
                <div>
                  <p className="font-medium text-foreground">Analyzing in background…</p>
                  <p className="text-xs">
                    Transcribing + scoring via the queue. This updates automatically.
                  </p>
                </div>
              </div>
            )}

            {panel.state === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle size={16} />
                {panel.message}
              </div>
            )}

            {panel.state === "done" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 size={16} /> Analysis complete
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StarRating rating={panel.result.rating ?? 0} />
                  {panel.result.sentiment && (
                    <SentimentBadge sentiment={panel.result.sentiment} />
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                    <RotateCcw size={11} />
                    {panel.result.likelyReturnRate ?? 0}% return rate
                  </span>
                  {panel.result.issueFlag && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                      <AlertTriangle size={11} /> Issue flagged
                    </span>
                  )}
                </div>

                {panel.result.summary && (
                  <p className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                    &ldquo;{panel.result.summary}&rdquo;
                  </p>
                )}

                {panel.result.transcript && (
                  <p className="flex gap-1.5 text-xs text-muted-foreground">
                    <FileText size={12} className="mt-0.5 shrink-0" />
                    {panel.result.transcript}
                  </p>
                )}

                <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground/70">
                  <Mic size={11} /> Review ID: {panel.result.reviewId}
                </p>
              </div>
            )}

            {(panel.state === "done" || panel.state === "error") && (
              <div className="border-t border-border pt-3">
                <Button variant="outline" size="sm" className="w-full" onClick={addAnother}>
                  <Plus size={14} /> Add another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { VoiceReviewButton } from "@/sdk/VoiceReviewButton";
import { CheckCircle2 } from "lucide-react";

export function PublicReview({
  apiKey,
  businessId,
  customerRef,
}: {
  apiKey: string;
  businessId: string;
  customerRef?: string;
}) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>
        <p className="text-lg font-semibold">Thank you!</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your feedback has been received. We really appreciate you taking the time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm">
      <VoiceReviewButton
        apiKey={apiKey}
        businessId={businessId}
        customerRef={customerRef}
        maxDuration={30}
        showResultCard={false}
        onSuccess={() => setDone(true)}
        theme={{ primary: "#059669", borderRadius: "16px" }}
        labels={{
          idle: "Tap to record your review",
          recording: "Listening… tap to stop",
          processing: "Saving your feedback…",
          success: "Thanks for your feedback!",
        }}
      />
    </div>
  );
}

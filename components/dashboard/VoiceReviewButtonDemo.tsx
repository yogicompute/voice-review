"use client";

import { VoiceReviewButton } from "@/sdk/VoiceReviewButton";

export function VoiceReviewButtonDemo({
  apiKey,
  businessId,
}: {
  apiKey: string;
  businessId: string;
}) {
  return (
    <VoiceReviewButton
      apiKey={apiKey}
      businessId={businessId}
      customerRef="test_order_001"
      maxDuration={30}
      onSuccess={(result) => console.log("Review result:", result)}
      onError={(err) => console.error("Error:", err)}
      theme={{
        primary: "#059669",
        borderRadius: "16px",
      }}
      labels={{
        idle: "How was your experience?",
        recording: "Listening... tap to stop",
        processing: "Analyzing your feedback...",
        success: "Thanks for your feedback!",
      }}
    />
  );
}
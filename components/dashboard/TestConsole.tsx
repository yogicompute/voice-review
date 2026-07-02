"use client";

import { useState } from "react";
import { VoiceReviewButton } from "@/sdk/VoiceReviewButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Plus } from "lucide-react";

type Business = { id: string; name: string; apiKey: string };

type Panel =
  | { state: "idle" }
  | { state: "done" }
  | { state: "error"; message: string };

export function TestConsole({ businesses }: { businesses: Business[] }) {
  const [selectedId, setSelectedId] = useState(businesses[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>({ state: "idle" });
  const [attempt, setAttempt] = useState(0);

  // Fresh customerRef per recording attempt.
  const customerRef = `test_${attempt}`;
  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  function reset() {
    setPanel({ state: "idle" });
    setAttempt((a) => a + 1);
  }

  function changeBusiness(id: string) {
    setSelectedId(id);
    reset();
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

      {/* Recorder — hidden once we show the thank-you card */}
      {panel.state === "idle" && (
        <VoiceReviewButton
          key={`${business.id}-${attempt}`}
          apiKey={business.apiKey}
          businessId={business.id}
          customerRef={customerRef}
          maxDuration={30}
          showResultCard={false}
          style={{ maxWidth: "100%", margin: "0 auto" }}
          theme={{ primary: "#059669", borderRadius: "16px" }}
          labels={{
            idle: "How was your experience?",
            recording: "Listening... tap to stop",
            processing: "Uploading your feedback...",
            success: "Thanks for your feedback!",
          }}
          onSuccess={() => setPanel({ state: "done" })}
          onError={(message) => setPanel({ state: "error", message })}
        />
      )}

      {/* Single result card */}
      {panel.state === "done" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle size={44} className="text-emerald-600" />
            <p className="text-base font-semibold">Thank you!</p>
            <p className="text-sm text-muted-foreground">Your feedback has been received.</p>
            <div className="mt-4 w-full border-t border-border pt-4">
              <Button variant="outline" size="sm" className="w-full" onClick={reset}>
                <Plus size={14} /> Add another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {panel.state === "error" && (
        <Card>
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={16} />
              {panel.message}
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={reset}>
              <Plus size={14} /> Try again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

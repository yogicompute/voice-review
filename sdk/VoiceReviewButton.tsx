"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Loader2, CheckCircle, XCircle, Star } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
export interface VoiceReviewButtonProps {
  apiKey: string;
  businessId: string;
  customerRef?: string;
  endpoint?: string;           // defaults to your hosted API
  maxDuration?: number;        // seconds, default 30
  onSuccess?: (result: ReviewResult) => void;
  onError?: (error: string) => void;
  showResultCard?: boolean;    // show the built-in metrics card (default true)
  className?: string;
  style?: React.CSSProperties;
  theme?: {
    primary?: string;
    background?: string;
    text?: string;
    borderRadius?: string;
  };
  labels?: {
    idle?: string;
    recording?: string;
    processing?: string;
    success?: string;
    error?: string;
  };
}

export interface ReviewResult {
  reviewId: string;
  rating: number;
  sentiment: string;
  likelyReturnRate: number;
  issueFlag: boolean;
  summary: string;
}

type Stage =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "error";

// ── Sentiment emoji map ────────────────────────────────────────────────
const SENTIMENT_EMOJI: Record<string, string> = {
  superhappy: "🤩",
  happy: "😊",
  neutral: "😐",
  sad: "😔",
  angry: "😠",
};

// The VoiceReview API base URL, baked in at build time from your app's
// NEXT_PUBLIC_APP_URL (see tsup.config.ts). This makes the SDK always post to
// YOUR domain, no matter which site it's embedded on. Falls back to the host
// page origin only if no base was configured at build time.
const API_BASE = (process.env.VOICEREVIEW_API_BASE ?? "").replace(/\/+$/, "");
const DEFAULT_ENDPOINT = API_BASE
  ? `${API_BASE}/api/review`
  : `${typeof window !== "undefined" ? window.location.origin : ""}/api/review`;

// ── Main component ─────────────────────────────────────────────────────
export function VoiceReviewButton({
  apiKey,
  businessId,
  customerRef,
  endpoint = DEFAULT_ENDPOINT,
  maxDuration = 30,
  onSuccess,
  onError,
  showResultCard = true,
  className = "",
  style = {},
  theme = {},
  labels = {},
}: VoiceReviewButtonProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  // ── Theme defaults ───────────────────────────────────────────────────
  const t = {
    primary: theme.primary ?? "#7c3aed",
    background: theme.background ?? "#ffffff",
    text: theme.text ?? "#111827",
    borderRadius: theme.borderRadius ?? "12px",
  };

  const l = {
    idle: labels.idle ?? "Leave a voice review",
    recording: labels.recording ?? "Recording... tap to stop",
    processing: labels.processing ?? "Analyzing your feedback...",
    success: labels.success ?? "Thank you for your feedback!",
    error: labels.error ?? "Something went wrong",
  };

  // ── Recording logic ───────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleUpload();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setStage("recording");
      setElapsed(0);

      // Elapsed timer
      elapsedRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);

      // Auto-stop at maxDuration
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, maxDuration * 1000);
    } catch (err) {
      setErrorMsg("Microphone access denied");
      setStage("error");
      onError?.("Microphone access denied");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setStage("processing");
  }

  function handleClick() {
    if (stage === "idle") startRecording();
    else if (stage === "recording") stopRecording();
    else if (stage === "success" || stage === "error") {
      setStage("idle");
      setResult(null);
      setErrorMsg("");
      setElapsed(0);
    }
  }

  // ── Upload + analyze ─────────────────────────────────────────────────
  async function handleUpload() {
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "review.webm");
      if (customerRef) formData.append("customerRef", customerRef);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setResult(data);
      setStage("success");
      onSuccess?.(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      setStage("error");
      onError?.(msg);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className={className}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        width: "100%",
        maxWidth: "360px",
        ...style,
      }}
    >
      <div
        style={{
          background: t.background,
          borderRadius: t.borderRadius,
          border: `1.5px solid ${stage === "recording" ? t.primary : "#e5e7eb"}`,
          padding: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          transition: "border-color 0.2s",
        }}
      >
        {/* ── Idle / Recording ── */}
        {(stage === "idle" || stage === "recording") && (
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "14px",
                color: t.text,
                marginBottom: "16px",
                fontWeight: 500,
              }}
            >
              {stage === "idle" ? l.idle : l.recording}
            </p>

            {/* Mic button */}
            <button
              onClick={handleClick}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                border: "none",
                background:
                  stage === "recording"
                    ? "#fee2e2"
                    : t.primary,
                color: stage === "recording" ? "#ef4444" : "#fff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow:
                  stage === "recording"
                    ? "0 0 0 8px rgba(239,68,68,0.15)"
                    : `0 0 0 0px ${t.primary}33`,
              }}
            >
              {stage === "recording" ? (
                <MicOff size={28} />
              ) : (
                <Mic size={28} />
              )}
            </button>

            {/* Elapsed timer */}
            {stage === "recording" && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#ef4444",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")} / {String(Math.floor(maxDuration / 60)).padStart(2, "0")}:
                {String(maxDuration % 60).padStart(2, "0")}
              </p>
            )}

            {/* Progress bar */}
            {stage === "recording" && (
              <div
                style={{
                  marginTop: "10px",
                  height: "3px",
                  background: "#f3f4f6",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(elapsed / maxDuration) * 100}%`,
                    background: "#ef4444",
                    borderRadius: "999px",
                    transition: "width 1s linear",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Processing ── */}
        {stage === "processing" && (
          <div
            style={{
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            <Loader2
              size={36}
              style={{
                color: t.primary,
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px",
                display: "block",
              }}
            />
            <p style={{ fontSize: "14px", color: t.text, fontWeight: 500 }}>
              {l.processing}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Success ── */}
        {stage === "success" && result && (
          <div style={{ textAlign: "center" }}>
            <CheckCircle
              size={32}
              style={{ color: "#10b981", margin: "0 auto 10px", display: "block" }}
            />
            <p style={{ fontSize: "14px", fontWeight: 600, color: t.text, marginBottom: "14px" }}>
              {l.success}
            </p>

            {/* Metrics card — only when enabled AND analysis is available
                (inline mode). In async/queue mode the host app shows results. */}
            {showResultCard && typeof result.rating === "number" && result.rating > 0 && (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "14px",
                textAlign: "left",
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    style={{
                      color: i < result.rating ? "#f59e0b" : "#d1d5db",
                      fill: i < result.rating ? "#f59e0b" : "none",
                    }}
                  />
                ))}
                <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "6px" }}>
                  {result.rating}/5
                </span>
              </div>

              {/* Sentiment + return rate */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "12px",
                    background: "#ede9fe",
                    color: "#7c3aed",
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {SENTIMENT_EMOJI[result.sentiment]} {result.sentiment}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    background: "#d1fae5",
                    color: "#065f46",
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {result.likelyReturnRate}% likely to return
                </span>
                {result.issueFlag && (
                  <span
                    style={{
                      fontSize: "12px",
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    ⚠️ issue flagged
                  </span>
                )}
              </div>

              {/* Summary */}
              {result.summary && (
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                  &ldquo;{result.summary}&rdquo;
                </p>
              )}
            </div>
            )}

            {showResultCard && (
              <button
                onClick={handleClick}
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Leave another review
              </button>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {stage === "error" && (
          <div style={{ textAlign: "center" }}>
            <XCircle
              size={32}
              style={{ color: "#ef4444", margin: "0 auto 10px", display: "block" }}
            />
            <p style={{ fontSize: "14px", fontWeight: 600, color: t.text, marginBottom: "6px" }}>
              {l.error}
            </p>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px" }}>
              {errorMsg}
            </p>
            <button
              onClick={handleClick}
              style={{
                fontSize: "13px",
                color: t.primary,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Powered by */}
        <p
          style={{
            fontSize: "10px",
            color: "#d1d5db",
            textAlign: "center",
            marginTop: "14px",
            marginBottom: 0,
          }}
        >
          powered by VoiceReview
        </p>
      </div>
    </div>
  );
}
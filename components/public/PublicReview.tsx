"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceReviewButton, type ReviewResult } from "@/sdk/VoiceReviewButton";
import { PartyOverlay, ConfettiBurst } from "@/components/public/PartyEffects";
import { CheckCircle2, Pencil, ArrowLeft, Loader2, Star } from "lucide-react";

// Once someone leaves a review on a device, we don't let them submit again for
// this window — stops one customer spamming five reviews in one sitting, while
// still letting a genuine repeat visitor review again on a later day.
const REVIEW_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
const storageKey = (businessId: string) => `vr_reviewed_${businessId}`;

const GOOGLE_REVIEW_URL = (placeId: string) =>
  `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

type Mode = "choose" | "type";

// Structured "type instead" options. Kept deliberately short — one required
// rating, one optional recommend question, and a free-text box.
const EXPERIENCE = [
  { value: "Excellent", emoji: "🤩" },
  { value: "Good", emoji: "🙂" },
  { value: "Okay", emoji: "😐" },
  { value: "Poor", emoji: "😞" },
] as const;

const RECOMMEND = ["Yes", "Maybe", "No"] as const;

export function PublicReview({
  apiKey,
  businessId,
  customerRef,
  googlePlaceId,
  accentColor = "#7fa7cf",
  endpoint,
}: {
  apiKey: string;
  businessId: string;
  customerRef?: string;
  googlePlaceId?: string | null;
  accentColor?: string;
  endpoint?: string;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [done, setDone] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Draft text for the "Post on Google" clipboard helper.
  const [googleDraft, setGoogleDraft] = useState<string>("");
  const [reviewId, setReviewId] = useState<string | null>(null);

  // Easter eggs: party mode 3s into recording, confetti + vibration on stop.
  const [party, setParty] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const partyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reviewEndpoint = endpoint ?? "/api/review";

  // ── localStorage dedup (mobile-only audience → localStorage is enough) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(businessId));
      if (raw && Date.now() - Number(raw) < REVIEW_COOLDOWN_MS) {
        // Reading localStorage must happen post-mount to avoid a hydration
        // mismatch, so this one-time setState in an effect is intentional.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAlreadyReviewed(true);
      }
    } catch {
      // Private mode / storage disabled — fail open, allow the review.
    }
  }, [businessId]);

  useEffect(() => {
    return () => {
      if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, []);

  const markReviewed = useCallback(() => {
    try {
      localStorage.setItem(storageKey(businessId), String(Date.now()));
    } catch {
      /* ignore */
    }
  }, [businessId]);

  function handleRecordingStart() {
    // Party mode kicks in 3 seconds into the recording — the mic keeps going.
    partyTimerRef.current = setTimeout(() => setParty(true), 3000);
  }

  function handleRecordingEnd() {
    if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
    setParty(false);
    // Celebrate the finish: a buzz in the hand + confetti on screen.
    try {
      navigator.vibrate?.([90, 40, 150]);
    } catch {
      /* unsupported (e.g. iOS Safari) — confetti still plays */
    }
    setConfetti(true);
    confettiTimerRef.current = setTimeout(() => setConfetti(false), 3200);
  }

  // After a successful review, poll for the completed transcript/summary so the
  // "Post on Google" button can pre-fill a clean draft to paste.
  useEffect(() => {
    if (!done || !reviewId || !googlePlaceId) return;
    let cancelled = false;
    let tries = 0;

    async function poll() {
      while (!cancelled && tries < 8) {
        tries++;
        try {
          const res = await fetch(`${reviewEndpoint}/${reviewId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed") {
              const draft = (data.summary || data.transcript || "").trim();
              if (draft && !cancelled) setGoogleDraft(draft);
              return;
            }
          }
        } catch {
          /* keep polling */
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [done, reviewId, googlePlaceId, reviewEndpoint]);

  function handleSuccess(result?: ReviewResult, localDraft?: string) {
    if (result?.reviewId) setReviewId(result.reviewId);
    if (localDraft) setGoogleDraft(localDraft);
    markReviewed();
    setDone(true);
  }

  // ── Pick the state content; overlays render across every state ───────
  let content: React.ReactNode;

  if (alreadyReviewed && !done) {
    content = (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>
        <p className="text-lg font-semibold text-slate-900">
          You&apos;ve already shared feedback
        </p>
        <p className="max-w-xs text-sm text-slate-500">
          Thanks for reviewing us recently — we&apos;ve got it. Come back and tell us
          about your next visit!
        </p>
      </div>
    );
  } else if (done) {
    content = (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>
        <p className="text-lg font-semibold text-slate-900">Thank you!</p>
        <p className="max-w-xs text-sm text-slate-500">
          Your feedback has been received. We really appreciate you taking the time.
        </p>

        {googlePlaceId ? (
          <PostOnGoogle placeId={googlePlaceId} draft={googleDraft} />
        ) : null}
      </div>
    );
  } else if (mode === "type") {
    content = (
      <TypeForm
        apiKey={apiKey}
        customerRef={customerRef}
        endpoint={reviewEndpoint}
        accentColor={accentColor}
        onBack={() => setMode("choose")}
        onSuccess={handleSuccess}
      />
    );
  } else {
    content = (
      <div className="text-center">
        <VoiceReviewButton
          apiKey={apiKey}
          businessId={businessId}
          customerRef={customerRef}
          endpoint={endpoint}
          maxDuration={30}
          showResultCard={false}
          style={{ margin: "0 auto" }}
          onSuccess={(r) => handleSuccess(r)}
          onRecordingStart={handleRecordingStart}
          onRecordingEnd={handleRecordingEnd}
          theme={{ primary: accentColor, borderRadius: "16px" }}
          labels={{
            idle: "Tap to record your review",
            recording: "Listening… tap to stop",
            processing: "Saving your feedback…",
            success: "Thanks for your feedback!",
          }}
        />

        <button
          onClick={() => setMode("type")}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <Pencil size={13} /> Prefer to type instead?
        </button>
      </div>
    );
  }

  return (
    <>
      <PartyOverlay show={party} />
      <ConfettiBurst show={confetti} />
      {content}
    </>
  );
}

// ── Structured type-instead form ───────────────────────────────────────
function TypeForm({
  apiKey,
  customerRef,
  endpoint,
  accentColor,
  onBack,
  onSuccess,
}: {
  apiKey: string;
  customerRef?: string;
  endpoint: string;
  accentColor: string;
  onBack: () => void;
  onSuccess: (result?: ReviewResult, localDraft?: string) => void;
}) {
  const [experience, setExperience] = useState<string>("");
  const [recommend, setRecommend] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Selected-state styling derived from the business's brand color.
  const activeStyle = {
    borderColor: accentColor,
    color: accentColor,
    background: `${accentColor}14`,
    boxShadow: `0 0 0 1px ${accentColor}`,
  };

  async function submit() {
    setError("");
    if (!experience) {
      setError("Please pick how your experience was.");
      return;
    }

    // Compose the selections + comment into a single natural-language string
    // the same AI pipeline can analyze, exactly like a voice transcript.
    const parts = [`Overall experience: ${experience}.`];
    if (recommend) parts.push(`Would recommend: ${recommend}.`);
    if (comment.trim()) parts.push(`Comments: ${comment.trim()}`);
    const text = parts.join(" ");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("text", text);
      if (customerRef) fd.append("customerRef", customerRef);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // The clean draft for Google is what the customer actually typed.
      onSuccess(data, comment.trim() || text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="text-left">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft size={14} /> Back to voice
      </button>

      {/* Experience — required */}
      <p className="mb-2 text-sm font-medium text-slate-800">How was your experience?</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {EXPERIENCE.map((opt) => {
          const active = experience === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExperience(opt.value)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-slate-300"
              style={active ? activeStyle : undefined}
            >
              <span className="text-base">{opt.emoji}</span>
              {opt.value}
            </button>
          );
        })}
      </div>

      {/* Recommend — optional */}
      <p className="mb-2 text-sm font-medium text-slate-800">Would you recommend us?</p>
      <div className="mb-5 flex gap-2">
        {RECOMMEND.map((r) => {
          const active = recommend === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRecommend(active ? "" : r)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300"
              style={active ? activeStyle : undefined}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Free text — optional */}
      <p className="mb-2 text-sm font-medium text-slate-800">
        Tell us more <span className="font-normal text-slate-400">(optional)</span>
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What did you love? What could we do better?"
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400"
      />

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: accentColor }}
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Submit feedback
      </button>
    </div>
  );
}

// ── Post-on-Google button (shown to everyone; no review-gating) ────────
function PostOnGoogle({ placeId, draft }: { placeId: string; draft: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      if (draft) {
        await navigator.clipboard.writeText(draft);
        setCopied(true);
      }
    } catch {
      /* clipboard may be blocked — still open Google */
    }
    window.open(GOOGLE_REVIEW_URL(placeId), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-5 w-full border-t border-slate-100 pt-5">
      <p className="mb-3 text-sm text-slate-500">
        Enjoyed your visit? Help others find us —{" "}
        <span className="font-medium text-slate-800">share it on Google.</span>
      </p>
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        <Star size={15} className="fill-amber-400 text-amber-400" />
        Post a review on Google
      </button>
      {copied && draft && (
        <p className="mt-2 text-center text-xs text-emerald-600">
          Your feedback was copied — just paste it on Google ✨
        </p>
      )}
    </div>
  );
}

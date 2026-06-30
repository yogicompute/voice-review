"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertTriangle,
  ThumbsUp,
  Target,
  Settings2,
  Check,
} from "lucide-react";
import type { Digest } from "@/lib/db";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface BusinessLite {
  id: string;
  name: string;
  digestEnabled: boolean;
  digestEmail: string | null;
}

export function DigestPanel({
  business,
  latest,
  reviewCount,
  ownerEmail,
}: {
  business: BusinessLite;
  latest: Digest | null;
  reviewCount: number;
  ownerEmail: string;
}) {
  const noReviews = reviewCount === 0;
  const router = useRouter();
  const [busy, setBusy] = useState<"gen" | "send" | "save" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [enabled, setEnabled] = useState(business.digestEnabled);
  const [email, setEmail] = useState(business.digestEmail ?? "");

  // Creates a fresh digest from this week's reviews.
  async function generate() {
    setBusy("gen");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/digests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  // Emails the latest existing digest — does NOT regenerate.
  async function emailLatest() {
    setBusy("send");
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/digests/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (data.delivery?.email) setNotice(`Emailed to ${email || ownerEmail}.`);
      else setError(data.delivery?.error ?? "Could not send email.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function saveSettings() {
    setBusy("save");
    setError("");
    try {
      const res = await fetch("/api/digests/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          digestEnabled: enabled,
          digestEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const delta = latest?.sentimentDelta ?? 0;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold tracking-tight">{business.name}</h3>
            <p className="text-xs text-muted-foreground">
              {latest
                ? `Last digest ${formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}`
                : "No digest generated yet"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowSettings((s) => !s)}
              aria-label="Digest settings"
            >
              <Settings2 size={15} />
            </Button>
            <Button
              size="sm"
              onClick={generate}
              disabled={busy !== null || noReviews}
              title={noReviews ? "No reviews yet" : undefined}
            >
              {busy === "gen" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {latest ? "Regenerate" : "Generate now"}
            </Button>
          </div>
        </div>

        {/* Latest digest */}
        {latest ? (
          <>
            {latest.headline && (
              <p className="rounded-lg bg-accent/50 px-4 py-3 text-sm font-medium text-accent-foreground">
                {latest.headline}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Reviews" value={String(latest.totalReviews)} sub={`prev ${latest.prevTotalReviews}`} />
              <Stat
                label="Sentiment"
                value={`${Math.round(latest.sentimentScore)}`}
                sub={
                  <span className={cn("inline-flex items-center gap-0.5", deltaColor)}>
                    <DeltaIcon size={11} /> {Math.abs(Math.round(delta))} pts
                  </span>
                }
              />
              <Stat label="Avg rating" value={latest.avgRating.toFixed(1)} icon={<Star size={12} className="text-amber-400" />} />
              <Stat label="Issues" value={String(latest.issueCount)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Insight
                icon={<AlertTriangle size={14} className="text-amber-600" />}
                label="Top complaint"
                value={latest.topComplaint && latest.topComplaint !== "None" ? latest.topComplaint : "None 🎉"}
                mentions={latest.topComplaintMentions ?? 0}
              />
              <Insight
                icon={<ThumbsUp size={14} className="text-emerald-600" />}
                label="Top praise"
                value={latest.topPraise && latest.topPraise !== "None" ? latest.topPraise : "—"}
                mentions={latest.topPraiseMentions ?? 0}
              />
            </div>

            {latest.recommendation && (
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-accent/40 px-4 py-3">
                <Target size={16} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-sm">
                  <span className="font-medium">Do this: </span>
                  {latest.recommendation}
                  {latest.retentionLift ? (
                    <span className="font-semibold text-primary"> → +{latest.retentionLift}% retention</span>
                  ) : null}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={emailLatest}
              disabled={busy !== null || noReviews}
              title={noReviews ? "No reviews yet" : undefined}
            >
              {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : null}
              Email me this digest
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {noReviews
                ? "No reviews yet — collect at least one voice review to generate a digest."
                : "Generate your first weekly digest to see top complaints, praise, and a recommended action."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={emailLatest}
              disabled={busy !== null || noReviews}
              title={noReviews ? "No reviews yet" : undefined}
            >
              {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : null}
              Generate &amp; email me
            </Button>
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="space-y-4 border-t border-border pt-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Weekly auto-send</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className={cn(
                  "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                  enabled ? "bg-primary" : "bg-input",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full bg-white shadow-sm transition-transform",
                    enabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor={`email-${business.id}`}>Email recipient</Label>
              <Input
                id={`email-${business.id}`}
                type="email"
                placeholder={ownerEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank to use your account email ({ownerEmail}).</p>
            </div>

            <Button size="sm" onClick={saveSettings} disabled={busy !== null}>
              {busy === "save" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <Check size={14} />
              ) : null}
              {saved ? "Saved" : "Save settings"}
            </Button>
          </div>
        )}

        {notice && <p className="text-sm text-emerald-600">{notice}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xl font-bold tracking-tight">
        {icon}
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Insight({
  icon,
  label,
  value,
  mentions,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mentions: number;
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-medium">
        {value}
        {mentions > 0 && <span className="text-muted-foreground"> · {mentions} mentions</span>}
      </p>
    </div>
  );
}

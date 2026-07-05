"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageBackground, isDark } from "@/lib/color";
import {
  Loader2,
  Upload,
  Check,
  Mic,
  ExternalLink,
  Building2,
  Palette,
  MessageSquareHeart,
  ImageIcon,
} from "lucide-react";

const PRESETS = [
  "#7fa7cf", // default brand blue (gradient renders as #dfe9f3 → white)
  "#059669", // emerald
  "#7c3aed", // violet
  "#e11d48", // rose
  "#d97706", // amber
  "#0f172a", // midnight
];

type Biz = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  reviewPageStyle: string;
  reviewPageColor: string;
  reviewPageMessage: string | null;
};

export function CustomizeForm({ business }: { business: Biz }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [style, setStyle] = useState<"gradient" | "solid">(
    business.reviewPageStyle === "solid" ? "solid" : "gradient"
  );
  const [color, setColor] = useState(business.reviewPageColor || "#7fa7cf");
  const [message, setMessage] = useState(business.reviewPageMessage ?? "");
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Gradients are always light pastels; only a solid dark color flips the text.
  const dark = style === "solid" && isDark(color);
  const previewBg = pageBackground(style, color);

  async function uploadLogo(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/businesses/${business.id}/logo`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setLogoUrl(data.logoUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewPageStyle: style,
          reviewPageColor: color,
          reviewPageMessage: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* ── Left: controls ─────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon size={15} /> Business logo
            </CardTitle>
            <CardDescription>
              Shown beside your name on the dashboard and on your review page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={business.name}
                className="size-16 rounded-2xl object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
                <Building2 size={22} className="text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 size={13} className="mr-2 animate-spin" />
                ) : (
                  <Upload size={13} className="mr-2" />
                )}
                {logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP or SVG · max 2MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Background */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette size={15} /> Background
            </CardTitle>
            <CardDescription>Pick a style and a brand color.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {(["gradient", "solid"] as const).map((s) => {
                const active = style === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`relative overflow-hidden rounded-xl border p-0.5 text-left transition-all ${
                      active
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className="h-14 w-full rounded-[10px]"
                      style={{ background: pageBackground(s, color) }}
                    />
                    <p className="px-2.5 py-2 text-sm font-medium capitalize">{s}</p>
                    {active && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Brand color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setColor(p)}
                    aria-label={`Use ${p}`}
                    className={`size-8 rounded-full transition-transform hover:scale-110 ${
                      color.toLowerCase() === p ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ background: p }}
                  />
                ))}
                <label className="relative ml-1 flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-muted-foreground/40 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  +
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Custom color"
                  />
                </label>
                <code className="ml-1 text-xs text-muted-foreground">{color}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareHeart size={15} /> Message for customers
            </CardTitle>
            <CardDescription>
              The greeting under your business name. Leave empty for the default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Input
              value={message}
              maxLength={120}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How was your experience?"
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/120</p>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : saved ? (
              <Check size={14} className="mr-2" />
            ) : null}
            {saved ? "Saved!" : "Save changes"}
          </Button>
          <Button variant="outline" asChild>
            <a href={`/r/${business.slug}`} target="_blank" rel="noopener noreferrer">
              View live page <ExternalLink size={13} className="ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* ── Right: live preview ────────────────────────────────────── */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div
          className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border-4 border-slate-900 shadow-xl"
          style={{ background: previewBg }}
        >
          <div className="flex flex-col items-center px-5 pb-8 pt-10 text-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-12 rounded-xl object-cover shadow-md ring-2 ring-white/40"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl bg-white shadow-md">
                <Mic size={18} style={{ color }} />
              </div>
            )}
            <p
              className={`mt-3 text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}
            >
              {business.name}
            </p>
            <p className={`mt-1 text-xs ${dark ? "text-white/75" : "text-slate-700"}`}>
              {message.trim() || "How was your experience?"}
            </p>

            <div className="mt-5 w-full rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-[11px] font-medium text-slate-600">
                Tap to record your review
              </p>
              <div
                className="mx-auto mt-3 flex size-12 items-center justify-center rounded-full text-white shadow"
                style={{ background: color }}
              >
                <Mic size={18} />
              </div>
              <p className="mt-3 text-[9px] text-slate-400">powered by VoiceReview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Restaurant", "Salon", "Gym", "Clinic",
  "Retail", "Hotel", "Cafe", "Auto repair", "Other",
];

// Letters and spaces only.
const NAME_RE = /^[A-Za-z][A-Za-z ]*$/;

type Created = { id: string; slug: string; name: string };

export default function NewBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    customCategory: "",
    googlePlaceId: "",
  });

  const isOther = form.category === "Other";

  function handleName(value: string) {
    // Strip anything that isn't a letter or space as the user types.
    const cleaned = value.replace(/[^A-Za-z ]/g, "");
    setForm((f) => ({ ...f, name: cleaned }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const category = (isOther ? form.customCategory : form.category).trim();

    // Client-side validation
    if (name.length < 2 || !NAME_RE.test(name)) {
      setError("Business name can only contain letters and spaces.");
      return;
    }
    if (!form.category) {
      setError("Please select a category.");
      return;
    }
    if (isOther && category.length < 2) {
      setError("Please enter your category.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        googlePlaceId: form.googlePlaceId.trim() || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
      return;
    }

    // Show a one-time success screen with a link to preview the live page.
    setCreated({ id: data.id, slug: data.slug, name: data.name });
  }

  // ── Post-creation success screen (only shown right after creating) ──
  if (created) {
    return (
      <div className="max-w-lg space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{created.name} is live! 🎉</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your feedback page is ready. Take a look at exactly what your
                customers will see when they scan your QR.
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <a href={`/r/${created.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye size={16} className="mr-2" />
                Preview feedback page
                <ExternalLink size={14} className="ml-2 opacity-70" />
              </a>
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/dashboard/businesses/${created.id}`)}
            >
              Continue to setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/businesses">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Register a business</h2>
          <p className="text-muted-foreground text-sm">You&apos;ll get API credentials after registering.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business details</CardTitle>
          <CardDescription>This info appears on your review dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                placeholder="e.g. Joes Barbershop"
                value={form.name}
                onChange={(e) => handleName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Letters and spaces only.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {isOther && (
              <div className="space-y-1.5">
                <Label htmlFor="customCategory">
                  Enter your category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customCategory"
                  placeholder="e.g. Pet grooming"
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="googlePlaceId">
                Google Place ID{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="googlePlaceId"
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={form.googlePlaceId}
                onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enables a &quot;Post on Google&quot; button on your review page. You can
                add this later.{" "}
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Find your Place ID
                </a>
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
              Register business
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

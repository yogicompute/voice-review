"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Restaurant", "Salon", "Gym", "Clinic",
  "Retail", "Hotel", "Cafe", "Auto repair", "Other",
];

// Letters and spaces only.
const NAME_RE = /^[A-Za-z][A-Za-z ]*$/;

export default function NewBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", customCategory: "" });

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
      body: JSON.stringify({ name, category }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
      return;
    }

    router.push(`/dashboard/businesses/${data.id}`);
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

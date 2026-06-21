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

export default function NewBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
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
          <h2 className="text-2xl font-semibold">Register a business</h2>
          <p className="text-gray-500 text-sm">You'll get API credentials after registering.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business details</CardTitle>
          <CardDescription>This info appears on your review dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                placeholder="e.g. Joe's Barbershop"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
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
"use client";

import { useState } from "react";
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
import {
  MapPin,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Pencil,
} from "lucide-react";

// Edit button hidden for now (kept in code intentionally — flip to true to
// bring it back).
const SHOW_EDIT_PLACE_ID_BUTTON = false;

export function GooglePlaceIdCard({
  businessId,
  googlePlaceId,
}: {
  businessId: string;
  googlePlaceId: string | null;
}) {
  const router = useRouter();
  const configured = Boolean(googlePlaceId);

  const [editing, setEditing] = useState(!configured);
  const [value, setValue] = useState(googlePlaceId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googlePlaceId: value.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not save");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // ── Configured + not editing: confirmation state ──────────────────────
  if (configured && !editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin size={15} /> Google reviews
          </CardTitle>
          <CardDescription>
            The &quot;Post on Google&quot; button is live on your review page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40">
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="truncate">
              Connected · <code className="font-mono text-xs">{googlePlaceId}</code>
            </span>
          </div>
          {SHOW_EDIT_PLACE_ID_BUTTON && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil size={13} className="mr-2" />
              Edit Place ID
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Not configured (step remaining) or editing ───────────────────────
  return (
    <Card className={!configured ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10" : undefined}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin size={15} />
          {configured ? "Edit Google Place ID" : "1 step remaining"}
        </CardTitle>
        <CardDescription>
          {configured
            ? "Update the Place ID used for the Post on Google button."
            : "Add your Google Place ID to turn on the “Post on Google” button on your review page — happy customers can share their feedback publicly in one tap."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
        />
        <p className="text-xs text-muted-foreground">
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-foreground"
          >
            Find your Place ID <ExternalLink size={11} />
          </a>
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !value.trim()}>
            {saving && <Loader2 size={13} className="mr-2 animate-spin" />}
            Save Place ID
          </Button>
          {configured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue(googlePlaceId ?? "");
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

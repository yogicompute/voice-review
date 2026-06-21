"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const SENTIMENTS = [
  { value: "",           label: "All"        },
  { value: "superhappy", label: "🤩 Super happy" },
  { value: "happy",      label: "😊 Happy"   },
  { value: "neutral",    label: "😐 Neutral"  },
  { value: "sad",        label: "😔 Sad"      },
  { value: "angry",      label: "😠 Angry"    },
];

export function ReviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSentiment = searchParams.get("sentiment") ?? "";
  const issueOnly = searchParams.get("issueOnly") === "true";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {SENTIMENTS.map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={currentSentiment === s.value ? "default" : "outline"}
          onClick={() => setParam("sentiment", s.value)}
          className="text-xs h-8"
        >
          {s.label}
        </Button>
      ))}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <Button
        size="sm"
        variant={issueOnly ? "destructive" : "outline"}
        onClick={() => setParam("issueOnly", issueOnly ? "" : "true")}
        className="text-xs h-8 gap-1.5"
      >
        <AlertTriangle size={11} />
        Issues only
      </Button>
    </div>
  );
}
import { cn } from "@/lib/utils";

const SENTIMENT_CONFIG = {
  superhappy: { label: "Super happy", emoji: "🤩", className: "bg-violet-100 text-violet-700" },
  happy:      { label: "Happy",       emoji: "😊", className: "bg-green-100 text-green-700"  },
  neutral:    { label: "Neutral",     emoji: "😐", className: "bg-gray-100 text-gray-600"    },
  sad:        { label: "Sad",         emoji: "😔", className: "bg-blue-100 text-blue-700"    },
  angry:      { label: "Angry",       emoji: "😠", className: "bg-red-100 text-red-700"      },
} as const;

type Sentiment = keyof typeof SENTIMENT_CONFIG;

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = SENTIMENT_CONFIG[sentiment as Sentiment] ?? SENTIMENT_CONFIG.neutral;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", config.className)}>
      {config.emoji} {config.label}
    </span>
  );
}
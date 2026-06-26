import { cn } from "@/lib/utils";

const SENTIMENT_CONFIG = {
  superhappy: { label: "Super happy", emoji: "🤩", className: "bg-accent text-accent-foreground" },
  happy:      { label: "Happy",       emoji: "😊", className: "bg-emerald-100 text-emerald-700" },
  neutral:    { label: "Neutral",     emoji: "😐", className: "bg-secondary text-muted-foreground" },
  sad:        { label: "Sad",         emoji: "😔", className: "bg-sky-100 text-sky-700" },
  angry:      { label: "Angry",       emoji: "😠", className: "bg-red-100 text-red-700" },
} as const;

type Sentiment = keyof typeof SENTIMENT_CONFIG;

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = SENTIMENT_CONFIG[sentiment as Sentiment] ?? SENTIMENT_CONFIG.neutral;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", config.className)}>
      {config.emoji} {config.label}
    </span>
  );
}

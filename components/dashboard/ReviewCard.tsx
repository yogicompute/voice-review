import { Review } from "@/lib/db/schema";
import { SentimentBadge } from "./SentimentBadge";
import { StarRating } from "./StarRating";
import { AudioPlayer } from "./AudioPlayer";
import { UpgradePrompt } from "./UpgradePrompt";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, User, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PlanKey, canAccessAudio, canAccessAdvancedMetrics } from "@/lib/plans";

interface ReviewCardProps {
  review: Review;
  plan: PlanKey;
}

export function ReviewCard({ review, plan }: ReviewCardProps) {
  const hasAudio    = canAccessAudio(plan);
  const hasAdvanced = canAccessAdvancedMetrics(plan);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4 px-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User size={14} className="text-muted-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {review.customerRef ? `Order #${review.customerRef}` : "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {review.issueFlag && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle size={10} /> Issue
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={
                review.status === "completed"
                  ? "text-green-700 bg-green-50"
                  : review.status === "processing"
                  ? "text-amber-700 bg-amber-50"
                  : "text-red-700 bg-red-50"
              }
            >
              {review.status}
            </Badge>
          </div>
        </div>

        {/* Core metrics (all plans) */}
        {review.status === "completed" && (
          <div className="flex items-center gap-3 flex-wrap">
            <StarRating rating={review.rating ?? 0} />
            {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border">
              <RotateCcw size={10} />
              {review.likelyReturnRate}% return rate
            </span>
          </div>
        )}

        {/* Summary (all plans) */}
        {review.summary && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">
            &ldquo;{review.summary}&rdquo;
          </p>
        )}

        {/* Transcript (all plans) */}
        {review.transcript && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 flex gap-1.5">
            <FileText size={12} className="shrink-0 mt-0.5" />
            {review.transcript}
          </p>
        )}

        {/* Audio replay (pro+) */}
        {review.audioUrl && (
          hasAudio
            ? <AudioPlayer url={review.audioUrl} duration={review.audioDuration ?? 0} />
            : <UpgradePrompt
                feature="Audio replay"
                description="Listen to the original voice recording"
                compact
              />
        )}

        {/* Advanced metrics (pro+) */}
        {hasAdvanced && review.rawMetrics && (() => {
          try {
            const raw = JSON.parse(review.rawMetrics);
            return (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {Object.entries(raw)
                  .filter(([k]) => !["rating","sentiment","likelyReturnRate","issueFlag","summary"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="bg-secondary rounded-md px-2.5 py-1.5 border">
                      <p className="text-xs text-muted-foreground/70 capitalize">{k.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-sm font-medium text-foreground">{String(v)}</p>
                    </div>
                  ))}
              </div>
            );
          } catch { return null; }
        })()}
      </CardContent>
    </Card>
  );
}
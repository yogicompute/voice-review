import { Review } from "@/lib/db/schema";
import { SentimentBadge } from "./SentimentBadge";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4 px-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {review.customerRef ? `Order #${review.customerRef}` : "Anonymous"}
              </p>
              <p className="text-xs text-gray-400">
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

        {/* Metrics row */}
        {review.status === "completed" && (
          <div className="flex items-center gap-3 flex-wrap">
            <StarRating rating={review.rating ?? 0} />
            {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
            {review.likelyReturnRate !== null && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border">
                <RotateCcw size={10} />
                {review.likelyReturnRate}% return rate
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {review.summary && (
          <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
            "{review.summary}"
          </p>
        )}

        {/* Transcript */}
        {review.transcript && (
          <p className="text-xs text-gray-400 line-clamp-2">
            📝 {review.transcript}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getBusinessAnalytics } from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/StatCard";
import { BusinessTabs } from "@/components/dashboard/BusinessTabs";
import { RatingsChart } from "@/components/dashboard/RatingsChart";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { ReturnRateChart } from "@/components/dashboard/ReturnRateChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Mic,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getDbUser();
  if (!user) return null;

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
  });
  if (!business) notFound();

  const analytics = await getBusinessAnalytics(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/businesses/${id}`}>
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">{business.name}</h2>
          <p className="text-sm text-muted-foreground">
            Performance overview · last 30 days
          </p>
        </div>
      </div>

      <BusinessTabs businessId={business.id} active="performance" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total reviews"
          value={analytics.total}
          icon={Mic}
          sub="last 30 days"
          accent="default"
        />
        <StatCard
          label="Avg rating"
          value={`${analytics.avgRating} / 5`}
          icon={Star}
          sub="across all reviews"
          accent="amber"
        />
        <StatCard
          label="Avg return rate"
          value={`${analytics.avgReturnRate}%`}
          icon={RotateCcw}
          sub="likely to return"
          accent="green"
        />
        <StatCard
          label="Issues flagged"
          value={analytics.issueCount}
          icon={AlertTriangle}
          sub="need attention"
          accent={analytics.issueCount > 0 ? "red" : "default"}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RatingsChart data={analytics.ratingsOverTime} />
        <SentimentChart data={analytics.sentimentData} />
      </div>

      {/* Charts row 2 */}
      <ReturnRateChart data={analytics.returnRateOverTime} />

      {/* Quick links */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/businesses/${id}/reviews`}>
            View all reviews
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/businesses/${id}/reviews?issueOnly=true`}>
            <AlertTriangle size={13} className="mr-1.5" />
            View flagged issues
          </Link>
        </Button>
      </div>
    </div>
  );
}
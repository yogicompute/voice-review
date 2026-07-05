import { getDbUser } from "@/lib/auth";
import { db, businesses, reviews, subscriptions, sentimentEnum } from "@/lib/db";
import { eq, and, desc, count, type SQL } from "drizzle-orm";

type Sentiment = (typeof sentimentEnum.enumValues)[number];
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { ReviewFilters } from "@/components/dashboard/ReviewFilters";
import { Pagination } from "@/components/dashboard/Pagination";
import { BusinessTabs } from "@/components/dashboard/BusinessTabs";
import { Suspense } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PlanKey } from "@/lib/plans";

const LIMIT = 10;

export default async function BusinessReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sentiment?: string; issueOnly?: string; page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const user = await getDbUser();
  if (!user) return null;

  const [business, subscription] = await Promise.all([
    db.query.businesses.findFirst({
      where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
    }),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
    }),
  ]);

  if (!business) notFound();

  const plan = (subscription?.plan ?? "free") as PlanKey;
  const page = parseInt(sp.page ?? "1");
  const offset = (page - 1) * LIMIT;

  const filters: SQL[] = [eq(reviews.businessId, id)];
  if (sp.sentiment) filters.push(eq(reviews.sentiment, sp.sentiment as Sentiment));
  if (sp.issueOnly === "true") filters.push(eq(reviews.issueFlag, true));
  const where = and(...filters);

  const [list, [{ value: total }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      orderBy: desc(reviews.createdAt),
      limit: LIMIT,
      offset,
    }),
    db.select({ value: count() }).from(reviews).where(where),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/businesses/${id}`}>
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{business.name}</h2>
            <p className="text-muted-foreground text-sm">
              {total} review{total !== 1 ? "s" : ""}
              {sp.sentiment || sp.issueOnly ? " (filtered)" : ""}
            </p>
          </div>
        </div>
      </div>

      <BusinessTabs businessId={business.id} active="reviews" />

      <Suspense>
        <ReviewFilters />
      </Suspense>

      {list.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Mic size={36} className="text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {sp.sentiment || sp.issueOnly
                  ? "No reviews match this filter."
                  : "Add the SDK button to your app to start collecting voice reviews."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {list.length > 0 && (
        <div className="space-y-3">
          {list.map((review) => (
            <ReviewCard key={review.id} review={review} plan={plan} />
          ))}
        </div>
      )}

      <Suspense>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
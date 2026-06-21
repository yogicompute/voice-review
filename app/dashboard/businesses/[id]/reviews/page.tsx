import { getDbUser } from "@/lib/auth";
import { db, businesses, reviews } from "@/lib/db";
import { eq, and, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { ReviewFilters } from "@/components/dashboard/ReviewFilters";
import { Pagination } from "@/components/dashboard/Pagination";
import { Suspense } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
  });
  if (!business) notFound();

  const page = parseInt(sp.page ?? "1");
  const offset = (page - 1) * LIMIT;

  // Build filters
  const filters: any[] = [eq(reviews.businessId, id)];
  if (sp.sentiment) filters.push(eq(reviews.sentiment, sp.sentiment as any));
  if (sp.issueOnly === "true") filters.push(eq(reviews.issueFlag, true));
  const where = and(...filters);

  const [list, [{ value: total }], [{ value: avgRating }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      orderBy: desc(reviews.createdAt),
      limit: LIMIT,
      offset,
    }),
    db.select({ value: count() }).from(reviews).where(where),
    db.select({ value: count() }).from(reviews).where(eq(reviews.businessId, id)),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/businesses/${id}`}>
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{business.name}</h2>
            <p className="text-gray-500 text-sm">
              {total} review{total !== 1 ? "s" : ""}
              {sp.sentiment || sp.issueOnly ? " (filtered)" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <ReviewFilters />
      </Suspense>

      {/* Empty state */}
      {list.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Mic size={36} className="text-gray-300" />
            <div className="text-center">
              <p className="font-medium text-gray-700">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {sp.sentiment || sp.issueOnly
                  ? "No reviews match this filter."
                  : "Add the SDK button to your app to start collecting voice reviews."}
              </p>
            </div>
            {!sp.sentiment && !sp.issueOnly && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/businesses/${id}`}>View setup guide</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review list */}
      {list.length > 0 && (
        <div className="space-y-3">
          {list.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Suspense>
        <Pagination page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
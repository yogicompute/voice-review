import { getDbUser } from "@/lib/auth";
import { db, businesses, reviews, subscriptions } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Star, Mic, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { getOnboardingStatus } from "@/lib/onboarding";
import { PLANS, PlanKey } from "@/lib/plans";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) return null;

  const onboarding = await getOnboardingStatus(user.id);

  const [{ value: bizCount }] = await db
    .select({ value: count() })
    .from(businesses)
    .where(eq(businesses.userId, user.id));

  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
  });

  let totalReviews = 0;
  let avgRating = 0;

  if (userBusinesses.length > 0) {
    const reviewData = await Promise.all(
      userBusinesses.map((b) =>
        db.query.reviews.findMany({
          where: eq(reviews.businessId, b.id),
        })
      )
    );
    const all = reviewData.flat();
    totalReviews = all.length;
    avgRating =
      all.length > 0
        ? all.reduce((s, r) => s + (r.rating ?? 0), 0) / all.length
        : 0;
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });
  const plan = (subscription?.plan ?? "free") as PlanKey;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening across your businesses.
        </p>
      </div>

      {/* Onboarding stepper — hides once complete */}
      <GettingStarted
        hasBusiness={onboarding.hasBusiness}
        hasReview={onboarding.hasReview}
        businessId={onboarding.firstBusiness?.id}
        apiKey={onboarding.firstBusiness?.apiKey}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Building2 size={13} /> Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bizCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              of {PLANS[plan].maxBusinesses} on {plan} plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Mic size={13} /> Total reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalReviews}</p>
            <p className="text-xs text-gray-400 mt-0.5">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Star size={13} /> Avg rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">out of 5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <TrendingUp size={13} /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">{plan}</p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-violet-600 mt-0.5"
              asChild
            >
              <Link href="/dashboard/billing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick links when businesses exist */}
      {onboarding.hasBusiness && onboarding.firstBusiness && (
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/businesses">Manage businesses</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/businesses/${onboarding.firstBusiness.id}/reviews`}>
              View reviews
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/businesses/${onboarding.firstBusiness.id}/performance`}>
              Performance
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/test-button">Test SDK button</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
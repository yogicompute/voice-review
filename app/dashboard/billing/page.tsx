import { getDbUser } from "@/lib/auth";
import { db, subscriptions, businesses, reviews } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { PLANS, PlanKey } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES: Record<PlanKey, string[]> = {
  free: [
    "1 business",
    "50 reviews / month",
    "Ratings + sentiment analysis",
    "Return rate prediction",
    "Issue flagging",
    "AI summary",
  ],
  pro: [
    "5 businesses",
    "500 reviews / month",
    "Everything in Free",
    "Audio replay",
    "Advanced metrics",
    "Performance charts",
  ],
  business: [
    "20 businesses",
    "5,000 reviews / month",
    "Everything in Pro",
    "Priority support",
    "Custom branding",
    "Export reviews (CSV)",
  ],
};

export default async function BillingPage() {
  const user = await getDbUser();
  if (!user) return null;

  // Safely get or create subscription row if missing
  let subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  if (!subscription) {
    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        plan: "free",
        reviewsPerMonth: 50,
        audioAccess: false,
        advancedMetrics: false,
        maxBusinesses: 1,
      })
      .returning();
    subscription = created;
  }

  const currentPlan = (subscription.plan ?? "free") as PlanKey;

  // Real usage counts
  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
  });

  const bizIds = userBusinesses.map((b) => b.id);

  // Reviews this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let reviewsThisMonth = 0;
  if (bizIds.length > 0) {
    const results = await Promise.all(
      bizIds.map((id) =>
        db
          .select({ value: count() })
          .from(reviews)
          .where(eq(reviews.businessId, id))
      )
    );
    reviewsThisMonth = results.reduce((s, r) => s + (r[0]?.value ?? 0), 0);
  }

  const bizCount = userBusinesses.length;
  const planLimits = PLANS[currentPlan];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing &amp; plans</h2>
        <p className="mt-1 text-muted-foreground">
          Currently on the{" "}
          <span className="font-medium capitalize text-foreground">{currentPlan}</span> plan.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
          ([key, plan]) => {
            const isCurrent = key === currentPlan;
            const isPopularPlan = key === "pro";

            const rank: Record<PlanKey, number> = { free: 0, pro: 1, business: 2 };
            const label =
              key === "free"
                ? "Downgrade"
                : rank[key] < rank[currentPlan]
                  ? "Change plan"
                  : `Upgrade to ${plan.label}`;

            return (
              <div key={key} className="relative">
                {isPopularPlan && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary px-3 text-primary-foreground shadow-sm">
                      <Zap size={10} /> Most popular
                    </Badge>
                  </div>
                )}
                <Card
                  className={cn(
                    "flex h-full flex-col",
                    isPopularPlan && "border-primary shadow-md shadow-primary/10",
                    isCurrent && "ring-2 ring-primary"
                  )}
                >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {plan.label}
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold mt-1">{plan.price}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {FEATURES[key].map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <UpgradeButton plan={key} currentPlan={currentPlan} label={label} />
                </CardContent>
                </Card>
              </div>
            );
          }
        )}
      </div>

      {/* Real usage summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This month&apos;s usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reviews */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reviews this month</span>
              <span className="font-medium">
                {reviewsThisMonth} / {planLimits.reviewsPerMonth}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  reviewsThisMonth / planLimits.reviewsPerMonth > 0.9
                    ? "bg-red-500"
                    : reviewsThisMonth / planLimits.reviewsPerMonth > 0.7
                    ? "bg-amber-500"
                    : "bg-primary"
                )}
                style={{
                  width: `${Math.min(
                    100,
                    (reviewsThisMonth / planLimits.reviewsPerMonth) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Businesses */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Businesses</span>
              <span className="font-medium">
                {bizCount} / {planLimits.maxBusinesses}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  bizCount / planLimits.maxBusinesses >= 1
                    ? "bg-red-500"
                    : "bg-primary"
                )}
                style={{
                  width: `${Math.min(
                    100,
                    (bizCount / planLimits.maxBusinesses) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Feature flags */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-secondary rounded-lg px-3 py-2.5 border">
              <p className="text-xs text-muted-foreground/70">Audio replay</p>
              <p className="text-sm font-medium mt-0.5">
                {planLimits.audioAccess ? "✅ Included" : "🔒 Pro+"}
              </p>
            </div>
            <div className="bg-secondary rounded-lg px-3 py-2.5 border">
              <p className="text-xs text-muted-foreground/70">Advanced metrics</p>
              <p className="text-sm font-medium mt-0.5">
                {planLimits.advancedMetrics ? "✅ Included" : "🔒 Pro+"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
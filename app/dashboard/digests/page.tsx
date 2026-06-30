import { getDbUser } from "@/lib/auth";
import { db, businesses, digests, reviews } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { DigestPanel } from "@/components/dashboard/DigestPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DigestsPage() {
  const user = await getDbUser();
  if (!user) return null;

  const list = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
    orderBy: (b, { desc: d }) => d(b.createdAt),
  });

  const latestPerBusiness = await Promise.all(
    list.map((b) =>
      db.query.digests.findFirst({
        where: eq(digests.businessId, b.id),
        orderBy: desc(digests.createdAt),
      }),
    ),
  );

  const reviewCounts = await Promise.all(
    list.map((b) =>
      db
        .select({ value: count() })
        .from(reviews)
        .where(eq(reviews.businessId, b.id))
        .then((r) => r[0]?.value ?? 0),
    ),
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Weekly digests</h2>
        <p className="mt-1 text-muted-foreground">
          AI turns each week of reviews into a decision — top complaint, top praise, and the one
          thing to fix. Delivered straight to your inbox.
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-medium">No businesses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Register a business to start generating weekly digests.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register business</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {list.map((b, i) => (
            <DigestPanel
              key={b.id}
              business={{
                id: b.id,
                name: b.name,
                digestEnabled: b.digestEnabled,
                digestEmail: b.digestEmail,
              }}
              latest={latestPerBusiness[i] ?? null}
              reviewCount={reviewCounts[i]}
              ownerEmail={user.email}
            />
          ))}
        </div>
      )}
    </div>
  );
}

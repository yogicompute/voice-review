import { getDbUser } from "@/lib/auth";
import { db, businesses, reviews } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Star, Mic } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) return null;

  const [{ value: bizCount }] = await db
    .select({ value: count() })
    .from(businesses)
    .where(eq(businesses.userId, user.id));

  const userBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
  });

  const bizIds = userBusinesses.map((b) => b.id);

  let reviewCount = 0;
  if (bizIds.length > 0) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(reviews);
    reviewCount = value;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          Welcome back{user.name ? `, ${user.name}` : ""}
        </h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening across your businesses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 size={14} /> Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bizCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Mic size={14} /> Total reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Star size={14} /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">{user.plan}</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {bizCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Building2 size={40} className="text-gray-300" />
            <div className="text-center">
              <p className="font-medium text-gray-700">No businesses yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Register your first business to get your SDK credentials.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register a business</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
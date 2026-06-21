import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function BusinessesPage() {
  const user = await getDbUser();
  if (!user) return null;

  const list = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
    orderBy: (b, { desc }) => desc(b.createdAt),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Businesses</h2>
          <p className="text-gray-500 mt-1">Manage your registered businesses.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/businesses/new">
            <Plus size={16} className="mr-2" /> Register business
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Building2 size={40} className="text-gray-300" />
            <div className="text-center">
              <p className="font-medium text-gray-700">No businesses registered</p>
              <p className="text-sm text-gray-400 mt-1">
                Add one to get your API key and start collecting voice reviews.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register your first business</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((biz) => (
            <Link key={biz.id} href={`/dashboard/businesses/${biz.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building2 size={18} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{biz.name}</p>
                      <p className="text-sm text-gray-400">{biz.category ?? "No category"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={biz.isActive ? "default" : "secondary"}>
                      {biz.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
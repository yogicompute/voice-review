import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getDbUser } from "@/lib/auth";
import { TestConsole } from "@/components/dashboard/TestConsole";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TestButtonPage() {
  const user = await getDbUser();
  if (!user) return null;

  const list = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
    orderBy: (b, { desc }) => desc(b.createdAt),
  });

  return (
    <div className="relative min-h-screen bg-secondary">
      {/* Back button */}
      <div className="absolute left-5 top-5">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft size={15} />
            Back to dashboard
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="space-y-3">
            <p className="text-muted-foreground">Register a business first to test the button.</p>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register business</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">SDK Button Test</h1>
            <p className="mt-1 text-muted-foreground">
              Record a sample review and watch it flow through the pipeline.
            </p>
          </div>
          <TestConsole
            businesses={list.map((b) => ({ id: b.id, name: b.name, apiKey: b.apiKey }))}
          />
        </div>
      )}
    </div>
  );
}

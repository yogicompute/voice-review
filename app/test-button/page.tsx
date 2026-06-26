import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getDbUser } from "@/lib/auth";
import { VoiceReviewButtonDemo } from "@/components/dashboard/VoiceReviewButtonDemo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TestButtonPage() {
  const user = await getDbUser();
  if (!user) return null;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
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

      {!business ? (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="space-y-3">
            <p className="text-muted-foreground">Register a business first to test the button.</p>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register business</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">SDK Button Test</h1>
            <p className="mt-1 text-muted-foreground">
              Testing for: <span className="font-medium text-foreground">{business.name}</span>
            </p>
          </div>
          <VoiceReviewButtonDemo apiKey={business.apiKey} businessId={business.id} />
        </div>
      )}
    </div>
  );
}

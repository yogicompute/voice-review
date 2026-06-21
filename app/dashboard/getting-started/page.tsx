import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { CodeGuide } from "@/components/dashboard/CodeGuide";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function GettingStartedPage() {
  const user = await getDbUser();
  if (!user) return null;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Integration guide</h2>
          <p className="text-gray-500 text-sm">
            Everything you need to add VoiceReview to your app.
          </p>
        </div>
      </div>

      {/* Endpoint info */}
      <Card className="bg-violet-50 border-violet-100">
        <CardContent className="py-4 px-5 flex items-start gap-3">
          <BookOpen size={16} className="text-violet-600 mt-0.5 shrink-0" />
          <div className="text-sm text-violet-800 space-y-1">
            <p className="font-medium">How it works</p>
            <p className="text-violet-700 text-xs leading-relaxed">
              The SDK button records audio in the browser, sends it to your
              VoiceReview endpoint, which transcribes it with Groq Whisper and
              analyzes it with Gemini Flash. Results appear in your dashboard
              within seconds.
            </p>
          </div>
        </CardContent>
      </Card>

      {!business ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <p className="font-medium text-gray-700">Register a business first</p>
            <p className="text-sm text-gray-400">
              You need a business to get your API credentials.
            </p>
            <Button asChild>
              <Link href="/dashboard/businesses/new">Register business</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CodeGuide apiKey={business.apiKey} businessId={business.id} />
      )}
    </div>
  );
}
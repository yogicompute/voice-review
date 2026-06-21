import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getDbUser } from "@/lib/auth";
import { VoiceReviewButtonDemo } from "@/components/dashboard/VoiceReviewButtonDemo";

export default async function TestButtonPage() {
  const user = await getDbUser();
  if (!user) return null;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Register a business first to test the button.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gray-50 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">SDK Button Test</h1>
        <p className="text-gray-500 mt-1">
          Testing for: <span className="font-medium">{business.name}</span>
        </p>
      </div>
      <VoiceReviewButtonDemo apiKey={business.apiKey} businessId={business.id} />
    </div>
  );
}
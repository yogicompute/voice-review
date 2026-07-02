import { getDbUser } from "@/lib/auth";
import { getGlowingReviews, buildCaption } from "@/lib/share";
import { ShareCard } from "@/components/dashboard/ShareCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default async function MomentsPage() {
  const user = await getDbUser();
  if (!user) return null;

  const moments = await getGlowingReviews(user.id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Shareable moments</h2>
        <p className="mt-1 text-muted-foreground">
          Your best voice reviews, auto-turned into branded cards. Post them to social — your logo,
          your customer&apos;s words, free reach.
        </p>
      </div>

      {moments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-medium">No glowing reviews yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When a customer leaves a 4–5★ positive voice review, a ready-to-post shareable card
                appears here automatically.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/businesses">View businesses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {moments.map(({ review, business }) => (
            <ShareCard
              key={review.id}
              id={review.id}
              businessName={business.name}
              caption={buildCaption(review, business.name)}
              shareUrl={`${appUrl}/s/${review.id}`}
              cardUrl={`/s/${review.id}/opengraph-image`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

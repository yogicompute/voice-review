import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PublicReview } from "@/components/public/PublicReview";
import { Mic } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { name: true },
  });
  return {
    title: business ? `Leave a voice review · ${business.name}` : "Voice review",
    description: "Share your feedback in a few seconds — just speak.",
  };
}

export default async function PublicReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; t?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) notFound();

  // Optional reference (e.g. ?t=table-7 or ?ref=order_123) printed on the QR.
  const customerRef = sp.ref || (sp.t ? `table-${sp.t}` : undefined);

  if (!business.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-6 text-center">
        <p className="text-muted-foreground">This review page is currently unavailable.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-accent/40 to-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        {/* Brand / business */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              className="size-16 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Mic size={26} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
            <p className="mt-1 text-muted-foreground">How was your experience?</p>
          </div>
        </div>

        <PublicReview
          apiKey={business.apiKey}
          businessId={business.id}
          customerRef={customerRef}
        />

        <p className="mt-3 text-xs text-muted-foreground">
          Tap, speak for a few seconds, and you&apos;re done. No typing, no sign-up.
        </p>
      </div>

      <a
        href="https://voicereview.app"
        className="flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
      >
        <Mic size={12} /> Powered by VoiceReview
      </a>
    </main>
  );
}

import { db, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mic } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getData(id: string) {
  return db.query.reviews.findFirst({
    where: eq(reviews.id, id),
    with: { business: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const review = await getData(id);
  const name = review?.business?.name ?? "VoiceReview";
  const quote = review?.summary?.trim() || "A wonderful experience!";
  // Next auto-wires app/s/[id]/opengraph-image.tsx as the OG/Twitter image.
  return {
    title: `${name} — customer review`,
    description: quote,
    openGraph: { title: `${name} — customer review`, description: quote, type: "article" },
    twitter: { card: "summary_large_image", title: `${name} — customer review`, description: quote },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getData(id);

  if (!review || review.status !== "completed") notFound();

  const business = review.business;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-accent/40 to-background px-6 py-14">
      {/* The actual branded card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/s/${id}/opengraph-image`}
          alt={`${business?.name} customer review`}
          className="aspect-square w-full"
        />
      </div>

      {/* CTA */}
      {business?.slug && (
        <Link
          href={`/r/${business.slug}`}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Mic size={16} /> Leave your own voice review
        </Link>
      )}

      <a
        href="https://voicereview.app"
        className="flex items-center gap-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
      >
        <Mic size={12} /> Powered by VoiceReview
      </a>
    </main>
  );
}

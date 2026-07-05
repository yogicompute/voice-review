import { db, businesses } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PublicReview } from "@/components/public/PublicReview";
import { PoweredByMascot } from "@/components/public/PartyEffects";
import { pageBackground, cardTint, isDark } from "@/lib/color";
import { Mic, ShieldCheck } from "lucide-react";

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

  // Owner theme (set from the "Customize page" tab)
  const style = business.reviewPageStyle || "gradient";
  const color = business.reviewPageColor || "#7fa7cf";
  const background = pageBackground(style, color);
  const tint = cardTint(color);
  // Gradient backgrounds are always light pastels; only a solid dark color
  // needs light text outside the card.
  const dark = style === "solid" && isDark(color);
  const message = business.reviewPageMessage?.trim() || "How was your experience?";

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10"
      style={{ background }}
    >
      <div className="relative w-full max-w-md">
        {/* The card */}
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-black/15 ring-1 ring-black/5">
          {/* Tinted hero with sunrays behind the emblem */}
          <div
            className="relative px-6 pb-2 pt-12"
            style={{ background: `linear-gradient(to bottom, ${tint} 0%, rgba(255,255,255,0) 100%)` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "repeating-conic-gradient(from -90deg at 50% 72%, rgba(255,255,255,0) 0deg 10deg, rgba(255,255,255,0.65) 10deg 14deg)",
                maskImage:
                  "radial-gradient(ellipse 100% 85% at 50% 45%, black 0%, transparent 72%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 100% 85% at 50% 45%, black 0%, transparent 72%)",
              }}
            />

            <div className="relative flex justify-center">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="size-24 rounded-[1.5rem] object-cover shadow-xl ring-4 ring-white/70"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-[1.75rem] bg-white shadow-xl ring-1 ring-black/5">
                  <Mic size={36} style={{ color }} />
                </div>
              )}
            </div>
          </div>

          {/* Headline · divider · message — like a proper invitation */}
          <div className="px-7 pt-5 text-center">
            <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-slate-900">
              {business.name}
            </h1>
            <div className="mx-auto my-4 h-px w-36 bg-slate-200" />
            <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-slate-500">
              {message}
            </p>
          </div>

          {/* Recorder */}
          <div className="px-6 pb-8 pt-6">
            <PublicReview
              apiKey={business.apiKey}
              businessId={business.id}
              customerRef={customerRef}
              googlePlaceId={business.googlePlaceId}
              accentColor={color}
            />
          </div>
        </div>

        {/* Trust line */}
        <div
          className={`mt-4 flex items-center justify-center gap-1.5 text-xs ${
            dark ? "text-white/75" : "text-black/55"
          }`}
        >
          <ShieldCheck size={13} />
          <span>15 seconds · no sign-up · your feedback stays private</span>
        </div>
      </div>

      {/* Footer credit — with a hidden friend 👀 */}
      <div className="relative mt-8">
        <PoweredByMascot light={dark} />
      </div>
    </main>
  );
}

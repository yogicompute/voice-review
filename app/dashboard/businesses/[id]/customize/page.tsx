import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BusinessTabs } from "@/components/dashboard/BusinessTabs";
import { CustomizeForm } from "@/components/dashboard/CustomizeForm";
import { Paintbrush } from "lucide-react";

export default async function CustomizeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getDbUser();
  if (!user) return null;

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
  });
  if (!business) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <Paintbrush size={17} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{business.name}</h2>
          <p className="text-sm text-muted-foreground/70">
            Make your review page feel like your brand.
          </p>
        </div>
      </div>

      <BusinessTabs businessId={business.id} active="customize" />

      <CustomizeForm
        business={{
          id: business.id,
          name: business.name,
          slug: business.slug,
          logoUrl: business.logoUrl,
          reviewPageStyle: business.reviewPageStyle,
          reviewPageColor: business.reviewPageColor,
          reviewPageMessage: business.reviewPageMessage,
        }}
      />
    </div>
  );
}

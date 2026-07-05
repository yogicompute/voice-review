import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { QrCard } from "@/components/dashboard/QrCard";
import { GooglePlaceIdCard } from "@/components/dashboard/GooglePlaceIdCard";
import { BusinessTabs } from "@/components/dashboard/BusinessTabs";
import { Building2, Key, ExternalLink } from "lucide-react";
import { BarChart2 } from "lucide-react";
import Link from "next/link";

export default async function BusinessDetailPage({
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const reviewUrl = `${appUrl}/r/${business.slug}`;
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const snippet = `import { VoiceReviewButton } from "@voicereview/sdk";

<VoiceReviewButton
  apiKey="${business.apiKey}"
  businessId="${business.id}"
/>`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Building2 size={18} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold">{business.name}</h2>
            <p className="text-muted-foreground/70 text-sm">
              {business.category ?? "No category"}
            </p>
          </div>
        </div>
        <Badge variant={business.isActive ? "default" : "secondary"}>
          {business.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <BusinessTabs businessId={business.id} active="overview" />

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key size={15} /> API credentials
          </CardTitle>
          <CardDescription>
            Use these in the SDK button. Keep your API secret private.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              API Key
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary border rounded-md px-3 py-2 text-sm font-mono truncate">
                {business.apiKey}
              </code>
              <CopyButton text={business.apiKey} />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Business ID
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary border rounded-md px-3 py-2 text-sm font-mono truncate">
                {business.id}
              </code>
              <CopyButton text={business.id} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR review page */}
      <QrCard url={reviewUrl} dataUrl={qrDataUrl} businessName={business.name} />

      {/* Google reviews / Place ID */}
      <GooglePlaceIdCard
        businessId={business.id}
        googlePlaceId={business.googlePlaceId}
      />

      {/* Code snippet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick start</CardTitle>
          <CardDescription>
            Drop this into your app where you want the review button to appear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-[#0d1117] text-slate-100 ring-1 ring-white/10 rounded-lg p-4 text-sm overflow-x-auto font-mono leading-relaxed">
              {snippet}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={snippet} dark />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/businesses/${business.id}/reviews`}>
                <ExternalLink size={13} className="mr-2" />
                View reviews
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/businesses/${business.id}/performance`}>
                <BarChart2 size={13} className="mr-2" />
                Performance
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

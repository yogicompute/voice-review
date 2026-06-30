import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, businesses, digests } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getOrCreateWeeklyDigest } from "@/lib/digest";
import { deliverDigest } from "@/lib/notify";

/**
 * Emails the digest for a business: reuses this week's digest if one already
 * exists, otherwise generates it first, then sends.
 */
export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = (await req.json()) as { businessId?: string };
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, businessId), eq(businesses.userId, user.id)),
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { digest, generated } = await getOrCreateWeeklyDigest(businessId);

  const delivery = await deliverDigest({
    digest,
    businessName: business.name,
    email: business.digestEmail ?? user.email,
  });

  if (delivery.email) {
    await db.update(digests).set({ deliveredEmail: true }).where(eq(digests.id, digest.id));
  }

  return NextResponse.json({ delivery, generated });
}

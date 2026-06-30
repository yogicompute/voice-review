import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, businesses, digests } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { generateDigest } from "@/lib/digest";
import { deliverDigest } from "@/lib/notify";

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId, send } = (await req.json()) as { businessId?: string; send?: boolean };
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, businessId), eq(businesses.userId, user.id)),
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const digest = await generateDigest(business.id);

    if (send) {
      const delivery = await deliverDigest({
        digest,
        businessName: business.name,
        email: business.digestEmail ?? user.email,
      });
      if (delivery.email) {
        await db
          .update(digests)
          .set({ deliveredEmail: true })
          .where(eq(digests.id, digest.id));
      }
      return NextResponse.json({ digest, delivery });
    }

    return NextResponse.json({ digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate digest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

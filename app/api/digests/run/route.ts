import { NextResponse } from "next/server";
import { db, businesses, digests } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getOrCreateWeeklyDigest } from "@/lib/digest";
import { deliverDigest } from "@/lib/notify";

/**
 * Weekly cron endpoint. Generates + delivers a digest for every business
 * with digests enabled. Protect with a bearer token (CRON_SECRET) and call
 * it from Vercel Cron or any external scheduler, e.g. weekly Monday 8am.
 */
export async function POST(req: Request) {
  return run(req);
}

// Vercel Cron sends GET requests.
export async function GET(req: Request) {
  return run(req);
}

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db.query.businesses.findMany({
    where: eq(businesses.digestEnabled, true),
    with: { user: true },
  });

  let generated = 0;
  let delivered = 0;

  for (const business of list) {
    try {
      const { digest, generated: wasGenerated } = await getOrCreateWeeklyDigest(business.id);
      if (wasGenerated) generated++;

      const delivery = await deliverDigest({
        digest,
        businessName: business.name,
        email: business.digestEmail ?? business.user?.email,
      });

      if (delivery.email) {
        delivered++;
        await db
          .update(digests)
          .set({ deliveredEmail: true })
          .where(eq(digests.id, digest.id));
      }
    } catch (err) {
      console.error(`Digest failed for business ${business.id}:`, err);
    }
  }

  return NextResponse.json({ businesses: list.length, generated, delivered });
}

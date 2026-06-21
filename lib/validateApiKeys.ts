import { db, businesses, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function validateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith("vr_live_")) return null;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.apiKey, apiKey),
    with: {
      user: {
        with: { subscription: true },
      },
    },
  });

  if (!business || !business.isActive) return null;

  return business;
}
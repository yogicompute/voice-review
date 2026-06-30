import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db, businesses } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  businessId: z.string(),
  digestEnabled: z.boolean().optional(),
  digestEmail: z.string().email().nullable().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { businessId, digestEnabled, digestEmail } = parsed.data;

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, businessId), eq(businesses.userId, user.id)),
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(businesses)
    .set({
      ...(digestEnabled !== undefined ? { digestEnabled } : {}),
      ...(digestEmail !== undefined ? { digestEmail: digestEmail || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return NextResponse.json({ success: true });
}

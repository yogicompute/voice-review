import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  category: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  // When present: empty string clears the Place ID (null), otherwise sets it.
  // When absent from the request, the column is left untouched.
  googlePlaceId: z.string().trim().max(255).optional(),
  // Review page customization
  reviewPageStyle: z.enum(["gradient", "solid"]).optional(),
  reviewPageColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #059669")
    .optional(),
  // Empty string clears the message (falls back to the default greeting).
  reviewPageMessage: z.string().trim().max(120).optional(),
});

async function getOwnedBusiness(clerkId: string, bizId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) return null;

  return db.query.businesses.findFirst({
    where: and(eq(businesses.id, bizId), eq(businesses.userId, user.id)),
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await getOwnedBusiness(userId, id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(business);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await getOwnedBusiness(userId, id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Normalize explicitly-provided empty strings to null (clears the value).
  const patch: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if ("googlePlaceId" in parsed.data) {
    patch.googlePlaceId = parsed.data.googlePlaceId ? parsed.data.googlePlaceId : null;
  }
  if ("reviewPageMessage" in parsed.data) {
    patch.reviewPageMessage = parsed.data.reviewPageMessage ? parsed.data.reviewPageMessage : null;
  }

  const [updated] = await db
    .update(businesses)
    .set(patch)
    .where(eq(businesses.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await getOwnedBusiness(userId, id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(businesses).where(eq(businesses.id, id));
  return NextResponse.json({ success: true });
}
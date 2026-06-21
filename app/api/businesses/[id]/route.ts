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

  const [updated] = await db
    .update(businesses)
    .set({ ...parsed.data, updatedAt: new Date() })
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
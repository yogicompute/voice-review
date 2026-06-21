import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users, businesses, subscriptions } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const list = await db.query.businesses.findMany({
    where: eq(businesses.userId, user.id),
    with: { reviews: true },
    orderBy: (b, { desc }) => desc(b.createdAt),
  });

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check business limit
  const [{ value: bizCount }] = await db
    .select({ value: count() })
    .from(businesses)
    .where(eq(businesses.userId, user.id));

  const maxAllowed = user.subscription?.maxBusinesses ?? 1;
  if (bizCount >= maxAllowed) {
    return NextResponse.json(
      { error: `Your plan allows max ${maxAllowed} business(es). Upgrade to add more.` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;

  const [business] = await db
    .insert(businesses)
    .values({ ...parsed.data, userId: user.id, slug })
    .returning();

  return NextResponse.json(business, { status: 201 });
}
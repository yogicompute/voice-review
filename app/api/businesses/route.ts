import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users, businesses, subscriptions } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(80)
    .regex(/^[A-Za-z][A-Za-z ]*$/, "Business name can only contain letters and spaces"),
  category: z.string().trim().min(2, "Category is required").max(50),
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
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Capitalize the first letter of the business name (rest left as typed)
  const trimmedName = parsed.data.name.trim();
  const name = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;

  const [business] = await db
    .insert(businesses)
    .values({ ...parsed.data, name, userId: user.id, slug })
    .returning();

  return NextResponse.json(business, { status: 201 });
}
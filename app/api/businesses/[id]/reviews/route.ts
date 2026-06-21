import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users, businesses, reviews } from "@/lib/db";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Parse query params
  const { searchParams } = new URL(req.url);
  const sentiment = searchParams.get("sentiment");
  const issueOnly = searchParams.get("issueOnly") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  // Build filters
  const filters = [eq(reviews.businessId, id)];
  if (sentiment) filters.push(eq(reviews.sentiment, sentiment as any));
  if (issueOnly) filters.push(eq(reviews.issueFlag, true));

  const where = and(...filters);

  const [list, [{ value: total }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      orderBy: desc(reviews.createdAt),
      limit,
      offset,
    }),
    db.select({ value: count() }).from(reviews).where(where),
  ]);

  return NextResponse.json({
    reviews: list,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
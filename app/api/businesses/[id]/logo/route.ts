import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users, businesses } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { uploadImage } from "@/lib/cloudinary";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const business = await db.query.businesses.findFirst({
    where: and(eq(businesses.id, id), eq(businesses.userId, user.id)),
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPG, WebP or SVG image" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image too large (max 2MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadImage(buffer, `voicereview/logos/${business.id}`);

    const [updated] = await db
      .update(businesses)
      .set({ logoUrl: url, updatedAt: new Date() })
      .where(eq(businesses.id, business.id))
      .returning();

    return NextResponse.json({ logoUrl: updated.logoUrl });
  } catch (err) {
    console.error("Logo upload failed:", err);
    return NextResponse.json({ error: "Upload failed, try again" }, { status: 500 });
  }
}

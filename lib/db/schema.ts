import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  real,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "pro", "business"]);

export const sentimentEnum = pgEnum("sentiment", [
  "superhappy",
  "happy",
  "neutral",
  "sad",
  "angry",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "processing",
  "completed",
  "failed",
]);

// ── Users ──────────────────────────────────────────────────────────────
// Synced from Clerk via webhook. clerkId is the source of truth.
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name"),
    plan: planEnum("plan").notNull().default("free"),
    razorpayCustomerId: text("razorpay_customer_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    clerkIdIdx: uniqueIndex("users_clerk_id_idx").on(t.clerkId),
  })
);

// ── Businesses ─────────────────────────────────────────────────────────
// One user can own multiple businesses.
export const businesses = pgTable(
  "businesses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),       // used in public-facing URLs
    category: text("category"),                  // e.g. "restaurant", "salon"
    logoUrl: text("logo_url"),
    // API credentials the SDK button uses
    apiKey: text("api_key")
      .notNull()
      .$defaultFn(() => `vr_live_${nanoid(32)}`),
    apiSecret: text("api_secret")
      .notNull()
      .$defaultFn(() => nanoid(48)),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("businesses_user_id_idx").on(t.userId),
    slugIdx: uniqueIndex("businesses_slug_idx").on(t.slug),
    apiKeyIdx: uniqueIndex("businesses_api_key_idx").on(t.apiKey),
  })
);

// ── Reviews ────────────────────────────────────────────────────────────
export const reviews = pgTable(
  "reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    // Audio
    audioUrl: text("audio_url"),               // Cloudinary URL
    audioDuration: real("audio_duration"),      // seconds
    transcript: text("transcript"),

    // AI-generated metrics
    status: reviewStatusEnum("status").notNull().default("processing"),
    rating: integer("rating"),                  // 1–5
    sentiment: sentimentEnum("sentiment"),
    likelyReturnRate: real("likely_return_rate"), // 0–100
    issueFlag: boolean("issue_flag").default(false),
    summary: text("summary"),                   // 1-line AI summary
    rawMetrics: text("raw_metrics"),            // full JSON blob from Gemini

    // Optional: who left the review (if business passes customer info)
    customerRef: text("customer_ref"),          // order ID or customer ID (opaque)

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    businessIdIdx: index("reviews_business_id_idx").on(t.businessId),
    createdAtIdx: index("reviews_created_at_idx").on(t.createdAt),
    statusIdx: index("reviews_status_idx").on(t.status),
  })
);

// ── Subscriptions ──────────────────────────────────────────────────────
// Tracks plan limits per user. Updated by billing webhook.
export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("free"),
  // Limits enforced server-side
  reviewsPerMonth: integer("reviews_per_month").notNull().default(50),
  audioAccess: boolean("audio_access").notNull().default(false),
  advancedMetrics: boolean("advanced_metrics").notNull().default(false),
  maxBusinesses: integer("max_businesses").notNull().default(1),
  // Razorpay billing
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  razorpayCustomerId: text("razorpay_customer_id"),
  status: text("status").notNull().default("active"),
  // Billing period
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ── Types ──────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
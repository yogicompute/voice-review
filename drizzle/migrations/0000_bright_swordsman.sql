CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('superhappy', 'happy', 'neutral', 'sad', 'angry');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text,
	"logo_url" text,
	"api_key" text NOT NULL,
	"api_secret" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"audio_url" text,
	"audio_duration" real,
	"transcript" text,
	"status" "review_status" DEFAULT 'processing' NOT NULL,
	"rating" integer,
	"sentiment" "sentiment",
	"likely_return_rate" real,
	"issue_flag" boolean DEFAULT false,
	"summary" text,
	"raw_metrics" text,
	"customer_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"reviews_per_month" integer DEFAULT 50 NOT NULL,
	"audio_access" boolean DEFAULT false NOT NULL,
	"advanced_metrics" boolean DEFAULT false NOT NULL,
	"max_businesses" integer DEFAULT 1 NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "businesses_user_id_idx" ON "businesses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_idx" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_api_key_idx" ON "businesses" USING btree ("api_key");--> statement-breakpoint
CREATE INDEX "reviews_business_id_idx" ON "reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");
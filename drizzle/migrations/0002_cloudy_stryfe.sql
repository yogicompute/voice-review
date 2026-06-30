CREATE TABLE "digests" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"prev_total_reviews" integer DEFAULT 0 NOT NULL,
	"avg_rating" real DEFAULT 0 NOT NULL,
	"sentiment_score" real DEFAULT 0 NOT NULL,
	"sentiment_delta" real DEFAULT 0 NOT NULL,
	"issue_count" integer DEFAULT 0 NOT NULL,
	"headline" text,
	"top_complaint" text,
	"top_complaint_mentions" integer DEFAULT 0,
	"top_praise" text,
	"top_praise_mentions" integer DEFAULT 0,
	"recommendation" text,
	"retention_lift" integer DEFAULT 0,
	"delivered_email" boolean DEFAULT false NOT NULL,
	"delivered_slack" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "digest_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "digest_email" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "digest_slack_webhook" text;--> statement-breakpoint
ALTER TABLE "digests" ADD CONSTRAINT "digests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "digests_business_id_idx" ON "digests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "digests_created_at_idx" ON "digests" USING btree ("created_at");
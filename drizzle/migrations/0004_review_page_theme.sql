ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "review_page_style" text DEFAULT 'gradient' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "review_page_color" text DEFAULT '#059669' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "review_page_message" text;
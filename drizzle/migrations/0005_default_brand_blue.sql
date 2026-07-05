ALTER TABLE "businesses" ALTER COLUMN "review_page_color" SET DEFAULT '#7fa7cf';--> statement-breakpoint
UPDATE "businesses" SET "review_page_color"='#7fa7cf' WHERE "review_page_color"='#059669';
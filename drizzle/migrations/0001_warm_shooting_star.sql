ALTER TABLE "users" RENAME COLUMN "stripe_customer_id" TO "razorpay_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
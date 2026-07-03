CREATE TYPE "public"."cancellation_status" AS ENUM('none', 'requested', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cancellation_status" "cancellation_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "cancel_responded_at" timestamp with time zone;
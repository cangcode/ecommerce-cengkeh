-- Migration: Add return_status to order_items
-- Enables buyer return request → seller approve/reject → refund flow

-- 1. Create enum type
DO $$ BEGIN
  CREATE TYPE "return_status" AS ENUM (
    'none',
    'requested',
    'approved',
    'rejected',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add columns to order_items
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "return_status" "return_status" NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "return_reason" text,
  ADD COLUMN IF NOT EXISTS "return_responded_at" timestamptz;

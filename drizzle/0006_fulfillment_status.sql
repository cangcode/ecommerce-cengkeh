-- Migration: Add fulfillment_status to order_items
-- Enables sellers to track order fulfillment: menunggu → diproses → dikirim → selesai

-- 1. Create enum type
DO $$ BEGIN
  CREATE TYPE "fulfillment_status" AS ENUM (
    'menunggu',
    'diproses',
    'dikirim',
    'selesai',
    'dibatalkan'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add column to order_items
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "fulfillment_status" "fulfillment_status"
  NOT NULL
  DEFAULT 'menunggu';

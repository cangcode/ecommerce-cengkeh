-- Migration: Remove min_purchase from vouchers
ALTER TABLE "vouchers" DROP COLUMN IF EXISTS "min_purchase";

-- Migration: Add vouchers table
-- Enables sellers to create discount vouchers for buyers

DO $$ BEGIN
  CREATE TYPE "voucher_discount_type" AS ENUM ('fixed', 'percent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "vouchers" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "seller_id" bigint NOT NULL REFERENCES "seller_profiles"("id"),
  "code" text NOT NULL UNIQUE,
  "discount_type" "voucher_discount_type" NOT NULL,
  "discount_value" bigint NOT NULL,
  "min_purchase" bigint DEFAULT 0,
  "max_discount" bigint,
  "usage_limit" integer NOT NULL DEFAULT 1,
  "used_count" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "vouchers_code_idx" ON "vouchers"("code");
CREATE INDEX IF NOT EXISTS "vouchers_seller_id_idx" ON "vouchers"("seller_id");

-- 1. Ubah semua data 'gram' -> 'kg' dulu supaya gak gagal cast
UPDATE "order_items" SET "product_weight_unit" = 'kg' WHERE "product_weight_unit" = 'gram';--> statement-breakpoint
UPDATE "products" SET "weight_unit" = 'kg' WHERE "weight_unit" = 'gram';--> statement-breakpoint

-- 2. Konversi kolom ke text sementara
ALTER TABLE "order_items" ALTER COLUMN "product_weight_unit" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight_unit" SET DATA TYPE text;--> statement-breakpoint

-- 3. Ganti enum
DROP TYPE "public"."weight_unit";--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('kg');--> statement-breakpoint

-- 4. Kembalikan kolom ke enum
ALTER TABLE "order_items" ALTER COLUMN "product_weight_unit" SET DATA TYPE "public"."weight_unit" USING "product_weight_unit"::"public"."weight_unit";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight_unit" SET DATA TYPE "public"."weight_unit" USING "weight_unit"::"public"."weight_unit";

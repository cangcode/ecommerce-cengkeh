-- Migration: Add per_unit voucher discount type
-- Enables "Potongan per Kg" vouchers where discount = total_weight_kg × discount_value

ALTER TYPE "voucher_discount_type" ADD VALUE 'per_unit';

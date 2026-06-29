import { vouchers } from "@/db/schema";
import { db } from "@/index";
import { eq, and, desc } from "drizzle-orm";

export type VoucherRow = {
  id: number;
  seller_id: number;
  code: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type VoucherApplyResult = {
  valid: boolean;
  message?: string;
  voucher?: VoucherRow;
  discount_amount?: number;
};

export async function getSellerVouchers(sellerId: number): Promise<VoucherRow[]> {
  return db
    .select()
    .from(vouchers)
    .where(eq(vouchers.seller_id, sellerId))
    .orderBy(desc(vouchers.created_at));
}

export async function createVoucher(
  sellerId: number,
  data: {
    code: string;
    discount_type: "fixed" | "percent";
    discount_value: number;
    min_purchase?: number;
    max_discount?: number;
    usage_limit?: number;
    expires_at?: string;
  },
) {
  const [result] = await db
    .insert(vouchers)
    .values({
      seller_id: sellerId,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_purchase: data.min_purchase,
      max_discount: data.discount_type === "percent" ? data.max_discount ?? null : null,
      usage_limit: data.usage_limit,
      expires_at: data.expires_at ? new Date(data.expires_at) : null,
    })
    .returning();
  return result;
}

export async function toggleVoucherStatus(voucherId: number, sellerId: number) {
  const [voucher] = await db
    .select({ is_active: vouchers.is_active })
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.seller_id, sellerId)))
    .limit(1);

  if (!voucher) return null;

  const [updated] = await db
    .update(vouchers)
    .set({ is_active: !voucher.is_active, updated_at: new Date() })
    .where(eq(vouchers.id, voucherId))
    .returning();
  return updated;
}

export async function deleteVoucher(voucherId: number, sellerId: number) {
  const [deleted] = await db
    .delete(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.seller_id, sellerId)))
    .returning({ id: vouchers.id });
  return deleted ?? null;
}

/** Pembeli apply kode voucher */
export async function applyVoucherCode(
  code: string,
  subtotal: number,
): Promise<VoucherApplyResult> {
  const normalizedCode = code.trim().toUpperCase();

  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.code, normalizedCode), eq(vouchers.is_active, true)))
    .limit(1);

  if (!voucher) {
    return { valid: false, message: "Kode voucher tidak ditemukan." };
  }

  // Cek expired
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    return { valid: false, message: "Voucher sudah kadaluarsa." };
  }

  // Cek usage limit
  if (voucher.used_count >= voucher.usage_limit) {
    return { valid: false, message: "Voucher sudah mencapai batas pemakaian." };
  }

  // Cek min purchase
  if (subtotal < voucher.min_purchase) {
    return {
      valid: false,
      message: `Minimal belanja ${voucher.min_purchase.toLocaleString('id-ID')} untuk pakai voucher ini.`,
    };
  }

  // Hitung diskon
  let discount = 0;
  if (voucher.discount_type === "fixed") {
    discount = voucher.discount_value;
  } else {
    discount = Math.floor((subtotal * voucher.discount_value) / 100);
    if (voucher.max_discount && discount > voucher.max_discount) {
      discount = voucher.max_discount;
    }
  }

  // Diskon tidak boleh melebihi subtotal
  if (discount > subtotal) discount = subtotal;

  return {
    valid: true,
    voucher: voucher as VoucherRow,
    discount_amount: discount,
  };
}

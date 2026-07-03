"use server";

import {
  orders,
  order_items,
  addresses,
  districts,
  villages,
  users,
} from "@/db/schema";
import { db } from "@/index";
import { eq, desc, and, inArray, lt, sql } from "drizzle-orm";

export type FulfillmentStatus =
  | "menunggu"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";

export type ReturnStatus =
  | "none"
  | "requested"
  | "approved"
  | "rejected"
  | "refunded";

export type CancellationStatus = "none" | "requested" | "approved" | "rejected";

export type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  product_title: string;
  product_price: number;
  product_weight_unit: "gram" | "kg";
  quantity: number;
  subtotal: number;
  shipping_method: "ambil_sendiri" | "antarkan";
  shipping_cost: number;
  fulfillment_status: FulfillmentStatus;
  return_status: ReturnStatus;
  return_reason: string | null;
  return_responded_at: Date | null;
  cancellation_status: CancellationStatus;
  cancel_reason: string | null;
  cancel_responded_at: Date | null;
};

export type OrderRow = {
  id: number;
  user_id: string;
  address_id: number;
  midtrans_order_id: string;
  snap_token: string | null;
  status: "pending" | "paid" | "failed" | "expired";
  gross_amount: number;
  shipping_total: number;
  payment_type: string | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // joined fields
  recipient_name: string | null;
  address: string | null;
  district_name: string | null;
  village_name: string | null;
  items: OrderItemRow[];
};

export async function getUserOrders(userId: string): Promise<OrderRow[]> {
  // Auto-confirm retur yang sudah > 3 hari
  autoConfirmExpiredReturns().catch((e) =>
    console.error("⚠️ [AUTO CONFIRM] getUserOrders:", e),
  );

  const result = await db
    .select({
      id: orders.id,
      user_id: orders.user_id,
      address_id: orders.address_id,
      midtrans_order_id: orders.midtrans_order_id,
      snap_token: orders.snap_token,
      status: orders.status,
      gross_amount: orders.gross_amount,
      shipping_total: orders.shipping_total,
      payment_type: orders.payment_type,
      paid_at: orders.paid_at,
      created_at: orders.created_at,
      updated_at: orders.updated_at,
      recipient_name: addresses.recipient_name,
      address: addresses.address,
      district_name: districts.name,
      village_name: villages.name,
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.address_id, addresses.id))
    .leftJoin(districts, eq(addresses.district_id, districts.id))
    .leftJoin(villages, eq(addresses.village_id, villages.id))
    .where(eq(orders.user_id, userId))
    .orderBy(desc(orders.created_at));

  // Ambil items untuk setiap order
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, order.id))
        .orderBy(order_items.id);
      return { ...order, items: items as unknown as OrderItemRow[] };
    }),
  );

  return ordersWithItems;
}

export type SellerOrderItemRow = OrderItemRow;

export type SellerOrderRow = {
  order_id: number;
  midtrans_order_id: string;
  status: "pending" | "paid" | "failed" | "expired";
  gross_amount: number;
  paid_at: Date | null;
  created_at: Date;
  // buyer info
  buyer_name: string | null;
  buyer_email: string | null;
  // shipping
  recipient_name: string | null;
  address: string | null;
  district_name: string | null;
  village_name: string | null;
  // items milik seller ini saja
  items: SellerOrderItemRow[];
};

/** Ambil pesanan yang masuk untuk penjual tertentu */
export async function getSellerOrders(
  sellerId: number,
): Promise<SellerOrderRow[]> {
  // Auto-confirm retur yang sudah > 3 hari
  autoConfirmExpiredReturns().catch((e) =>
    console.error("⚠️ [AUTO CONFIRM] getSellerOrders:", e),
  );

  // 1. Ambil semua order_items milik seller ini
  const sellerItems = await db
    .select()
    .from(order_items)
    .where(eq(order_items.seller_id, sellerId))
    .orderBy(order_items.id);

  if (!sellerItems.length) return [];

  // 2. Kumpulkan unique order_id untuk di-join ke orders
  const orderIds = [...new Set(sellerItems.map((i) => i.order_id))];

  // 3. Ambil orders + shipping info + buyer info
  const orderRows = await db
    .select({
      id: orders.id,
      user_id: orders.user_id,
      midtrans_order_id: orders.midtrans_order_id,
      status: orders.status,
      gross_amount: orders.gross_amount,
      paid_at: orders.paid_at,
      created_at: orders.created_at,
      recipient_name: addresses.recipient_name,
      address: addresses.address,
      district_name: districts.name,
      village_name: villages.name,
      buyer_name: users.username,
      buyer_email: users.email,
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.address_id, addresses.id))
    .leftJoin(districts, eq(addresses.district_id, districts.id))
    .leftJoin(villages, eq(addresses.village_id, villages.id))
    .leftJoin(users, eq(orders.user_id, users.id))
    .where(inArray(orders.id, orderIds))
    .orderBy(desc(orders.created_at));

  // 4. Gabungkan: setiap order hanya tampilkan items milik seller ini
  return orderRows.map((order) => ({
    order_id: order.id,
    midtrans_order_id: order.midtrans_order_id,
    status: order.status,
    gross_amount: order.gross_amount,
    paid_at: order.paid_at,
    created_at: order.created_at,
    buyer_name: order.buyer_name,
    buyer_email: order.buyer_email,
    recipient_name: order.recipient_name,
    address: order.address,
    district_name: order.district_name,
    village_name: order.village_name,
    items: sellerItems.filter(
      (i) => i.order_id === order.id,
    ) as unknown as SellerOrderItemRow[],
  }));
}

/** Pembeli mengajukan retur — hanya untuk item metode "antarkan" yang sudah dikirim */
export async function requestReturnItem(itemId: number, reason: string) {
  const [updated] = await db
    .update(order_items)
    .set({
      return_status: "requested",
      return_reason: reason,
    })
    .where(
      and(
        eq(order_items.id, itemId),
        eq(order_items.shipping_method, "antarkan"),
        eq(order_items.fulfillment_status, "dikirim"),
        eq(order_items.return_status, "none"),
      ),
    )
    .returning();

  return updated ?? null;
}

/** Penjual menyetujui atau menolak retur */
export async function respondReturnItem(
  itemId: number,
  sellerId: number,
  action: "approved" | "rejected",
) {
  const [updated] = await db
    .update(order_items)
    .set({
      return_status: action,
      return_responded_at: new Date(),
    })
    .where(
      and(
        eq(order_items.id, itemId),
        eq(order_items.seller_id, sellerId),
        eq(order_items.return_status, "requested"),
      ),
    )
    .returning();

  return updated ?? null;
}

/** Pembeli mengajukan pembatalan — item yang masih menunggu/diproses */
export async function requestCancelItem(itemId: number, reason: string) {
  const [updated] = await db
    .update(order_items)
    .set({
      cancellation_status: "requested",
      cancel_reason: reason,
    })
    .where(
      and(
        eq(order_items.id, itemId),
        eq(order_items.fulfillment_status, "menunggu"),
        eq(order_items.cancellation_status, "none"),
      ),
    )
    .returning();

  return updated ?? null;
}

/** Penjual menyetujui/menolak pembatalan */
export async function respondCancelItem(
  itemId: number,
  sellerId: number,
  action: "approved" | "rejected",
) {
  const setFields: Record<string, unknown> = {
    cancellation_status: action,
    cancel_responded_at: new Date(),
  };
  // Jika disetujui, langsung batalkan pesanan
  if (action === "approved") {
    setFields.fulfillment_status = "dibatalkan";
  }

  const [updated] = await db
    .update(order_items)
    .set(setFields)
    .where(
      and(
        eq(order_items.id, itemId),
        eq(order_items.seller_id, sellerId),
        eq(order_items.cancellation_status, "requested"),
      ),
    )
    .returning();

  return updated ?? null;
}

/** Penjual/Pembeli konfirmasi barang retur sudah sampai kembali → set status refunded */
export async function confirmReturnArrived(itemId: number) {
  const [updated] = await db
    .update(order_items)
    .set({
      return_status: "refunded",
    })
    .where(
      and(
        eq(order_items.id, itemId),
        eq(order_items.return_status, "approved"),
      ),
    )
    .returning();

  return updated ?? null;
}

/** Auto-konfirmasi retur yang sudah disetujui > 3 hari — jalankan saat fetch orders */
export async function autoConfirmExpiredReturns() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const expiredItems = await db
    .select({
      id: order_items.id,
      order_id: order_items.order_id,
      subtotal: order_items.subtotal,
    })
    .from(order_items)
    .where(
      and(
        eq(order_items.return_status, "approved"),
        lt(order_items.return_responded_at, threeDaysAgo),
      ),
    );

  // Import midtrans dynamically to avoid issues
  if (expiredItems.length === 0) return;

  const { coreApi } = await import("@/lib/midtrans");

  for (const item of expiredItems) {
    try {
      // Refund
      if (item.subtotal > 0) {
        const [order] = await db
          .select({ midtrans_order_id: orders.midtrans_order_id })
          .from(orders)
          .where(eq(orders.id, item.order_id))
          .limit(1);

        if (order) {
          await coreApi.transaction.refund(order.midtrans_order_id, {
            amount: item.subtotal,
            reason: "Auto-konfirmasi: barang retur sudah kembali (3 hari)",
          });
        }
      }
      // Set refunded
      await db
        .update(order_items)
        .set({ return_status: "refunded" as const })
        .where(eq(order_items.id, item.id));
    } catch (err) {
      console.error("⚠️ [AUTO CONFIRM RETURN] Gagal:", err);
    }
  }
}

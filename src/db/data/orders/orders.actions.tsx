"use server";

import {
  orders,
  order_items,
  addresses,
  districts,
  villages,
} from "@/db/schema";
import { db } from "@/index";
import { eq, desc } from "drizzle-orm";

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
      return { ...order, items: items as OrderItemRow[] };
    }),
  );

  return ordersWithItems;
}

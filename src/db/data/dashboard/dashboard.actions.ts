"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/index";
import {
  products,
  seller_profiles,
  orders,
  order_items,
  addresses,
} from "@/db/schema";
import { eq, desc, count, sql, and } from "drizzle-orm";

export type DashboardStats = {
  businessName: string;
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentProducts: {
    id: number;
    title: string;
    price: number;
    stock: number;
    weight_unit: string;
    image_url: { public_id: string; secure_url: string }[];
    created_at: Date | null;
  }[];
};

export type BuyerDashboardData = {
  pendingCount: number;
  diprosesCount: number;
  dikirimCount: number;
  selesaiCount: number;
  recentOrders: {
    id: number;
    xendit_invoice_id: string;
    gross_amount: number;
    status: "pending" | "paid" | "failed" | "expired";
    created_at: Date;
    itemCount: number;
  }[];
  defaultAddress: {
    id: number;
    recipient_name: string;
    address: string;
    district_name: string | null;
    village_name: string | null;
  } | null;
};

const _getDashboardStatsBySellerId = async (
  sellerId: number,
): Promise<DashboardStats> => {
  const [totalProducts, stockResult, lowStock, outOfStock, recentProducts] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(products)
        .where(eq(products.seller_id, sellerId)),
      db
        .select({
          total: sql<number>`COALESCE(SUM(${products.stock}), 0)`,
        })
        .from(products)
        .where(eq(products.seller_id, sellerId)),
      db
        .select({ count: count() })
        .from(products)
        .where(
          sql`${products.seller_id} = ${sellerId} AND ${products.stock} > 0 AND ${products.stock} < 10`,
        ),
      db
        .select({ count: count() })
        .from(products)
        .where(
          sql`${products.seller_id} = ${sellerId} AND ${products.stock} = 0`,
        ),
      db
        .select({
          id: products.id,
          title: products.title,
          price: products.price,
          stock: products.stock,
          weight_unit: products.weight_unit,
          image_url: products.image_url,
          created_at: products.created_at,
        })
        .from(products)
        .where(eq(products.seller_id, sellerId))
        .orderBy(desc(products.created_at))
        .limit(5),
    ]);

  return {
    businessName: "",
    totalProducts: totalProducts[0]?.count ?? 0,
    totalStock: Number(stockResult[0]?.total ?? 0),
    lowStockCount: lowStock[0]?.count ?? 0,
    outOfStockCount: outOfStock[0]?.count ?? 0,
    recentProducts: recentProducts as DashboardStats["recentProducts"],
  };
};

export async function getSellerProfileForDashboard(userId: string) {
  const [profile] = await db
    .select({
      id: seller_profiles.id,
      businessName: seller_profiles.business_name,
    })
    .from(seller_profiles)
    .where(eq(seller_profiles.user_id, userId))
    .limit(1);

  return profile ?? null;
}

export const getDashboardStats = async (sellerId: number) =>
  unstable_cache(
    () => _getDashboardStatsBySellerId(sellerId),
    [`dashboard-stats-${sellerId}`],
    {
      revalidate: 60,
      tags: [`dashboard-stats-${sellerId}`],
    },
  )();

export async function getBuyerDashboardData(
  userId: string,
): Promise<BuyerDashboardData> {
  const [statusRow] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${order_items.fulfillment_status} = 'menunggu')::int`,
      diproses: sql<number>`COUNT(*) FILTER (WHERE ${order_items.fulfillment_status} = 'diproses')::int`,
      dikirim: sql<number>`COUNT(*) FILTER (WHERE ${order_items.fulfillment_status} = 'dikirim')::int`,
      selesai: sql<number>`COUNT(*) FILTER (WHERE ${order_items.fulfillment_status} = 'selesai')::int`,
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .where(eq(orders.user_id, userId));

  const recentOrdersRaw = await db
    .select({
      id: orders.id,
      xendit_invoice_id: orders.xendit_invoice_id,
      gross_amount: orders.gross_amount,
      status: orders.status,
      created_at: orders.created_at,
      itemCount: sql<number>`COALESCE(COUNT(${order_items.id}), 0)::int`,
    })
    .from(orders)
    .leftJoin(order_items, eq(orders.id, order_items.order_id))
    .where(eq(orders.user_id, userId))
    .groupBy(orders.id)
    .orderBy(desc(orders.created_at))
    .limit(5);

  const [defaultAddr] = await db
    .select({
      id: addresses.id,
      recipient_name: addresses.recipient_name,
      address: addresses.address,
    })
    .from(addresses)
    .where(and(eq(addresses.user_id, userId), eq(addresses.is_default, true)))
    .limit(1);

  return {
    pendingCount: statusRow?.pending ?? 0,
    diprosesCount: statusRow?.diproses ?? 0,
    dikirimCount: statusRow?.dikirim ?? 0,
    selesaiCount: statusRow?.selesai ?? 0,
    recentOrders: recentOrdersRaw.map((o) => ({
      id: o.id,
      xendit_invoice_id: o.xendit_invoice_id,
      gross_amount: o.gross_amount,
      status: o.status,
      created_at: o.created_at,
      itemCount: o.itemCount,
    })),
    defaultAddress: defaultAddr
      ? {
          id: defaultAddr.id,
          recipient_name: defaultAddr.recipient_name,
          address: defaultAddr.address,
          district_name: null,
          village_name: null,
        }
      : null,
  };
}

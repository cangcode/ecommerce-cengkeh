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
import { eq, desc, count, sql, and, inArray } from "drizzle-orm";

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
    midtrans_order_id: string;
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
          total: sql<number>`COALESCE(SUM(CASE WHEN ${products.weight_unit} = 'gram' THEN ${products.stock} / 1000 ELSE ${products.stock} END), 0)`,
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
    businessName: "", // akan diisi oleh caller
    totalProducts: totalProducts[0]?.count ?? 0,
    totalStock: Number(stockResult[0]?.total ?? 0),
    lowStockCount: lowStock[0]?.count ?? 0,
    outOfStockCount: outOfStock[0]?.count ?? 0,
    recentProducts: recentProducts as DashboardStats["recentProducts"],
  };
};

/** Ambil seller_id + business_name — TIDAK di-cache */
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

/** Ambil statistik dashboard — di-cache dengan tag */
export const getDashboardStats = async (sellerId: number) =>
  unstable_cache(
    () => _getDashboardStatsBySellerId(sellerId),
    [`dashboard-stats-${sellerId}`],
    {
      revalidate: 60,
      tags: [`dashboard-stats-${sellerId}`],
    },
  )();

/** Ambil data dashboard pembeli */
export async function getBuyerDashboardData(
  userId: string,
): Promise<BuyerDashboardData> {
  const [
    pendingCount,
    diprosesCount,
    dikirimCount,
    selesaiCount,
    recentOrdersRaw,
    defaultAddr,
  ] = await Promise.all([
    // Count items by fulfillment_status via orders
    db
      .select({ count: count() })
      .from(order_items)
      .innerJoin(orders, eq(order_items.order_id, orders.id))
      .where(
        and(
          eq(orders.user_id, userId),
          eq(order_items.fulfillment_status, "menunggu"),
        ),
      ),
    db
      .select({ count: count() })
      .from(order_items)
      .innerJoin(orders, eq(order_items.order_id, orders.id))
      .where(
        and(
          eq(orders.user_id, userId),
          eq(order_items.fulfillment_status, "diproses"),
        ),
      ),
    db
      .select({ count: count() })
      .from(order_items)
      .innerJoin(orders, eq(order_items.order_id, orders.id))
      .where(
        and(
          eq(orders.user_id, userId),
          eq(order_items.fulfillment_status, "dikirim"),
        ),
      ),
    db
      .select({ count: count() })
      .from(order_items)
      .innerJoin(orders, eq(order_items.order_id, orders.id))
      .where(
        and(
          eq(orders.user_id, userId),
          eq(order_items.fulfillment_status, "selesai"),
        ),
      ),
    // Recent orders (last 5)
    db
      .select({
        id: orders.id,
        midtrans_order_id: orders.midtrans_order_id,
        gross_amount: orders.gross_amount,
        status: orders.status,
        created_at: orders.created_at,
      })
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at))
      .limit(5),
    // Default address
    db
      .select({
        id: addresses.id,
        recipient_name: addresses.recipient_name,
        address: addresses.address,
        district_name: sql<string | null>`NULL`,
        village_name: sql<string | null>`NULL`,
      })
      .from(addresses)
      .where(and(eq(addresses.user_id, userId), eq(addresses.is_default, true)))
      .limit(1),
  ]);

  // Hitung jumlah item per order
  const orderIds = recentOrdersRaw.map((o) => o.id);
  const itemCounts =
    orderIds.length > 0
      ? await db
          .select({
            order_id: order_items.order_id,
            count: count(),
          })
          .from(order_items)
          .where(inArray(order_items.order_id, orderIds))
          .groupBy(order_items.order_id)
      : [];

  const countMap = new Map(itemCounts.map((r) => [r.order_id, r.count]));

  return {
    pendingCount: pendingCount[0]?.count ?? 0,
    diprosesCount: diprosesCount[0]?.count ?? 0,
    dikirimCount: dikirimCount[0]?.count ?? 0,
    selesaiCount: selesaiCount[0]?.count ?? 0,
    recentOrders: recentOrdersRaw.map((o) => ({
      ...o,
      itemCount: countMap.get(o.id) ?? 0,
    })),
    defaultAddress:
      defaultAddr.length > 0
        ? {
            id: defaultAddr[0].id,
            recipient_name: defaultAddr[0].recipient_name,
            address: defaultAddr[0].address,
            district_name: null,
            village_name: null,
          }
        : null,
  };
}

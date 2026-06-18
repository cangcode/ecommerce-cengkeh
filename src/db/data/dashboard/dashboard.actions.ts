"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/index";
import { products, seller_profiles } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

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

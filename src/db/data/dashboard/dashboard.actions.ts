"use server";

import { db } from "@/index";
import { products, seller_profiles } from "@/db/schema";
import { auth } from "@/auth";
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

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [profile] = await db
    .select({
      id: seller_profiles.id,
      businessName: seller_profiles.business_name,
    })
    .from(seller_profiles)
    .where(eq(seller_profiles.user_id, session.user.id))
    .limit(1);

  if (!profile) return null;

  const sellerId = profile.id;

  const [totalProducts] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.seller_id, sellerId));

  const [stockResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${products.stock}), 0)`,
    })
    .from(products)
    .where(eq(products.seller_id, sellerId));

  const [lowStock] = await db
    .select({ count: count() })
    .from(products)
    .where(
      sql`${products.seller_id} = ${sellerId} AND ${products.stock} > 0 AND ${products.stock} < 10`,
    );

  const [outOfStock] = await db
    .select({ count: count() })
    .from(products)
    .where(sql`${products.seller_id} = ${sellerId} AND ${products.stock} = 0`);

  const recentProducts = await db
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
    .limit(5);

  return {
    businessName: profile.businessName,
    totalProducts: totalProducts?.count ?? 0,
    totalStock: Number(stockResult?.total ?? 0),
    lowStockCount: lowStock?.count ?? 0,
    outOfStockCount: outOfStock?.count ?? 0,
    recentProducts: recentProducts as DashboardStats["recentProducts"],
  };
}

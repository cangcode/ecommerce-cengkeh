"use server";

import { db } from "@/index";
import { products, seller_profiles } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { createProductSchema } from "./products.schema";

export type AdminProductRow = {
  id: number;
  seller_id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  wholesale_price: number | null;
  wholesale_qty: number | null;
  weight_unit: "gram" | "kg";
  stock: number;
  image_url: { public_id: string; secure_url: string }[];
  buyer_count: number;
  sold_count: number;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  business_name: string | null;
};

export async function getAllProductsForAdmin(
  search?: string,
): Promise<AdminProductRow[]> {
  const where = search
    ? sql`regexp_replace(lower(${products.title}), '\\s+', '', 'g') LIKE ${`%${search.trim().replace(/\s+/g, "").toLowerCase()}%`}`
    : undefined;

  const rows = await db
    .select({
      id: products.id,
      seller_id: products.seller_id,
      slug: products.slug,
      title: products.title,
      description: products.description,
      price: products.price,
      wholesale_price: products.wholesale_price,
      wholesale_qty: products.wholesale_qty,
      weight_unit: products.weight_unit,
      stock: products.stock,
      image_url: products.image_url,
      buyer_count: products.buyer_count,
      sold_count: products.sold_count,
      is_active: products.is_active,
      created_at: products.created_at,
      updated_at: products.updated_at,
      business_name: seller_profiles.business_name,
    })
    .from(products)
    .leftJoin(seller_profiles, eq(products.seller_id, seller_profiles.id))
    .where(where)
    .orderBy(desc(products.created_at));

  return rows;
}

export async function toggleProductActive(id: number) {
  const [current] = await db
    .select({ is_active: products.is_active })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!current) return null;

  const [updated] = await db
    .update(products)
    .set({ is_active: !current.is_active, updated_at: new Date() })
    .where(eq(products.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteProduct(id: number) {
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  return deleted ?? null;
}

export async function createProductForAdmin(
  data: z.infer<typeof createProductSchema>,
) {
  const validated = createProductSchema.parse(data);
  const [row] = await db.insert(products).values(validated).returning();
  return row ?? null;
}

export async function updateProductForAdmin(
  id: number,
  data: Partial<z.infer<typeof createProductSchema>>,
) {
  const [updated] = await db
    .update(products)
    .set({ ...data, updated_at: new Date() })
    .where(eq(products.id, id))
    .returning();

  return updated ?? null;
}

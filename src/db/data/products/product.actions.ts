"use server";

import { products } from "@/db/schema";
import { db } from "@/index";
import { createProductSchema } from "./products.schema";
import z from "zod";
import { and, eq, sql } from "drizzle-orm";

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  const validated = createProductSchema.parse(data);

  const productsData = await db.insert(products).values({
    seller_id: validated.seller_id,
    slug: validated.slug,
    title: validated.title,
    description: validated.description,
    price: validated.price,
    wholesale_price: validated.wholesale_price,
    wholesale_qty: validated.wholesale_qty,
    weight_unit: validated.weight_unit,
    stock: validated.stock,
    image_url: validated.image_url,
  });
  return productsData;
}

export async function getProducts({
  search,
  page,
  seller_id,
}: {
  search: string;
  page: number;
  seller_id: number;
}) {
  const normalizedSearch = search.trim().replace(/\s+/g, " ");
  const normalizedSearchNoSpace = normalizedSearch
    .replace(/\s+/g, "")
    .toLowerCase();

  const whereCondition = normalizedSearchNoSpace
    ? and(
        eq(products.seller_id, seller_id),
        sql`regexp_replace(lower(${products.title}), '\\s+', '', 'g') LIKE ${`%${normalizedSearchNoSpace}%`}`,
      )
    : eq(products.seller_id, seller_id);

  const result = await db
    .select()
    .from(products)
    .where(whereCondition)
    .limit(10)
    .offset((page - 1) * 10);

  return result;
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  return product ?? null;
}

export async function updateProduct(
  slug: string,
  data: Partial<z.infer<typeof createProductSchema>>,
) {
  const [updated] = await db
    .update(products)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(products.slug, slug))
    .returning();

  return updated ?? null;
}

/** Ambil semua produk aktif untuk halaman publik /product */
export async function getAllProducts({
  search,
  page,
}: {
  search: string;
  page: number;
}) {
  const normalizedSearch = search.trim().replace(/\s+/g, " ");
  const normalizedSearchNoSpace = normalizedSearch
    .replace(/\s+/g, "")
    .toLowerCase();

  const whereCondition = normalizedSearchNoSpace
    ? and(
        eq(products.is_active, true),
        sql`regexp_replace(lower(${products.title}), '\\s+', '', 'g') LIKE ${`%${normalizedSearchNoSpace}%`}`,
      )
    : eq(products.is_active, true);

  const result = await db
    .select()
    .from(products)
    .where(whereCondition)
    .limit(20)
    .offset((page - 1) * 20);

  return result;
}

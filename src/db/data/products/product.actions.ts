"use server";

import { products, seller_profiles } from "@/db/schema";
import { db } from "@/index";
import { createProductSchema } from "./products.schema";
import z from "zod";
import { and, eq, or, sql } from "drizzle-orm";

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
        or(
          sql`regexp_replace(lower(${products.title}), '\\s+', '', 'g') LIKE ${`%${normalizedSearchNoSpace}%`}`,
          sql`regexp_replace(lower(${seller_profiles.business_name}), '\\s+', '', 'g') LIKE ${`%${normalizedSearchNoSpace}%`}`,
        ),
      )
    : eq(products.is_active, true);

  const result = await db
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
    .where(whereCondition)
    .limit(20)
    .offset((page - 1) * 20);

  return result;
}

/** Ambil produk unggulan untuk homepage – berdasarkan sold_count tertinggi */
export async function getFeaturedProducts(limit = 8) {
  const result = await db
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
    .where(eq(products.is_active, true))
    .orderBy(sql`${products.sold_count} DESC`)
    .limit(limit);

  return result;
}

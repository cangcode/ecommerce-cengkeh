"use server";

import { charts, chart_items, products, seller_profiles } from "@/db/schema";
import { db } from "@/index";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";

/** Ambil (atau buat jika belum ada) chart milik user */
export async function getOrCreateChart(userId: string) {
  const [existing] = await db
    .select({ id: charts.id })
    .from(charts)
    .where(eq(charts.user_id, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(charts)
    .values({ user_id: userId })
    .returning({ id: charts.id });

  return created;
}

/** Tambahkan item ke chart (atau update qty jika sudah ada product yang sama) */
export async function addItemToChart(productId: number, quantity: number) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Kamu harus login terlebih dahulu." };
  }

  try {
    // 1. Pastikan chart ada
    const chart = await getOrCreateChart(session.user.id);

    // 2. Cek apakah produk ini sudah ada di chart
    const [existingItem] = await db
      .select({ id: chart_items.id, quantity: chart_items.quantity })
      .from(chart_items)
      .where(
        and(
          eq(chart_items.chart_id, chart.id),
          eq(chart_items.product_id, productId),
        ),
      )
      .limit(1);

    if (existingItem) {
      // Update qty
      await db
        .update(chart_items)
        .set({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date(),
        })
        .where(eq(chart_items.id, existingItem.id));
    } else {
      // Insert baru
      await db.insert(chart_items).values({
        chart_id: chart.id,
        product_id: productId,
        quantity,
      });
    }

    return {
      success: true,
      message: "Produk berhasil ditambahkan ke keranjang!",
    };
  } catch (error) {
    console.error("Add to Chart Error:", error);
    return { success: false, message: "Gagal menambahkan ke keranjang." };
  }
}

/** Ambil semua item di keranjang user (join produk + penjual) */
export async function getChartItems(userId: string) {
  try {
    const chart = await getOrCreateChart(userId);

    const items = await db
      .select({
        id: chart_items.id,
        quantity: chart_items.quantity,
        product_id: products.id,
        product_title: products.title,
        product_slug: products.slug,
        product_price: products.price,
        product_wholesale_price: products.wholesale_price,
        product_wholesale_qty: products.wholesale_qty,
        product_weight_unit: products.weight_unit,
        product_stock: products.stock,
        product_image_url: products.image_url,
        product_is_active: products.is_active,
        seller_id: seller_profiles.id,
        seller_name: seller_profiles.business_name,
        seller_address: seller_profiles.business_address,
        seller_district_id: seller_profiles.district_id,
      })
      .from(chart_items)
      .innerJoin(products, eq(chart_items.product_id, products.id))
      .innerJoin(seller_profiles, eq(products.seller_id, seller_profiles.id))
      .where(eq(chart_items.chart_id, chart.id))
      .orderBy(chart_items.id);

    return items;
  } catch (error) {
    console.error("Get Chart Items Error:", error);
    return [];
  }
}

/** Hapus item dari keranjang */
export async function deleteItemFromChart(itemId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Kamu harus login terlebih dahulu." };
  }

  try {
    const chart = await getOrCreateChart(session.user.id);

    await db
      .delete(chart_items)
      .where(
        and(eq(chart_items.id, itemId), eq(chart_items.chart_id, chart.id)),
      );

    return { success: true, message: "Item berhasil dihapus dari keranjang!" };
  } catch (error) {
    console.error("Delete Chart Item Error:", error);
    return { success: false, message: "Gagal menghapus item." };
  }
}

/** Update quantity item di keranjang */
export async function updateItemQuantity(itemId: number, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Kamu harus login terlebih dahulu." };
  }

  try {
    const chart = await getOrCreateChart(session.user.id);

    await db
      .update(chart_items)
      .set({ quantity, updated_at: new Date() })
      .where(
        and(eq(chart_items.id, itemId), eq(chart_items.chart_id, chart.id)),
      );

    return { success: true, message: "Jumlah berhasil diperbarui!" };
  } catch (error) {
    console.error("Update Chart Item Error:", error);
    return { success: false, message: "Gagal memperbarui jumlah." };
  }
}

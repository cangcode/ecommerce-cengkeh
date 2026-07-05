import { seller_profiles, districts, villages, products } from "@/db/schema";
import { createSellerProfileSchema } from "./seller-profiles.schema";
import { db } from "@/index";
import { auth } from "@/auth";
import z from "zod";
import { eq, and, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function createSellerProfile(
  data: z.infer<typeof createSellerProfileSchema>,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized: Kamu harus login terlebih dahulu.",
    };
  }

  try {
    // Upsert district & village dari payload (sebelum Zod strip)
    const raw = data as Record<string, unknown>;
    if (raw.district_name && typeof raw.district_name === "string") {
      await db
        .insert(districts)
        .values({ id: String(raw.district_id), name: raw.district_name })
        .onConflictDoUpdate({
          target: districts.id,
          set: { name: raw.district_name },
        });
    }
    if (raw.village_name && typeof raw.village_name === "string") {
      await db
        .insert(villages)
        .values({
          id: String(raw.village_id),
          district_id: String(raw.district_id),
          name: raw.village_name,
        })
        .onConflictDoUpdate({
          target: villages.id,
          set: { name: raw.village_name, district_id: String(raw.district_id) },
        });
    }

    const validated = createSellerProfileSchema.parse(data);

    const [profile] = await db
      .insert(seller_profiles)
      .values({
        user_id: session.user.id,
        ...validated,
      })
      .returning({ id: seller_profiles.id });

    // Hapus cache statistik dashboard jika ada
    revalidateTag(`dashboard-stats-${profile.id}`, {});

    return {
      success: true,
      message: "Profil berhasil dibuat!",
      id: profile.id,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: "Gagal membuat profil..",
    };
  }
}

export async function checkHasSellerProfile(userId: string) {
  const [profile] = await db
    .select({ id: seller_profiles.id })
    .from(seller_profiles)
    .where(eq(seller_profiles.user_id, userId))
    .limit(1);

  return profile;
}

export async function getSellerProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(seller_profiles)
    .where(eq(seller_profiles.user_id, userId))
    .limit(1);

  return profile ?? null;
}

/** Ambil profil toko berdasarkan seller_profiles.id (untuk halaman publik) */
export async function getSellerProfileById(sellerId: number) {
  const [profile] = await db
    .select({
      id: seller_profiles.id,
      business_name: seller_profiles.business_name,
      business_address: seller_profiles.business_address,
      phone: seller_profiles.phone,
      description: seller_profiles.description,
      district_id: seller_profiles.district_id,
      village_id: seller_profiles.village_id,
    })
    .from(seller_profiles)
    .where(eq(seller_profiles.id, sellerId))
    .limit(1);

  return profile ?? null;
}

/** Ambil produk aktif dari seller tertentu (untuk halaman publik) */
export async function getProductsBySellerId(sellerId: number) {
  const result = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      description: products.description,
      price: products.price,
      wholesale_price: products.wholesale_price,
      wholesale_qty: products.wholesale_qty,
      weight_unit: products.weight_unit,
      stock: products.stock,
      image_url: products.image_url,
      sold_count: products.sold_count,
    })
    .from(products)
    .where(and(eq(products.seller_id, sellerId), eq(products.is_active, true)))
    .orderBy(products.created_at);

  return result;
}

/** Ambil produk terlaris dari seller (sold_count > 0, max 4) */
export async function getBestSellersBySellerId(sellerId: number) {
  const result = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      description: products.description,
      price: products.price,
      wholesale_price: products.wholesale_price,
      wholesale_qty: products.wholesale_qty,
      weight_unit: products.weight_unit,
      stock: products.stock,
      image_url: products.image_url,
      sold_count: products.sold_count,
    })
    .from(products)
    .where(and(eq(products.seller_id, sellerId), eq(products.is_active, true)))
    .orderBy(desc(products.sold_count))
    .limit(4);

  // Hanya return yang sold_count > 0
  return result.filter((p) => p.sold_count > 0);
}

export async function updateSellerProfile(
  userId: string,
  data: z.infer<typeof createSellerProfileSchema>,
) {
  try {
    // Upsert district & village dari payload (sebelum Zod strip)
    const raw = data as Record<string, unknown>;
    if (raw.district_name && typeof raw.district_name === "string") {
      await db
        .insert(districts)
        .values({ id: String(raw.district_id), name: raw.district_name })
        .onConflictDoUpdate({
          target: districts.id,
          set: { name: raw.district_name },
        });
    }
    if (raw.village_name && typeof raw.village_name === "string") {
      await db
        .insert(villages)
        .values({
          id: String(raw.village_id),
          district_id: String(raw.district_id),
          name: raw.village_name,
        })
        .onConflictDoUpdate({
          target: villages.id,
          set: { name: raw.village_name, district_id: String(raw.district_id) },
        });
    }

    const validated = createSellerProfileSchema.parse(data);

    const [updated] = await db
      .update(seller_profiles)
      .set({
        ...validated,
      })
      .where(eq(seller_profiles.user_id, userId))
      .returning();

    // Hapus cache statistik dashboard setelah update
    if (updated) {
      revalidateTag(`dashboard-stats-${updated.id}`, {});
    }

    return {
      success: true,
      message: "Profil toko berhasil diperbarui!",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: "Gagal memperbarui profil toko.",
    };
  }
}

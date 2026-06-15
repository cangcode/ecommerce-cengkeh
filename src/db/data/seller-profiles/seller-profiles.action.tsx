import { seller_profiles } from "@/db/schema";
import { createSellerProfileSchema } from "./seller-profiles.schema";
import { db } from "@/index";
import { auth } from "@/auth";
import z from "zod";
import { eq } from "drizzle-orm";

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
    const validated = createSellerProfileSchema.parse(data);

    const [profile] = await db
      .insert(seller_profiles)
      .values({
        user_id: session.user.id,
        ...validated,
      })
      .returning({ id: seller_profiles.id });

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

export async function updateSellerProfile(
  userId: string,
  data: z.infer<typeof createSellerProfileSchema>,
) {
  try {
    const validated = createSellerProfileSchema.parse(data);

    const [updated] = await db
      .update(seller_profiles)
      .set({
        ...validated,
      })
      .where(eq(seller_profiles.user_id, userId))
      .returning();

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

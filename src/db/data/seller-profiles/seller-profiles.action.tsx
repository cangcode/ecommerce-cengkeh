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

    await db.insert(seller_profiles).values({
      user_id: session.user.id,
      ...validated,
    });

    return { success: true, message: "Profil berhasil dibuat!" };
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

  const hasProfile = !!profile;

  return hasProfile;
}

"use server";

import { db } from "@/index";
import { seller_profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getShippingPrice(userId: string) {
  const [profile] = await db
    .select({ shipping_price_per_kg: seller_profiles.shipping_price_per_kg })
    .from(seller_profiles)
    .where(eq(seller_profiles.user_id, userId))
    .limit(1);

  return profile?.shipping_price_per_kg ?? 0;
}

export async function updateShippingPrice(userId: string, price: number) {
  await db
    .update(seller_profiles)
    .set({ shipping_price_per_kg: price })
    .where(eq(seller_profiles.user_id, userId));
}

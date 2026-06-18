"use server";

import { villages } from "@/db/schema";
import { db } from "@/index";
import { eq } from "drizzle-orm";

/** Upsert satu village: insert jika belum ada, update nama jika sudah ada */
export async function upsertVillage(
  id: string,
  district_id: string,
  name: string,
) {
  try {
    await db
      .insert(villages)
      .values({ id, district_id, name })
      .onConflictDoUpdate({
        target: villages.id,
        set: { name, district_id },
      });
  } catch (error) {
    console.error("Upsert Village Error:", error);
  }
}

/** Ambil nama village berdasarkan ID */
export async function getVillageName(id: string) {
  const [row] = await db
    .select({ name: villages.name })
    .from(villages)
    .where(eq(villages.id, id))
    .limit(1);
  return row?.name ?? null;
}

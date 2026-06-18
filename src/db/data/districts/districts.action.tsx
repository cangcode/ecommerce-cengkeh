"use server";

import { districts } from "@/db/schema";
import { db } from "@/index";
import { eq } from "drizzle-orm";

/** Upsert satu district: insert jika belum ada, update nama jika sudah ada */
export async function upsertDistrict(id: string, name: string) {
  try {
    await db.insert(districts).values({ id, name }).onConflictDoUpdate({
      target: districts.id,
      set: { name },
    });
  } catch (error) {
    console.error("Upsert District Error:", error);
  }
}

/** Ambil nama district berdasarkan ID */
export async function getDistrictName(id: string) {
  const [row] = await db
    .select({ name: districts.name })
    .from(districts)
    .where(eq(districts.id, id))
    .limit(1);
  return row?.name ?? null;
}

"use server";

import { addresses, districts, villages } from "@/db/schema";
import { createAddressSchema } from "./addresses.schema";
import { db } from "@/index";
import { auth } from "@/auth";
import z from "zod";
import { eq, and } from "drizzle-orm";

export async function createAddress(data: z.infer<typeof createAddressSchema>) {
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

    const validated = createAddressSchema.parse(data);

    // Jika alamat ini dijadikan default, hapus default dari alamat lain
    if (validated.is_default) {
      await db
        .update(addresses)
        .set({ is_default: false })
        .where(eq(addresses.user_id, session.user.id));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        user_id: session.user.id,
        ...validated,
      })
      .returning({ id: addresses.id });

    return {
      success: true,
      message: "Alamat berhasil disimpan!",
      id: newAddress.id,
    };
  } catch (error) {
    console.error("Create Address Error:", error);
    return {
      success: false,
      message:
        "Gagal menyimpan alamat. Pastikan data sudah benar dan coba lagi.",
    };
  }
}

export async function updateAddress(
  addressId: number,
  data: z.infer<typeof createAddressSchema>,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized: Kamu harus login terlebih dahulu.",
    };
  }

  try {
    // Upsert district & village dari payload
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

    const validated = createAddressSchema.parse(data);

    // Jika alamat ini dijadikan default, hapus default dari semua alamat lain user
    if (validated.is_default) {
      await db
        .update(addresses)
        .set({ is_default: false })
        .where(eq(addresses.user_id, session.user.id));
    }

    const [updated] = await db
      .update(addresses)
      .set({
        ...validated,
      })
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.user_id, session.user.id),
        ),
      )
      .returning({ id: addresses.id });

    if (!updated) {
      return {
        success: false,
        message: "Alamat tidak ditemukan atau bukan milik kamu.",
      };
    }

    return {
      success: true,
      message: "Alamat berhasil diperbarui!",
      id: updated.id,
    };
  } catch (error) {
    console.error("Update Address Error:", error);
    return {
      success: false,
      message:
        "Gagal memperbarui alamat. Pastikan data sudah benar dan coba lagi.",
    };
  }
}

export async function getUserAddresses(userId: string) {
  try {
    const result = await db
      .select({
        id: addresses.id,
        address_id: addresses.id,
        user_id: addresses.user_id,
        recipient_name: addresses.recipient_name,
        phone: addresses.phone,
        address: addresses.address,
        district_id: addresses.district_id,
        district_name: districts.name,
        village_id: addresses.village_id,
        village_name: villages.name,
        is_default: addresses.is_default,
      })
      .from(addresses)
      .leftJoin(districts, eq(addresses.district_id, districts.id))
      .leftJoin(villages, eq(addresses.village_id, villages.id))
      .where(eq(addresses.user_id, userId))
      .orderBy(addresses.id);

    return result ?? [];
  } catch (error) {
    console.error("Get Addresses Error:", error);
    return [];
  }
}

export async function deleteAddress(addressId: number) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized: Kamu harus login terlebih dahulu.",
    };
  }

  try {
    await db
      .delete(addresses)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.user_id, session.user.id),
        ),
      );

    return { success: true, message: "Alamat berhasil dihapus!" };
  } catch (error) {
    console.error("Delete Address Error:", error);
    return { success: false, message: "Gagal menghapus alamat." };
  }
}

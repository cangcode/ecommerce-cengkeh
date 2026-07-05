import { db } from "@/index"; // koneksi drizzle Anda
import { users, charts, seller_profiles } from "@/db/schema";
import { eq, or, desc, asc, like, sql } from "drizzle-orm";
import { hash } from "bcrypt-ts";
import { z } from "zod";
import { registerSchema } from "./users.schema";

// Fungsi query murni (hanya mengambil data)
export async function getUserFromDB(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user[0] || null;
  } catch (error) {
    console.error("Gagal mengambil data user:", error);
    return null;
  }
}

type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(rawInput: RegisterInput) {
  try {
    // 1. Validasi Zod
    const validation = await registerSchema.safeParseAsync(rawInput);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message ?? "Data tidak valid.",
      };
    }

    const { username, email, password, role } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // 2. OPTIMASI: Cek email DAN username SEKALIGUS dalam 1 query saja
    const existingUsers = await db
      .select({ email: users.email, username: users.username })
      .from(users)
      .where(
        // Menggunakan operator OR bawaan drizzle
        or(
          eq(users.email, normalizedEmail),
          eq(users.username, normalizedUsername),
        ),
      );

    // Jika ada data yang cocok, cari tahu mana yang kembar
    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.email === normalizedEmail) {
        return {
          success: false,
          message: "Email sudah digunakan oleh akun lain.",
        };
      }
      if (match.username?.toLowerCase() === normalizedUsername) {
        return {
          success: false,
          message: "Username sudah digunakan oleh akun lain.",
        };
      }
    }

    // 3. Hash Password
    const hashedPassword = await hash(password, 10);

    // 4. Insert data dengan aman
    const [newUser] = await db
      .insert(users)
      .values({
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: role ?? "pembeli",
      })
      .returning({ id: users.id, role: users.role });

    // 5. Jika role pembeli, langsung buatkan keranjang (charts)
    if (newUser.role === "pembeli") {
      await db.insert(charts).values({ user_id: newUser.id });
    }

    return { success: true, message: "Akun berhasil dibuat! Silakan masuk." };
  } catch (error) {
    console.error("Error saat registrasi:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

// ── ADMIN ──

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "pembeli" | "penjual";
  createdAt: Date;
  hasSellerProfile: boolean;
  bannedAt: Date | null;
};

/** Ambil semua user untuk admin */
export async function getAllUsers(search?: string): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      bannedAt: users.bannedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Ambil semua seller profile id untuk cek
  const profileIds = new Set(
    (
      await db
        .select({ user_id: seller_profiles.user_id })
        .from(seller_profiles)
    ).map((p) => p.user_id),
  );

  let result = rows.map((u) => ({
    ...u,
    hasSellerProfile: profileIds.has(u.id),
  }));

  // Cek banned: kolom bannedAt ada di schema tapi Drizzle infer type-nya
  // Cast manual untuk aman
  result = result as AdminUserRow[];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }

  return result;
}

/** Admin update role user */
export async function updateUserRole(
  userId: string,
  role: "admin" | "pembeli" | "penjual",
) {
  const [updated] = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  // Jika role berubah jadi pembeli & belum punya keranjang, buatkan
  if (updated?.role === "pembeli") {
    const [existing] = await db
      .select({ id: charts.id })
      .from(charts)
      .where(eq(charts.user_id, userId))
      .limit(1);
    if (!existing) {
      await db.insert(charts).values({ user_id: userId });
    }
  }

  return updated ?? null;
}

/** Admin toggle ban user */
export async function toggleBanUser(userId: string) {
  const [user] = await db
    .select({ bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const isBanned = !!user.bannedAt;
  const [updated] = await db
    .update(users)
    .set({
      bannedAt: isBanned ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, bannedAt: users.bannedAt });

  return updated ?? null;
}

/** Admin reset password user */
export async function resetUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hash(newPassword, 10);

  const [updated] = await db
    .update(users)
    .set({
      passwordHash: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  return updated ?? null;
}

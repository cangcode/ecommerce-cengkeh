import { db } from "@/index"; // koneksi drizzle Anda
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { hash } from "bcrypt-ts";
import { z } from "zod";

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

const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["pembeli", "penjual"]),
});

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
    await db.insert(users).values({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: role ?? "pembeli",
    });

    return { success: true, message: "Akun berhasil dibuat! Silakan masuk." };
  } catch (error) {
    console.error("Error saat registrasi:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

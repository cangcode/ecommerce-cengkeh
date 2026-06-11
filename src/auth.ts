import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserFromDB } from "./db/data/users";
// 1. Import fungsi compare dari bcrypt-ts
import { compare } from "bcrypt-ts";
import z, { object, string } from "zod";

export const signInSchema = object({
  email: z.email({ message: "Format email tidak valid" }),
  password: string("Password harus berupa string")
    .min(1, "Password wajib diisi")
    .min(8, "Password harus terdiri dari minimal 8 karakter")
    .max(32, "Password tidak boleh lebih dari 32 karakter"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Validasi dasar untuk memastikan input email & password ada
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi.");
        }

        const { email, password } = await signInSchema.parseAsync(credentials);

        // 2. Ambil data user dari DB berdasarkan EMAIL SAJA
        const user = await getUserFromDB(email);
        console.log("User yang ditemukan di DB:", user); // Debug: cek data user yang diambil dari DB

        // 3. Jika user tidak ditemukan, langsung lempar error
        if (!user) {
          throw new Error("Akun tidak ditemukan.");
        }

        // 4. Bandingkan password plaintext dari input dengan passwordHash dari database
        const isPasswordValid = await compare(password, user.passwordHash);

        // 5. Jika password salah, lempar error
        if (!isPasswordValid) {
          throw new Error("Password salah.");
        }

        // 6. Jika semua valid, kembalikan objek user untuk membuat session
        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role, // Anda bisa menyertakan role jika dibutuhkan nanti
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Saat pertama kali login, objek 'user' akan tersedia dari return authorize
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Ambil data dari token dan masukkan ke session.user
      if (session.user) {
        session.user.role = (token.role ?? "pembeli") as string;
        // Gunakan token.sub (bawaan NextAuth) atau token.id yang kita set di atas
        session.user.id = (token.id || token.sub) as string;
      }
      return session;
    },
  },
});

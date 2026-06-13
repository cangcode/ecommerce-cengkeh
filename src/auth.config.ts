import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts";
import { getUserFromDB } from "./db/data/users/users.actions";
import z, { object, string } from "zod";
import { seller_profiles } from "./db/schema";
import { db } from ".";
import { eq } from "drizzle-orm";

export const signInSchema = object({
  email: z.email({ message: "Format email tidak valid" }),
  password: string("Password harus berupa string").min(
    1,
    "Password wajib diisi",
  ),
});

export const authConfig = {
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
          return null;
        }

        const { email, password } = await signInSchema.parseAsync(credentials);

        const user = await getUserFromDB(email);

        const isPasswordValid = await compare(
          password,
          user?.passwordHash as string,
        );
        if (!user || !isPasswordValid) {
          return null;
        }

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
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role ?? "pembeli") as string;
        session.user.id = (token.id || token.id) as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Mengalihkan ke halaman kustom /login jika butuh autentikasi
  },
} satisfies NextAuthConfig;

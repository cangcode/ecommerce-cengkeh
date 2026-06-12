import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserFromDB } from "./db/data/users/users.actions";
// 1. Import fungsi compare dari bcrypt-ts
import { compare } from "bcrypt-ts";
import z, { object, string } from "zod";

export const signInSchema = object({
  email: z.email({ message: "Format email tidak valid" }),
  password: string("Password harus berupa string").min(
    1,
    "Password wajib diisi",
  ),
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

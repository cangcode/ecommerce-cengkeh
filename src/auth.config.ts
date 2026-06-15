import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts";
import { getUserFromDB } from "./db/data/users/users.actions";
import z, { object, string } from "zod";
import { seller_profiles } from "./db/schema";
import { db } from ".";
import { eq } from "drizzle-orm";
import { checkHasSellerProfile } from "./db/data/seller-profiles/seller-profiles.action";

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
        const sellerProfile = await checkHasSellerProfile(user?.id);

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          seller_id: sellerProfile?.id || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        // Apapun yang dikirim lewat update(), tangkap di sini
        return { ...token, ...session }; // merge semua field baru ke token
      }
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.seller_id = user.seller_id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role ?? "pembeli") as string;
        session.user.id = (token.id || token.id) as string;
        session.user.seller_id = token.seller_id as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // Tambahkan ini agar dibaca di frontend
      seller_id: number | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    seller_id: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    seller_id?: number | null;
  }
}

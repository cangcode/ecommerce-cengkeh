import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ecommerce Cengkeh",
  description: "Aplikasi penjualan cengkeh",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body>
        <SessionProvider session={session}>
          <ClientProviders>{children}</ClientProviders>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

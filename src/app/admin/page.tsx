import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/index";
import { users, products, orders } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  FileText,
  ShoppingBag,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const [userCount, productCount, orderCount, paidOrderCount] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(products)
        .where(eq(products.is_active, true))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(orders)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "paid"))
        .then((r) => r[0]?.count ?? 0),
    ]);

  const statCards = [
    {
      label: "Total Pengguna",
      value: userCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Produk Aktif",
      value: productCount,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Total Pesanan",
      value: orderCount,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Pesanan Lunas",
      value: paidOrderCount,
      icon: ShoppingBag,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-2xl">
          Admin Dashboard
        </h1>
        <p className="text-xs text-muted-foreground">
          Ringkasan data platform penjualan cengkeh.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-cengkeh-brown/10 bg-white">
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${card.bg}`}
              >
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-cengkeh-brown tabular-nums">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder untuk section selanjutnya */}
      <Card className="border-dashed border-cengkeh-brown/20 bg-white/50">
        <CardHeader>
          <CardTitle className="text-base text-cengkeh-brown">
            Menu Administrasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <a
              href="/admin/users"
              className="flex items-center gap-2 p-3 rounded-md border border-cengkeh-brown/10 hover:bg-cengkeh-beige/30 transition-colors"
            >
              <Users className="size-4 text-cengkeh-brown" />
              Kelola Pengguna
            </a>
            <a
              href="/admin/products"
              className="flex items-center gap-2 p-3 rounded-md border border-cengkeh-brown/10 hover:bg-cengkeh-beige/30 transition-colors"
            >
              <ShoppingCart className="size-4 text-cengkeh-brown" />
              Kelola Produk
            </a>
            <a
              href="/admin/testimonials"
              className="flex items-center gap-2 p-3 rounded-md border border-cengkeh-brown/10 hover:bg-cengkeh-beige/30 transition-colors"
            >
              <MessageSquare className="size-4 text-cengkeh-brown" />
              Kelola Testimoni
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

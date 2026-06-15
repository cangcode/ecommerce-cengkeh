import { auth } from "@/auth";
import { Badge } from "../ui/badge";
import { getDashboardStats } from "@/db/data/dashboard/dashboard.actions";
import { formatRupiah } from "@/lib/utils";
import { AlertTriangle, Package, PackageOpen, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HalamanPenjual = async () => {
  const session = await auth();
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8 md:px-10">
        <p className="text-cengkeh-brown/60">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Produk",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Total Stok",
      value: `${stats.totalStock} kg`,
      icon: PackageOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Stok Menipis",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Stok Habis",
      value: stats.outOfStockCount,
      icon: ShoppingBag,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-3xl">
          Halo, {session?.user?.name}!
        </h1>
        <p className="text-xs text-cengkeh-brown">
          {stats.businessName} — lihat overview toko Anda di sini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-cengkeh-brown/70">{card.label}</p>
              <p className="text-2xl font-bold text-cengkeh-darker-brown mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Products */}
      <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-cengkeh-darker-brown">
              Produk Terbaru
            </h2>
            <p className="text-xs text-cengkeh-brown/70 mt-0.5">
              {stats.totalProducts > 0
                ? `${stats.recentProducts.length} dari ${stats.totalProducts} produk`
                : "Anda belum memiliki produk"}
            </p>
          </div>
          {stats.totalProducts > 0 && (
            <Link
              href="/dashboard/products"
              className="text-xs font-medium text-cengkeh-brown underline underline-offset-2 hover:text-cengkeh-darker-brown"
            >
              Lihat Semua
            </Link>
          )}
        </div>

        {stats.recentProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cengkeh-brown/10 text-left">
                  <th className="pb-3 font-medium text-cengkeh-brown/70 text-xs">
                    Produk
                  </th>
                  <th className="pb-3 font-medium text-cengkeh-brown/70 text-xs">
                    Harga
                  </th>
                  <th className="pb-3 font-medium text-cengkeh-brown/70 text-xs">
                    Stok
                  </th>
                  <th className="pb-3 font-medium text-cengkeh-brown/70 text-xs">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-cengkeh-brown/5 last:border-0"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-cengkeh-brown/10 overflow-hidden shrink-0">
                          {product.image_url?.[0]?.secure_url ? (
                            <Image
                              src={product.image_url[0].secure_url}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-cengkeh-brown/30">
                              <Package className="size-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-cengkeh-darker-brown truncate max-w-40">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-cengkeh-darker-brown">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="py-3 text-cengkeh-darker-brown">
                      {product.stock} {product.weight_unit}
                    </td>
                    <td className="py-3">
                      {product.stock === 0 ? (
                        <Badge
                          variant="outline"
                          className="border-red-300 text-red-600 bg-red-50 text-xs"
                        >
                          Habis
                        </Badge>
                      ) : product.stock < 10 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-600 bg-amber-50 text-xs"
                        >
                          Menipis
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-600 bg-emerald-50 text-xs"
                        >
                          Tersedia
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-cengkeh-brown/40">
            <Package className="size-12 mb-3" />
            <p className="font-medium text-cengkeh-brown/60">
              Belum ada produk
            </p>
            <p className="text-xs mt-1">
              Mulai tambahkan produk pertama Anda dari menu Produk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HalamanPenjual;

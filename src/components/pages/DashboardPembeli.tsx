import type { Session } from "next-auth";
import type { BuyerDashboardData } from "@/db/data/dashboard/dashboard.actions";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Loader2,
  Truck,
  CheckCircle,
  Package2,
  Search,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

type Props = {
  session: Session;
  data: BuyerDashboardData;
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Menunggu Bayar", variant: "outline" },
  paid: { label: "Lunas", variant: "default" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kadaluarsa", variant: "secondary" },
};

export default function DashboardPembeli({ data }: Props) {
  const statCards = [
    {
      label: "Menunggu Bayar",
      value: data.pendingCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Diproses",
      value: data.diprosesCount,
      icon: Loader2,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Dikirim",
      value: data.dikirimCount,
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Selesai",
      value: data.selesaiCount,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-cengkeh-brown p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20">
              <ShoppingBag className="size-3" />
              Dashboard Pembeli
            </span>
          </div>
          <h1 className="font-bold text-3xl text-white">Dashboard</h1>
          <p className="text-sm text-white/80">
            Ringkasan aktivitas belanja Anda.
          </p>
        </div>
      </div>

      {/* Statistik pesanan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="border-cengkeh-brown/20 bg-white/80"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${card.bg}`}
              >
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-cengkeh-brown tabular-nums">
                  {card.value}
                </p>
                <p className="text-[11px] text-cengkeh-brown/60 truncate">
                  {card.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cari produk */}
      <form action="/product" method="GET" className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cengkeh-brown/40" />
          <Input
            name="search"
            placeholder="Cari produk atau toko..."
            className="h-10 rounded-full border-cengkeh-brown/20 bg-white pl-10"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-10 rounded-full bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-white"
        >
          Cari
        </Button>
      </form>

      {/* Grid: Pesanan Terbaru + Alamat Default */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pesanan Terbaru */}
        <Card className="lg:col-span-2 border-cengkeh-brown/20 bg-white/80">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-cengkeh-brown flex items-center gap-2">
                <Package2 className="size-4" />
                Pesanan Terbaru
              </CardTitle>
              <CardDescription className="text-xs">
                5 pesanan terakhir Anda
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs h-8">
              <Link href="/dashboard/order-list">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <div className="py-8 text-center">
                <Package2 className="size-10 text-cengkeh-brown/20 mx-auto mb-2" />
                <p className="text-sm text-cengkeh-brown/60">
                  Belum ada pesanan.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="text-cengkeh-brown mt-1"
                >
                  <Link href="/product">Mulai Belanja</Link>
                </Button>
              </div>
            ) : (
              data.recentOrders.map((order) => {
                const cfg =
                  STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                return (
                  <Link
                    key={order.id}
                    href="/dashboard/order-list"
                    className="flex items-center justify-between rounded-lg border border-cengkeh-brown/10 p-3 hover:bg-cengkeh-brown/5 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cengkeh-brown/10">
                        <Package2 className="size-4 text-cengkeh-brown" />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-cengkeh-brown truncate">
                          {order.xendit_invoice_id}
                        </p>
                        <p className="text-[11px] text-cengkeh-brown/50">
                          {order.itemCount} produk •{" "}
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-cengkeh-brown">
                        {formatRupiah(order.gross_amount)}
                      </span>
                      <Badge
                        variant={cfg.variant as any}
                        className="text-[10px] py-0 h-5"
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Alamat Default */}
        <Card className="border-cengkeh-brown/20 bg-white/80">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-cengkeh-brown flex items-center gap-2">
                <MapPin className="size-4" />
                Alamat Utama
              </CardTitle>
              <CardDescription className="text-xs">
                Alamat pengiriman default
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs h-8">
              <Link href="/dashboard/addresses">Edit</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.defaultAddress ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-cengkeh-brown">
                  {data.defaultAddress.recipient_name}
                </p>
                <p className="text-cengkeh-brown/60 leading-relaxed">
                  {data.defaultAddress.address}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center">
                <MapPin className="size-8 text-cengkeh-brown/20 mx-auto mb-2" />
                <p className="text-xs text-cengkeh-brown/60 mb-2">
                  Belum ada alamat tersimpan.
                </p>
                <Button
                  size="sm"
                  asChild
                  className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-white text-xs h-8"
                >
                  <Link href="/dashboard/addresses/add">Tambah Alamat</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import {
  Package2,
  MapPin,
  Truck,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  ShoppingBag,
  CheckCircle,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  getSellerOrders,
  type SellerOrderRow,
  type FulfillmentStatus,
  type ReturnStatus,
} from "@/db/data/orders/orders.actions";
import axios from "axios";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Menunggu Bayar",
    variant: "outline",
    className: "border-amber-300 text-amber-700",
    icon: <Clock className="size-3" />,
  },
  paid: {
    label: "Lunas",
    variant: "default",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
    icon: <CreditCard className="size-3" />,
  },
  failed: {
    label: "Gagal",
    variant: "destructive",
    className: "bg-red-50 text-red-600",
    icon: null,
  },
  expired: {
    label: "Kadaluarsa",
    variant: "secondary",
    className: "bg-muted text-muted-foreground",
    icon: <Clock className="size-3" />,
  },
};

const METHOD_LABELS: Record<string, string> = {
  ambil_sendiri: "Ambil Sendiri",
  antarkan: "Antarkan",
};

const FULFILLMENT_CONFIG: Record<
  FulfillmentStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  menunggu: {
    label: "Menunggu",
    className: "border-amber-300 text-amber-700 bg-amber-50",
    icon: <Clock className="size-2.5" />,
  },
  diproses: {
    label: "Diproses",
    className: "border-blue-300 text-blue-700 bg-blue-50",
    icon: <Loader2 className="size-2.5 animate-spin" />,
  },
  dikirim: {
    label: "Dikirim",
    className: "border-purple-300 text-purple-700 bg-purple-50",
    icon: <Truck className="size-2.5" />,
  },
  selesai: {
    label: "Selesai",
    className: "border-green-300 text-green-700 bg-green-50",
    icon: <CheckCircle className="size-2.5" />,
  },
  dibatalkan: {
    label: "Dibatalkan",
    className: "border-red-300 text-red-600 bg-red-50",
    icon: null,
  },
};

const RETURN_CONFIG: Record<
  ReturnStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  none: { label: "", className: "", icon: null },
  requested: {
    label: "Retur Diajukan",
    className: "border-amber-400 text-amber-700 bg-amber-50",
    icon: <RotateCcw className="size-2.5" />,
  },
  approved: {
    label: "Retur Disetujui",
    className: "border-green-400 text-green-700 bg-green-50",
    icon: <CheckCircle className="size-2.5" />,
  },
  rejected: {
    label: "Retur Ditolak",
    className: "border-red-400 text-red-600 bg-red-50",
    icon: <XCircle className="size-2.5" />,
  },
  refunded: {
    label: "Dana Dikembalikan",
    className: "border-blue-400 text-blue-700 bg-blue-50",
    icon: <CreditCard className="size-2.5" />,
  },
};

/**
 * Flow status pemenuhan berbeda berdasarkan metode pengiriman.
 * - antarkan: menunggu → diproses → dikirim → selesai
 * - ambil_sendiri: menunggu → diproses → selesai (tanpa "dikirim")
 */
function getNextStatus(
  current: FulfillmentStatus,
  shippingMethod: string,
): FulfillmentStatus | null {
  const flowAntarkan: FulfillmentStatus[] = [
    "menunggu",
    "diproses",
    "dikirim",
    "selesai",
  ];
  const flowAmbilSendiri: FulfillmentStatus[] = [
    "menunggu",
    "diproses",
    "selesai",
  ];

  const flow =
    shippingMethod === "ambil_sendiri" ? flowAmbilSendiri : flowAntarkan;
  const idx = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
}

export default function SellerOrderList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    itemId: number;
    fromLabel: string;
    toLabel: string;
    newStatus: FulfillmentStatus | null;
    isReturnAction?: boolean;
    returnAction?: "approved" | "rejected";
  } | null>(null);
  const [respondingReturnId, setRespondingReturnId] = useState<number | null>(
    null,
  );

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.seller_id) return;
    setLoading(true);
    try {
      const data = await getSellerOrders(session.user.seller_id);
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.user?.seller_id]);

  const confirmUpdateStatus = (
    itemId: number,
    newStatus: FulfillmentStatus,
  ) => {
    // Cari item untuk dapatkan status saat ini
    for (const o of orders) {
      const item = o.items.find((i) => i.id === itemId);
      if (item) {
        setConfirmDialog({
          itemId,
          fromLabel: FULFILLMENT_CONFIG[item.fulfillment_status].label,
          toLabel: FULFILLMENT_CONFIG[newStatus].label,
          newStatus,
        });
        break;
      }
    }
  };

  const handleReturnResponse = async (
    itemId: number,
    action: "approved" | "rejected",
  ) => {
    if (!session?.user?.seller_id) return;
    setConfirmDialog(null);
    setRespondingReturnId(itemId);
    try {
      await axios.patch(`/api/orders/items/${itemId}/return/respond`, {
        action,
        refund: action === "approved",
      });
      const newStatus: ReturnStatus =
        action === "approved" ? "approved" : "rejected";
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, return_status: newStatus } : i,
          ),
        })),
      );
      const label = action === "approved" ? "disetujui" : "ditolak";
      toast.success(
        `Retur ${label}. ${action === "approved" ? "Dana akan dikembalikan ke pembeli." : ""}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menanggapi retur";
      toast.error(msg);
    } finally {
      setRespondingReturnId(null);
    }
  };

  const updateStatus = async (itemId: number, newStatus: FulfillmentStatus) => {
    setConfirmDialog(null);
    setUpdatingItemId(itemId);
    try {
      await axios.patch(`/api/orders/items/${itemId}/status`, {
        fulfillment_status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, fulfillment_status: newStatus } : i,
          ),
        })),
      );
      toast.success(
        `Status diubah menjadi "${FULFILLMENT_CONFIG[newStatus].label}"`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status";
      toast.error(msg);
    } finally {
      setUpdatingItemId(null);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchOrders();
  }, [status, fetchOrders]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8">
        <p className="text-sm text-muted-foreground">Memuat pesanan...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const toggleExpand = (id: number) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // Hitung ringkasan
  const totalPesanan = orders.length;
  const pesananLunas = orders.filter((o) => o.status === "paid").length;
  const pesananPending = orders.filter((o) => o.status === "pending").length;

  // Total pendapatan dari pesanan lunas (hanya item milik seller ini)
  const totalPendapatan = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.subtotal, 0), 0);

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      {/* Header */}
      <div>
        <h1 className="text-cengkeh-brown font-bold text-3xl">Pesanan Masuk</h1>
        <p className="text-xs text-cengkeh-brown">
          Pantau dan kelola pesanan dari pembeli di sini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-5">
          <p className="text-xs text-cengkeh-brown/70">Total Pesanan</p>
          <p className="text-2xl font-bold text-cengkeh-darker-brown mt-1">
            {totalPesanan}
          </p>
        </div>
        <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-5">
          <p className="text-xs text-cengkeh-brown/70">Pesanan Lunas</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {pesananLunas}
          </p>
        </div>
        <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-5">
          <p className="text-xs text-cengkeh-brown/70">Total Pendapatan</p>
          <p className="text-2xl font-bold text-cengkeh-darker-brown mt-1">
            {formatRupiah(totalPendapatan)}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Semua" },
          { key: "pending", label: "Menunggu Bayar" },
          { key: "paid", label: "Lunas" },
          { key: "failed", label: "Gagal" },
          { key: "expired", label: "Kadaluarsa" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-cengkeh-brown text-cengkeh-beige"
                : "bg-white border border-cengkeh-brown/15 text-cengkeh-brown hover:bg-cengkeh-beige/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-dashed bg-background/80">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground">
              <ShoppingBag className="size-5 text-cengkeh-brown/40" />
              Belum ada pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Pesanan dari pembeli akan muncul di sini setelah ada yang checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusCfg =
              STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

            // Subtotal khusus items milik seller ini
            const sellerSubtotal = order.items.reduce(
              (sum, i) => sum + i.subtotal,
              0,
            );
            const sellerShipping = order.items.reduce(
              (sum, i) => sum + i.shipping_cost,
              0,
            );

            const isInactive =
              order.status === "expired" || order.status === "failed";

            return (
              <Card
                key={order.order_id}
                className={`overflow-hidden ${isInactive ? "opacity-60 grayscale-30" : ""}`}
              >
                {/* Header ringkasan */}
                <button
                  type="button"
                  onClick={() => toggleExpand(order.order_id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cengkeh-brown/10">
                      <ShoppingBag className="size-5 text-cengkeh-brown" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold text-cengkeh-brown truncate ${isInactive ? "line-through decoration-cengkeh-brown/40" : ""}`}
                      >
                        {order.midtrans_order_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                        {" • "}
                        {order.buyer_name ?? "Pembeli"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={statusCfg.variant}
                      className={`gap-1 text-xs ${statusCfg.className}`}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </Badge>
                    <span className="text-sm font-bold text-cengkeh-brown hidden sm:inline">
                      {formatRupiah(sellerSubtotal + sellerShipping)}
                    </span>
                    {expandedId === order.order_id ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Detail (expand) */}
                {expandedId === order.order_id && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {/* Info Pembeli */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-cengkeh-brown flex items-center gap-1">
                        <User className="size-3.5" /> Info Pembeli
                      </p>
                      <div className="rounded-md bg-background p-2 text-xs space-y-0.5">
                        <p className="font-medium">{order.buyer_name ?? "-"}</p>
                        {order.buyer_email && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="size-3" />
                            {order.buyer_email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Alamat tujuan */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-cengkeh-brown flex items-center gap-1">
                        <MapPin className="size-3.5" /> Alamat Pengiriman
                      </p>
                      <div className="rounded-md bg-background p-2 text-xs space-y-0.5">
                        <p className="font-medium flex items-center gap-1">
                          <User className="size-3" />{" "}
                          {order.recipient_name ?? "-"}
                        </p>
                        <p className="text-muted-foreground">
                          {order.address ?? "-"}
                        </p>
                        <p className="text-muted-foreground">
                          {order.district_name ?? "?"} •{" "}
                          {order.village_name ?? "?"}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-cengkeh-brown flex items-center gap-1">
                        <Package2 className="size-3.5" /> Produk Dipesan
                      </p>
                      {order.items.map((item) => {
                        const fulfillCfg =
                          FULFILLMENT_CONFIG[item.fulfillment_status] ??
                          FULFILLMENT_CONFIG.menunggu;
                        const isPaid = order.status === "paid";
                        const isUpdating = updatingItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 rounded-md bg-background p-2 text-xs"
                          >
                            {/* Row atas: produk + subtotal */}
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-cengkeh-brown truncate">
                                  {item.product_title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-muted-foreground">
                                    {item.quantity} {item.product_weight_unit} ×{" "}
                                    {formatRupiah(item.product_price)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] gap-1 py-0 h-5"
                                  >
                                    <Truck className="size-2.5" />
                                    {METHOD_LABELS[item.shipping_method] ??
                                      item.shipping_method}
                                  </Badge>
                                </div>
                              </div>
                              <span className="font-semibold text-cengkeh-brown shrink-0 ml-3">
                                {formatRupiah(item.subtotal)}
                              </span>
                            </div>

                            {/* Row bawah: status pemenuhan + tombol ubah */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`gap-1 text-[10px] py-0 h-5 ${fulfillCfg.className}`}
                                >
                                  {fulfillCfg.icon}
                                  {fulfillCfg.label}
                                </Badge>

                                {/* Badge status retur */}
                                {item.return_status !== "none" && (
                                  <Badge
                                    variant="outline"
                                    className={`gap-1 text-[10px] py-0 h-5 ${RETURN_CONFIG[item.return_status].className}`}
                                  >
                                    {RETURN_CONFIG[item.return_status].icon}
                                    {RETURN_CONFIG[item.return_status].label}
                                  </Badge>
                                )}
                              </div>

                              {isPaid &&
                                item.fulfillment_status !== "selesai" &&
                                item.fulfillment_status !== "dibatalkan" && (
                                  <div className="flex gap-1">
                                    {/* Tombol status selanjutnya (otomatis, sesuai flow metode kirim) */}
                                    {(() => {
                                      const nextStatus = getNextStatus(
                                        item.fulfillment_status,
                                        item.shipping_method,
                                      );
                                      if (!nextStatus) return null;
                                      const nextCfg =
                                        FULFILLMENT_CONFIG[nextStatus];
                                      return (
                                        <button
                                          type="button"
                                          disabled={isUpdating}
                                          onClick={() =>
                                            confirmUpdateStatus(
                                              item.id,
                                              nextStatus,
                                            )
                                          }
                                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${nextCfg.className} border hover:opacity-80 disabled:opacity-50`}
                                        >
                                          {isUpdating ? (
                                            <Loader2 className="size-2.5 animate-spin" />
                                          ) : (
                                            nextCfg.icon
                                          )}
                                          {nextCfg.label}
                                        </button>
                                      );
                                    })()}

                                    {/* Tombol batalkan (kecuali sudah dikirim) */}
                                    {item.fulfillment_status !== "dikirim" && (
                                      <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() =>
                                          confirmUpdateStatus(
                                            item.id,
                                            "dibatalkan",
                                          )
                                        }
                                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                      >
                                        ✕ Batal
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>

                            {/* Alasan retur + tombol approve/reject */}
                            {item.return_reason && (
                              <p className="text-muted-foreground italic">
                                Alasan retur: &ldquo;{item.return_reason}&rdquo;
                              </p>
                            )}
                            {isPaid && item.return_status === "requested" && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={respondingReturnId === item.id}
                                  onClick={() =>
                                    setConfirmDialog({
                                      itemId: item.id,
                                      fromLabel: "Retur Diajukan",
                                      toLabel: "Retur Disetujui",
                                      newStatus: null,
                                      isReturnAction: true,
                                      returnAction: "approved",
                                    })
                                  }
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                                >
                                  {respondingReturnId === item.id ? (
                                    <Loader2 className="size-2.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="size-2.5" />
                                  )}
                                  Setujui Retur
                                </button>
                                <button
                                  type="button"
                                  disabled={respondingReturnId === item.id}
                                  onClick={() =>
                                    setConfirmDialog({
                                      itemId: item.id,
                                      fromLabel: "Retur Diajukan",
                                      toLabel: "Retur Ditolak",
                                      newStatus: null,
                                      isReturnAction: true,
                                      returnAction: "rejected",
                                    })
                                  }
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  ✕ Tolak Retur
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Ringkasan biaya */}
                    {sellerShipping > 0 && (
                      <div className="flex items-center justify-between text-xs px-2">
                        <span className="text-muted-foreground">
                          Ongkos Kirim
                        </span>
                        <span>{formatRupiah(sellerShipping)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-cengkeh-brown">
                        Subtotal
                      </span>
                      <span className="text-base font-bold text-cengkeh-brown">
                        {formatRupiah(sellerSubtotal + sellerShipping)}
                      </span>
                    </div>

                    {/* Status & info */}
                    {isInactive && (
                      <p className="text-xs text-muted-foreground italic">
                        {order.status === "expired"
                          ? "Pesanan ini sudah kadaluarsa karena pembeli tidak membayar tepat waktu."
                          : "Pembayaran pesanan ini gagal."}
                      </p>
                    )}
                    {order.status === "paid" && order.paid_at && (
                      <p className="text-xs text-green-700">
                        ✅ Dibayar pada{" "}
                        {new Date(order.paid_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {order.status === "pending" && (
                      <p className="text-xs text-amber-700">
                        ⏳ Menunggu pembeli menyelesaikan pembayaran.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Update Status */}
      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Konfirmasi Perubahan Status
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmDialog && (
                <>
                  Ubah status pemenuhan dari{" "}
                  <span className="font-semibold text-cengkeh-brown">
                    &ldquo;{confirmDialog.fromLabel}&rdquo;
                  </span>{" "}
                  menjadi{" "}
                  <span className="font-semibold text-cengkeh-brown">
                    &ldquo;{confirmDialog.toLabel}&rdquo;
                  </span>
                  ?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog(null)}
              className="text-cengkeh-brown"
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
              onClick={() => {
                if (!confirmDialog) return;
                if (
                  confirmDialog.isReturnAction &&
                  confirmDialog.returnAction
                ) {
                  handleReturnResponse(
                    confirmDialog.itemId,
                    confirmDialog.returnAction,
                  );
                } else if (confirmDialog.newStatus) {
                  updateStatus(confirmDialog.itemId, confirmDialog.newStatus);
                }
              }}
            >
              Ya, Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

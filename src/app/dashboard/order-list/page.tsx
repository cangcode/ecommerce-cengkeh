"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/utils";
import {
  Package2,
  MapPin,
  Store,
  Truck,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle,
  Loader2,
  RotateCcw,
  XCircle,
  Ban,
} from "lucide-react";
import {
  getUserOrders,
  type OrderRow,
  type FulfillmentStatus,
  type ReturnStatus,
  type CancellationStatus,
} from "@/db/data/orders/orders.actions";
import axios from "axios";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Menunggu Bayar",
    variant: "outline",
    icon: <Clock className="size-3" />,
  },
  paid: {
    label: "Lunas",
    variant: "default",
    icon: <CreditCard className="size-3" />,
  },
  failed: { label: "Gagal", variant: "destructive", icon: null },
  expired: {
    label: "Kadaluarsa",
    variant: "secondary",
    icon: <Clock className="size-3" />,
  },
};

const METHOD_LABELS: Record<string, string> = {
  ambil_sendiri: "Ambil Sendiri",
  antarkan: "Antarkan",
};

const FULFILLMENT_LABELS: Record<
  FulfillmentStatus,
  { label: string; className: string }
> = {
  menunggu: { label: "Menunggu", className: "border-amber-300 text-amber-700" },
  diproses: { label: "Diproses", className: "border-blue-300 text-blue-700" },
  dikirim: { label: "Dikirim", className: "border-purple-300 text-purple-700" },
  selesai: { label: "Selesai", className: "border-green-300 text-green-700" },
  dibatalkan: { label: "Dibatalkan", className: "border-red-300 text-red-600" },
};

const RETURN_LABELS: Record<
  ReturnStatus,
  { label: string; className: string }
> = {
  none: { label: "", className: "" },
  requested: {
    label: "Retur Diajukan",
    className: "border-amber-400 text-amber-700 bg-amber-50",
  },
  approved: {
    label: "Retur Disetujui",
    className: "border-green-400 text-green-700 bg-green-50",
  },
  rejected: {
    label: "Retur Ditolak",
    className: "border-red-300 text-red-600 bg-red-50",
  },
  refunded: {
    label: "Barang Kembali",
    className: "border-blue-400 text-blue-700 bg-blue-50",
  },
};

const CANCEL_LABELS: Record<
  CancellationStatus,
  { label: string; className: string }
> = {
  none: { label: "", className: "" },
  requested: {
    label: "Batal Diajukan",
    className: "border-orange-400 text-orange-700 bg-orange-50",
  },
  approved: {
    label: "Batal Disetujui",
    className: "border-red-400 text-red-600 bg-red-50",
  },
  rejected: {
    label: "Batal Ditolak",
    className: "border-gray-400 text-gray-600 bg-gray-50",
  },
};

export default function OrderList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const snapReady = useRef(false);
  const [returnDialog, setReturnDialog] = useState<{
    itemId: number;
    productTitle: string;
  } | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{
    itemId: number;
    productTitle: string;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Inject Midtrans Snap script
  useEffect(() => {
    if (snapReady.current) return;
    if (document.querySelector('script[src*="snap.js"]')) {
      if ((window as any).snap) snapReady.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    );
    script.async = true;

    script.onload = () => {
      snapReady.current = true;
    };
    script.onerror = () => console.warn("⚠️ Gagal memuat Midtrans Snap JS");

    document.head.appendChild(script);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const data = await getUserOrders(session.user.id);
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const handleSubmitReturn = async () => {
    if (!returnDialog || !returnReason.trim()) return;
    setSubmittingReturn(true);
    try {
      await axios.post(`/api/orders/items/${returnDialog.itemId}/return`, {
        reason: returnReason.trim(),
      });
      toast.success("Retur berhasil diajukan. Menunggu konfirmasi penjual.");
      setReturnDialog(null);
      setReturnReason("");
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengajukan retur";
      toast.error(msg);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleSubmitCancel = async () => {
    if (!cancelDialog || !cancelReason.trim()) return;
    setSubmittingCancel(true);
    try {
      await axios.post(`/api/orders/items/${cancelDialog.itemId}/cancel`, {
        reason: cancelReason.trim(),
      });
      toast.success(
        "Pembatalan berhasil diajukan. Menunggu konfirmasi penjual.",
      );
      setCancelDialog(null);
      setCancelReason("");
      fetchOrders();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengajukan pembatalan";
      toast.error(msg);
    } finally {
      setSubmittingCancel(false);
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

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      {/* Header */}
      <div>
        <h1 className="text-cengkeh-brown font-bold text-3xl">Pesanan Saya</h1>
        <p className="text-xs text-cengkeh-brown">
          Pantau status pesanan kamu di sini.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed bg-background/80">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground">
              <Package2 className="size-5 text-cengkeh-brown/40" />
              Belum ada pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Jelajahi produk di halaman{" "}
            <a href="/product" className="text-cengkeh-brown underline">
              Produk
            </a>{" "}
            dan lakukan checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusCfg =
              STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

            // Group items by seller
            const sellerMap = new Map<
              number,
              {
                seller_id: number;
                items: typeof order.items;
                shipping_method: string;
                shipping_cost: number;
              }
            >();
            for (const item of order.items) {
              const existing = sellerMap.get(item.seller_id);
              if (existing) {
                existing.items.push(item);
              } else {
                sellerMap.set(item.seller_id, {
                  seller_id: item.seller_id,
                  items: [item],
                  shipping_method: item.shipping_method,
                  shipping_cost: item.shipping_cost,
                });
              }
            }
            const sellerGroups = Array.from(sellerMap.values());

            const isInactive =
              order.status === "expired" || order.status === "failed";
            const isPaid = order.status === "paid";

            return (
              <Card
                key={order.id}
                className={`overflow-hidden ${isInactive ? "opacity-60 grayscale-30" : ""}`}
              >
                {/* Header ringkasan */}
                <button
                  type="button"
                  onClick={() => toggleExpand(order.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cengkeh-brown/10">
                      <Package2 className="size-5 text-cengkeh-brown" />
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
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={statusCfg.variant}
                      className={`gap-1 ${order.status === "paid" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""} ${order.status === "pending" ? "border-amber-300 text-amber-700" : ""} ${order.status === "expired" ? "bg-muted text-muted-foreground" : ""} ${order.status === "failed" ? "bg-red-50 text-red-600" : ""}`}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </Badge>
                    <span className="text-sm font-bold text-cengkeh-brown hidden sm:inline">
                      {formatRupiah(order.gross_amount)}
                    </span>
                    {expandedId === order.id ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Detail (expand) */}
                {expandedId === order.id && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {/* Alamat tujuan */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-cengkeh-brown flex items-center gap-1">
                        <MapPin className="size-3.5" /> Alamat Tujuan
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

                    {/* Items per toko */}
                    {sellerGroups.map((sg) => (
                      <div key={sg.seller_id} className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Store className="size-3.5 text-cengkeh-brown" />
                          <span className="text-xs font-semibold text-cengkeh-brown">
                            Toko #{sg.seller_id}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 py-0 h-5"
                          >
                            <Truck className="size-2.5" />
                            {METHOD_LABELS[sg.shipping_method] ??
                              sg.shipping_method}
                          </Badge>
                        </div>
                        {sg.items.map((item) => {
                          const fulfill =
                            FULFILLMENT_LABELS[item.fulfillment_status] ??
                            FULFILLMENT_LABELS.menunggu;
                          const returnCfg =
                            item.return_status !== "none"
                              ? RETURN_LABELS[item.return_status]
                              : null;
                          const cancelCfg =
                            item.cancellation_status !== "none"
                              ? CANCEL_LABELS[item.cancellation_status]
                              : null;

                          // Syarat bisa retur: metode antarkan, status dikirim, belum diretur
                          const canReturn =
                            item.shipping_method === "antarkan" &&
                            item.fulfillment_status === "dikirim" &&
                            item.return_status === "none";

                          // Syarat bisa batalkan: paid, status menunggu, belum ada cancel request
                          const canCancel =
                            isPaid &&
                            item.fulfillment_status === "menunggu" &&
                            item.cancellation_status === "none";

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col gap-2 rounded-md bg-background p-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-cengkeh-brown truncate">
                                    {item.product_title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-muted-foreground">
                                      {item.quantity} {item.product_weight_unit}{" "}
                                      × {formatRupiah(item.product_price)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] gap-1 py-0 h-5 ${fulfill.className}`}
                                    >
                                      {item.fulfillment_status ===
                                        "menunggu" && (
                                        <Clock className="size-2.5" />
                                      )}
                                      {item.fulfillment_status ===
                                        "diproses" && (
                                        <Loader2 className="size-2.5 animate-spin" />
                                      )}
                                      {item.fulfillment_status ===
                                        "dikirim" && (
                                        <Truck className="size-2.5" />
                                      )}
                                      {item.fulfillment_status ===
                                        "selesai" && (
                                        <CheckCircle className="size-2.5" />
                                      )}
                                      {fulfill.label}
                                    </Badge>
                                    {cancelCfg && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] gap-1 py-0 h-5 ${cancelCfg.className}`}
                                      >
                                        {item.cancellation_status ===
                                          "requested" && (
                                          <Clock className="size-2.5" />
                                        )}
                                        {item.cancellation_status ===
                                          "approved" && (
                                          <Ban className="size-2.5" />
                                        )}
                                        {item.cancellation_status ===
                                          "rejected" && (
                                          <XCircle className="size-2.5" />
                                        )}
                                        {cancelCfg.label}
                                      </Badge>
                                    )}
                                    {returnCfg && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] gap-1 py-0 h-5 ${returnCfg.className}`}
                                      >
                                        {item.return_status === "requested" && (
                                          <RotateCcw className="size-2.5" />
                                        )}
                                        {item.return_status === "approved" && (
                                          <CheckCircle className="size-2.5" />
                                        )}
                                        {item.return_status === "rejected" && (
                                          <XCircle className="size-2.5" />
                                        )}
                                        {item.return_status === "refunded" && (
                                          <CreditCard className="size-2.5" />
                                        )}
                                        {returnCfg.label}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.return_reason && (
                                    <p className="text-muted-foreground mt-1 italic">
                                      Alasan: &ldquo;{item.return_reason}&rdquo;
                                    </p>
                                  )}
                                  {item.cancel_reason && (
                                    <p className="text-muted-foreground mt-1 italic">
                                      Alasan batal: &ldquo;{item.cancel_reason}
                                      &rdquo;
                                    </p>
                                  )}
                                </div>
                                <span className="font-semibold text-cengkeh-brown shrink-0 ml-3">
                                  {formatRupiah(item.subtotal)}
                                </span>
                              </div>

                              {/* Tombol Ajukan Retur */}
                              {canReturn && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReturnDialog({
                                      itemId: item.id,
                                      productTitle: item.product_title,
                                    })
                                  }
                                  className="self-start flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
                                >
                                  <RotateCcw className="size-2.5" />
                                  Ajukan Retur
                                </button>
                              )}

                              {/* Tombol Ajukan Pembatalan */}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCancelDialog({
                                      itemId: item.id,
                                      productTitle: item.product_title,
                                    })
                                  }
                                  className="self-start flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                  <Ban className="size-2.5" />
                                  Ajukan Pembatalan
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {sg.shipping_cost > 0 && (
                          <div className="flex items-center justify-between text-xs px-2">
                            <span className="text-muted-foreground">
                              Ongkir
                            </span>
                            <span>{formatRupiah(sg.shipping_cost)}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    <Separator />
                    {isInactive && (
                      <p className="text-xs text-muted-foreground italic">
                        {order.status === "expired"
                          ? "Pesanan ini sudah kadaluarsa karena tidak dibayar tepat waktu."
                          : "Pembayaran pesanan ini gagal."}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-cengkeh-brown">
                        Total
                      </span>
                      <span className="text-base font-bold text-cengkeh-brown">
                        {formatRupiah(order.gross_amount)}
                      </span>
                    </div>

                    {/* Pay button if pending */}
                    {order.status === "pending" && order.snap_token && (
                      <button
                        type="button"
                        className="w-full rounded-md bg-cengkeh-brown py-2 text-sm font-medium text-cengkeh-beige hover:bg-cengkeh-brown/90 transition-colors"
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          if ((window as any).snap) {
                            (window as any).snap.pay(order.snap_token, {
                              onSuccess: async () => {
                                await axios.post("/api/payment/update-status", {
                                  order_id: order.midtrans_order_id,
                                  status: "paid",
                                });
                                toast.success("Pembayaran berhasil!");
                                fetchOrders();
                              },
                            });
                          } else {
                            window.open(
                              `https://app.sandbox.midtrans.com/snap/v1/transactions/${order.snap_token}/redirect`,
                              "_blank",
                            );
                          }
                        }}
                      >
                        Bayar Sekarang
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Ajukan Retur */}
      <Dialog
        open={returnDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReturnDialog(null);
            setReturnReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Ajukan Retur
            </DialogTitle>
            <DialogDescription className="text-sm">
              {returnDialog && (
                <>
                  Ajukan retur untuk produk{" "}
                  <span className="font-semibold text-cengkeh-brown">
                    &ldquo;{returnDialog.productTitle}&rdquo;
                  </span>
                  . Penjual akan meninjau permintaan Anda.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-cengkeh-brown">
              Alasan Retur
            </label>
            <Textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Tulis alasan retur (minimal 5 karakter)..."
              className="resize-none text-sm h-20"
              minLength={5}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReturnDialog(null);
                setReturnReason("");
              }}
              className="text-cengkeh-brown"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={returnReason.trim().length < 5 || submittingReturn}
              className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
              onClick={handleSubmitReturn}
            >
              {submittingReturn ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Ajukan Retur"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajukan Pembatalan */}
      <Dialog
        open={cancelDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialog(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Ajukan Pembatalan
            </DialogTitle>
            <DialogDescription className="text-sm">
              {cancelDialog && (
                <>
                  Ajukan pembatalan untuk produk{" "}
                  <span className="font-semibold text-cengkeh-brown">
                    &ldquo;{cancelDialog.productTitle}&rdquo;
                  </span>
                  . Penjual akan meninjau permintaan Anda.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-cengkeh-brown">
              Alasan Pembatalan
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tulis alasan pembatalan (minimal 5 karakter)..."
              className="resize-none text-sm h-20"
              minLength={5}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCancelDialog(null);
                setCancelReason("");
              }}
              className="text-cengkeh-brown"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={cancelReason.trim().length < 5 || submittingCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSubmitCancel}
            >
              {submittingCancel ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Ajukan Pembatalan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

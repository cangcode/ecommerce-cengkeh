"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/utils";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Store,
  ChevronRight,
  MapPin,
  MapPinned,
  Truck,
  User,
} from "lucide-react";
import { getChartItems } from "@/db/data/charts/charts.actions";
import { getUserAddresses } from "@/db/data/addresses/addresses.actions";

type ChartItem = {
  id: number;
  quantity: number;
  product_id: number;
  product_title: string;
  product_slug: string;
  product_price: number;
  product_wholesale_price: number | null;
  product_wholesale_qty: number | null;
  product_weight_unit: "gram" | "kg";
  product_stock: number;
  product_image_url: { public_id: string; secure_url: string }[];
  product_is_active: boolean;
  seller_id: number;
  seller_name: string;
  seller_address: string;
  seller_district_id: string;
};

type Address = {
  id: number;
  recipient_name: string;
  phone: string;
  address: string;
  district_id: string;
  district_name: string | null;
  village_id: string;
  village_name: string | null;
  is_default: boolean;
};

type ShippingMethod = "ambil_sendiri" | "antarkan";

const SHIPPING_RATE_PER_KG = 15000;
const MIN_SHIPPING = 10000;

function calcShippingCost(
  totalWeightKg: number,
  method: ShippingMethod,
): number {
  if (method === "ambil_sendiri") return 0;
  if (totalWeightKg <= 0) return 0;
  return Math.max(
    Math.ceil(totalWeightKg) * SHIPPING_RATE_PER_KG,
    MIN_SHIPPING,
  );
}

function itemToKg(item: ChartItem): number {
  if (item.product_weight_unit === "kg") return item.quantity;
  return item.quantity / 1000;
}

export default function ChartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ChartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [shippingMethods, setShippingMethods] = useState<
    Record<number, ShippingMethod>
  >({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const snapLoaded = useRef(false);
  const orderIdRef = useRef<string | null>(null);

  // Inject Midtrans Snap script sekali saja
  useEffect(() => {
    if (snapLoaded.current) return;
    const script = document.createElement("script");
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    );
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.async = true;
    script.onload = () => {
      snapLoaded.current = true;
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const [chartData, addrData] = await Promise.all([
        getChartItems(session.user.id),
        getUserAddresses(session.user.id),
      ]);
      setItems(chartData as ChartItem[]);
      const addrList = (addrData as Address[]) ?? [];
      setAddresses(addrList);
      if (!selectedAddressId) {
        const def = addrList.find((a) => a.is_default) ?? addrList[0] ?? null;
        if (def) setSelectedAddressId(def.id);
      }
    } catch {
      toast.error("Gagal memuat keranjang");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "authenticated") fetchAll();
  }, [status, fetchAll]);

  const sellerGroups = useMemo(() => {
    const map = new Map<
      number,
      {
        seller: {
          id: number;
          name: string;
          address: string;
          district_id: string;
        };
        items: ChartItem[];
      }
    >();
    for (const item of items) {
      const existing = map.get(item.seller_id);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.seller_id, {
          seller: {
            id: item.seller_id,
            name: item.seller_name,
            address: item.seller_address,
            district_id: item.seller_district_id,
          },
          items: [item],
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? null;

  const getShippingMethod = (sellerId: number): ShippingMethod =>
    shippingMethods[sellerId] ?? "antarkan";

  const sellerTotalWeightKg = (group: { items: ChartItem[] }) =>
    group.items.reduce((sum, i) => sum + itemToKg(i), 0);

  const isWholesalePrice = (item: ChartItem) =>
    item.product_wholesale_price != null &&
    item.product_wholesale_qty != null &&
    item.product_wholesale_price > 0 &&
    item.product_wholesale_qty > 0 &&
    item.quantity >= item.product_wholesale_qty;

  const sellerSubtotal = (group: { items: ChartItem[] }) =>
    group.items.reduce((sum, i) => {
      const up = isWholesalePrice(i)
        ? i.product_wholesale_price!
        : i.product_price;
      return sum + up * i.quantity;
    }, 0);

  const grandTotal = sellerGroups.reduce((sum, g) => {
    const cost = calcShippingCost(
      sellerTotalWeightKg(g),
      getShippingMethod(g.seller.id),
    );
    return sum + sellerSubtotal(g) + cost;
  }, 0);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8">
        <p className="text-sm text-muted-foreground">Memuat keranjang...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  async function handleCheckout() {
    if (!selectedAddressId) {
      toast.error("Pilih alamat tujuan terlebih dahulu.");
      return;
    }
    setPaying(true);
    try {
      // Build shipping_per_seller map
      const shippingPerSeller: Record<
        number,
        { method: string; cost: number }
      > = {};
      for (const g of sellerGroups) {
        shippingPerSeller[g.seller.id] = {
          method: getShippingMethod(g.seller.id),
          cost: calcShippingCost(
            sellerTotalWeightKg(g),
            getShippingMethod(g.seller.id),
          ),
        };
      }

      const res = await axios.post("/api/payment", {
        shipping_per_seller: shippingPerSeller,
        address_id: selectedAddressId,
      });
      const { token, order_id } = res.data;
      orderIdRef.current = order_id;

      if ((window as any).snap) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).snap.pay(token, {
          clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
          onSuccess: async () => {
            toast.success("Pembayaran berhasil!");
            await axios.post("/api/payment/update-status", {
              order_id,
              status: "paid",
            });
            router.push("/dashboard/order-list");
          },
          onPending: () => {
            toast.success(
              "Pembayaran tertunda. Silakan selesaikan pembayaran.",
            );
            router.push("/dashboard/order-list");
          },
          onError: () => {
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            toast.error("Kamu menutup popup pembayaran tanpa menyelesaikan.");
          },
        });
      } else {
        toast.error("Midtrans Snap belum siap. Coba lagi.");
        router.push("/dashboard/order-list");
      }
    } catch (error) {
      let message = "Gagal memproses pembayaran";
      if (axios.isAxiosError(error))
        message = error.response?.data?.message || message;
      toast.error(message);
    } finally {
      setPaying(false);
    }
  }

  async function handleDelete(itemId: number) {
    try {
      const res = await axios.delete(`/api/chart-items/${itemId}`);
      toast.success(res.data?.message || "Item dihapus!");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (error) {
      let message = "Gagal menghapus item";
      if (axios.isAxiosError(error))
        message = error.response?.data?.message || message;
      toast.error(message);
    }
  }

  async function handleQtyChange(itemId: number, newQty: number, max: number) {
    if (newQty < 1 || newQty > max) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)),
    );
    try {
      await axios.patch(`/api/chart-items/${itemId}`, { quantity: newQty });
    } catch {
      toast.error("Gagal memperbarui jumlah");
      fetchAll();
    }
  }

  const getUnitPrice = (item: ChartItem) =>
    isWholesalePrice(item) ? item.product_wholesale_price! : item.product_price;

  const getItemTotal = (item: ChartItem) => getUnitPrice(item) * item.quantity;

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-cengkeh-brown font-bold text-3xl">Keranjang</h1>
          <p className="text-xs text-cengkeh-brown">
            Kelola item sebelum melanjutkan ke checkout.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <ShoppingCart className="size-3.5" />
          {items.length} item
        </Badge>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed bg-background/80">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground">
              <ShoppingCart className="size-5 text-cengkeh-brown/40" />
              Keranjang masih kosong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Jelajahi produk di halaman{" "}
            <a href="/product" className="text-cengkeh-brown underline">
              Produk
            </a>{" "}
            dan tambahkan ke keranjang.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Alamat tujuan */}
          <Card className="p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-cengkeh-brown">
                <MapPinned className="size-4" />
                Alamat Tujuan Pengiriman
              </CardTitle>
              <CardDescription>
                Pilih alamat untuk menerima pesanan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {addresses.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Belum ada alamat tersimpan.{" "}
                  <a
                    href="/dashboard/addresses/add"
                    className="text-cengkeh-brown underline"
                  >
                    Tambahkan alamat
                  </a>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors max-w-xs ${
                        selectedAddressId === addr.id
                          ? "border-cengkeh-brown bg-cengkeh-brown/10 text-cengkeh-brown"
                          : "border-muted bg-background text-muted-foreground hover:border-cengkeh-brown/40"
                      }`}
                    >
                      <User className="size-3.5 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {addr.recipient_name}
                        </p>
                        <p className="truncate text-[10px]">{addr.address}</p>
                        <p className="text-[10px]">
                          {addr.district_name ?? "Kec."} •{" "}
                          {addr.village_name ?? "Desa"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* List item per toko */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {sellerGroups.map((group) => {
                const shipCost = calcShippingCost(
                  sellerTotalWeightKg(group),
                  getShippingMethod(group.seller.id),
                );
                return (
                  <div key={group.seller.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Store className="size-4 text-cengkeh-brown" />
                      <span className="text-sm font-semibold text-cengkeh-brown">
                        {group.seller.name}
                      </span>
                    </div>
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground -mt-2">
                      <MapPin className="size-3 mt-0.5 shrink-0" />
                      {group.seller.address}
                    </p>

                    {group.items.map((item) => (
                      <Card
                        key={item.id}
                        className="group/cart-item flex flex-col gap-3 sm:flex-row p-4"
                      >
                        {item.product_image_url[0]?.secure_url && (
                          <img
                            src={item.product_image_url[0].secure_url}
                            alt={item.product_title}
                            className="h-20 w-full rounded-lg object-cover sm:h-24 sm:w-28 shrink-0"
                          />
                        )}
                        <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                          <p className="text-sm font-semibold text-cengkeh-brown line-clamp-1">
                            {item.product_title}
                          </p>
                          <div className="flex items-end justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="size-7 rounded-md"
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                  handleQtyChange(
                                    item.id,
                                    item.quantity - 1,
                                    item.product_stock,
                                  )
                                }
                              >
                                <Minus className="size-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                min={1}
                                max={item.product_stock}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  if (!isNaN(v))
                                    handleQtyChange(
                                      item.id,
                                      v,
                                      item.product_stock,
                                    );
                                }}
                                className="h-8 w-14 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="size-7 rounded-md"
                                disabled={item.quantity >= item.product_stock}
                                onClick={() =>
                                  handleQtyChange(
                                    item.id,
                                    item.quantity + 1,
                                    item.product_stock,
                                  )
                                }
                              >
                                <Plus className="size-3" />
                              </Button>
                              <span className="text-[10px] text-muted-foreground">
                                {item.product_weight_unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                {isWholesalePrice(item) && (
                                  <p className="text-[10px] leading-tight text-amber-600">
                                    Grosir
                                  </p>
                                )}
                                <p className="text-sm font-bold text-cengkeh-brown">
                                  {formatRupiah(getItemTotal(item))}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatRupiah(getUnitPrice(item))}/
                                  {item.product_weight_unit}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover/cart-item:opacity-100 hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Shipping method */}
                    <Card className="p-4">
                      <CardContent className="p-0 space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-cengkeh-brown">
                          <Truck className="size-4" />
                          Metode Pengiriman — {group.seller.name}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setShippingMethods((p) => ({
                                ...p,
                                [group.seller.id]: "ambil_sendiri",
                              }))
                            }
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                              getShippingMethod(group.seller.id) ===
                              "ambil_sendiri"
                                ? "border-cengkeh-brown bg-cengkeh-brown/10 text-cengkeh-brown font-medium"
                                : "border-muted bg-background text-muted-foreground hover:border-cengkeh-brown/40"
                            }`}
                          >
                            <span className="font-semibold">Ambil Sendiri</span>
                            <span className="text-[10px]">Gratis • Rp 0</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShippingMethods((p) => ({
                                ...p,
                                [group.seller.id]: "antarkan",
                              }))
                            }
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                              getShippingMethod(group.seller.id) === "antarkan"
                                ? "border-cengkeh-brown bg-cengkeh-brown/10 text-cengkeh-brown font-medium"
                                : "border-muted bg-background text-muted-foreground hover:border-cengkeh-brown/40"
                            }`}
                          >
                            <span className="font-semibold">Antarkan</span>
                            <span className="text-[10px]">
                              {formatRupiah(
                                calcShippingCost(
                                  sellerTotalWeightKg(group),
                                  "antarkan",
                                ),
                              )}
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Berat: {sellerTotalWeightKg(group).toFixed(2)} kg
                          </span>
                          <span className="font-semibold text-cengkeh-brown">
                            Ongkir: {formatRupiah(shipCost)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Ringkasan checkout */}
            <Card className="h-fit p-4 lg:sticky lg:top-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base text-cengkeh-brown">
                  Ringkasan Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                {sellerGroups.map((group) => {
                  const sub = sellerSubtotal(group);
                  const ship = calcShippingCost(
                    sellerTotalWeightKg(group),
                    getShippingMethod(group.seller.id),
                  );
                  return (
                    <div key={group.seller.id} className="space-y-1">
                      <p className="text-xs font-semibold text-cengkeh-brown">
                        {group.seller.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatRupiah(sub)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ongkir</span>
                        <span>{formatRupiah(ship)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-cengkeh-brown">
                        <span>Total Toko</span>
                        <span>{formatRupiah(sub + ship)}</span>
                      </div>
                    </div>
                  );
                })}
                <Separator />
                {selectedAddress && (
                  <div className="rounded-lg bg-cengkeh-brown/5 p-2 text-xs">
                    <p className="font-medium text-cengkeh-brown">
                      <MapPin className="size-3 inline mr-1" />
                      Dikirim ke:
                    </p>
                    <p className="text-muted-foreground truncate">
                      {selectedAddress.recipient_name} —{" "}
                      {selectedAddress.address}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-cengkeh-brown">
                    Grand Total
                  </span>
                  <span className="text-lg font-bold text-cengkeh-brown">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
                <AppButton
                  className="mt-2 flex justify-center font-semibold w-full gap-2"
                  disabled={!selectedAddressId || paying}
                  onClick={handleCheckout}
                >
                  {paying ? "Memproses..." : "Lanjutkan ke Pembayaran"}
                  <ChevronRight className="size-4" />
                </AppButton>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Ticket,
  X,
  Loader2,
  CheckSquare,
  Square,
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

const SHIPPING_RATE_PER_KG = 0;
const MIN_SHIPPING = 0;

function calcShippingCost(
  totalWeightKg: number,
  method: ShippingMethod,
): number {
  return 0;
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
  const [payingSellerId, setPayingSellerId] = useState<number | null>(null);

  const qtyTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Voucher states — per toko
  type SellerVoucher = {
    code: string;
    discount: number;
    label: string | null;
    error: string | null;
  };
  const [vouchersBySeller, setVouchersBySeller] = useState<
    Record<number, SellerVoucher>
  >({});
  const [applyingVoucherSellerId, setApplyingVoucherSellerId] = useState<
    number | null
  >(null);

  const getSellerVoucher = (sellerId: number): SellerVoucher =>
    vouchersBySeller[sellerId] ?? {
      code: "",
      discount: 0,
      label: null,
      error: null,
    };

  const updateSellerVoucher = (
    sellerId: number,
    patch: Partial<SellerVoucher>,
  ) => {
    setVouchersBySeller((prev) => {
      const cur = prev[sellerId] ?? {
        code: "",
        discount: 0,
        label: null,
        error: null,
      };
      return { ...prev, [sellerId]: { ...cur, ...patch } };
    });
  };

  // Selection state — pilih produk yang akan di-checkout
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set(),
  );

  // ---- Selection toggle helpers ----
  const toggleItemSelection = useCallback((itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleSellerSelection = useCallback(
    (sellerId: number) => {
      setSelectedItemIds((prev) => {
        const sellerItemIds = items
          .filter((item) => item.seller_id === sellerId)
          .map((item) => item.id);
        const allSelected = sellerItemIds.every((id) => prev.has(id));
        const next = new Set(prev);
        if (allSelected) {
          for (const id of sellerItemIds) next.delete(id);
        } else {
          for (const id of sellerItemIds) next.add(id);
        }
        return next;
      });
    },
    [items],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedItemIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  // Xendit: no Snap.js needed — redirect to invoice URL

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

  // Auto-select all items on first load
  useEffect(() => {
    if (items.length > 0 && selectedItemIds.size === 0) {
      setSelectedItemIds(new Set(items.map((item) => item.id)));
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---- Filtered helpers (for selected items only) ----
  const getSelectedItems = useCallback(
    (groupItems: ChartItem[]) =>
      groupItems.filter((item) => selectedItemIds.has(item.id)),
    [selectedItemIds],
  );

  const selectedSellerTotalWeightKg = useCallback(
    (group: { seller: { id: number }; items: ChartItem[] }) => {
      const sel = getSelectedItems(group.items);
      return sel.reduce((sum, i) => sum + itemToKg(i), 0);
    },
    [getSelectedItems],
  );

  const isWholesalePrice = (item: ChartItem) =>
    item.product_wholesale_price != null &&
    item.product_wholesale_qty != null &&
    item.product_wholesale_price > 0 &&
    item.product_wholesale_qty > 0 &&
    item.quantity >= item.product_wholesale_qty;

  const selectedSellerSubtotal = useCallback(
    (group: { seller: { id: number }; items: ChartItem[] }) => {
      const sel = getSelectedItems(group.items);
      return sel.reduce((sum, i) => {
        const up = isWholesalePrice(i)
          ? i.product_wholesale_price!
          : i.product_price;
        return sum + up * i.quantity;
      }, 0);
    },
    [getSelectedItems],
  );

  const sellerTotalWeightKg = (group: { items: ChartItem[] }) =>
    group.items.reduce((sum, i) => sum + itemToKg(i), 0);

  const sellerSubtotal = (group: { items: ChartItem[] }) =>
    group.items.reduce((sum, i) => {
      const up = isWholesalePrice(i)
        ? i.product_wholesale_price!
        : i.product_price;
      return sum + up * i.quantity;
    }, 0);

  const selectedCount = selectedItemIds.size;

  // ---- Voucher Handler (per toko) ----
  async function handleApplyVoucher(sellerId: number) {
    const group = sellerGroups.find((g) => g.seller.id === sellerId);
    if (!group) return;
    const v = getSellerVoucher(sellerId);
    if (!v.code.trim()) return;
    setApplyingVoucherSellerId(sellerId);
    updateSellerVoucher(sellerId, { error: null });
    try {
      const subtotal = selectedSellerSubtotal(group);
      const totalWeightKg = selectedSellerTotalWeightKg(group);
      const { data } = await axios.post("/api/vouchers/apply", {
        code: v.code.trim(),
        seller_id: sellerId,
        subtotal,
        total_weight_kg: totalWeightKg,
      });
      if (data.valid) {
        updateSellerVoucher(sellerId, {
          discount: data.discount_amount,
          label: `Voucher ${data.voucher.code}`,
        });
      } else {
        updateSellerVoucher(sellerId, {
          error: data.message,
          discount: 0,
          label: null,
        });
      }
    } catch {
      updateSellerVoucher(sellerId, { error: "Gagal memvalidasi voucher." });
    } finally {
      setApplyingVoucherSellerId(null);
    }
  }

  function clearSellerVoucher(sellerId: number) {
    updateSellerVoucher(sellerId, {
      code: "",
      discount: 0,
      label: null,
      error: null,
    });
  }

  // ---- Persist quantity to API ----
  async function persistQty(itemId: number, quantity: number) {
    try {
      await axios.patch(`/api/chart-items/${itemId}`, { quantity });
    } catch {
      toast.error("Gagal memperbarui jumlah");
      fetchAll();
    }
  }

  function updateQtyAndDebounce(itemId: number, newQty: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)),
    );

    if (qtyTimerRef.current[itemId]) clearTimeout(qtyTimerRef.current[itemId]);
    qtyTimerRef.current[itemId] = setTimeout(() => {
      persistQty(itemId, newQty);
    }, 800);
  }

  function handleQtyInput(itemId: number, raw: string, max: number) {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: 0 } : i)),
      );
      return;
    }

    const num = Number(digits);

    if (num < 1) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: 1 } : i)),
      );
      return;
    }

    if (num > max) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: max } : i)),
      );
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: num } : i)),
    );

    if (qtyTimerRef.current[itemId]) clearTimeout(qtyTimerRef.current[itemId]);
    qtyTimerRef.current[itemId] = setTimeout(() => {
      persistQty(itemId, num);
    }, 800);
  }

  function handleQtyBlur(itemId: number, max: number) {
    if (qtyTimerRef.current[itemId]) clearTimeout(qtyTimerRef.current[itemId]);

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    let qty = item.quantity;
    if (qty < 1) qty = 1;
    if (qty > max) qty = max;

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
    );
    persistQty(itemId, qty);
  }

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

  async function handleCheckout(sellerId: number) {
    if (!selectedAddressId) {
      toast.error("Pilih alamat tujuan terlebih dahulu.");
      return;
    }
    const group = sellerGroups.find((g) => g.seller.id === sellerId);
    if (!group) return;
    const selItems = getSelectedItems(group.items);
    if (selItems.length === 0) {
      toast.error("Pilih minimal 1 produk untuk di-checkout.");
      return;
    }
    setPayingSellerId(sellerId);
    try {
      const weight = selectedSellerTotalWeightKg(group);
      const method = getShippingMethod(sellerId);
      const shippingPerSeller = {
        [sellerId]: {
          method,
          cost: calcShippingCost(weight, method),
        },
      };
      const v = getSellerVoucher(sellerId);

      const res = await axios.post("/api/payment", {
        shipping_per_seller: shippingPerSeller,
        address_id: selectedAddressId,
        voucher_code: v.label ? v.code.trim() : undefined,
        chart_item_ids: selItems.map((i) => i.id),
      });
      const { invoice_url } = res.data;

      if (invoice_url) {
        toast.success("Membuka halaman pembayaran...");
        window.open(invoice_url, "_blank");
        router.push("/dashboard/order-list");
      } else {
        toast.error("Gagal mendapatkan URL pembayaran.");
      }
    } catch (error) {
      console.error("🔥 PAYMENT ERROR:", error);
      let message = "Gagal memproses pembayaran";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data === "string") {
          message = `Server error (${error.response?.status}): ${data.substring(0, 200)}`;
        } else if (data?.message) {
          message = data.message;
        } else {
          message = `HTTP ${error.response?.status}: ${error.message}`;
        }
      }
      toast.error(message);
    } finally {
      setPayingSellerId(null);
    }
  }

  async function handleDelete(itemId: number) {
    try {
      const res = await axios.delete(`/api/chart-items/${itemId}`);
      toast.success(res.data?.message || "Item dihapus!");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (error) {
      let message = "Gagal menghapus item";
      if (axios.isAxiosError(error))
        message = error.response?.data?.message || message;
      toast.error(message);
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
          {selectedCount}/{items.length} dipilih
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
          {/* Select All Bar */}
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-cengkeh-brown hover:text-cengkeh-brown/70 transition-colors"
              >
                {selectedCount === items.length ? (
                  <CheckSquare className="size-5" />
                ) : (
                  <Square className="size-5" />
                )}
                <span className="font-medium">
                  {selectedCount === items.length
                    ? "Batalkan Semua"
                    : "Pilih Semua"}
                </span>
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedCount} dari {items.length} produk dipilih
              </span>
            </div>
          </Card>

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
                const allSellerItemIds = group.items.map((i) => i.id);
                const allSellerSelected = allSellerItemIds.every((id) =>
                  selectedItemIds.has(id),
                );
                const selWeight = selectedSellerTotalWeightKg(group);
                const shipCost =
                  selWeight > 0
                    ? calcShippingCost(
                        selWeight,
                        getShippingMethod(group.seller.id),
                      )
                    : 0;
                return (
                  <div key={group.seller.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSellerSelection(group.seller.id)}
                        className="flex items-center shrink-0"
                      >
                        {allSellerSelected ? (
                          <CheckSquare className="size-4 text-cengkeh-brown" />
                        ) : (
                          <Square className="size-4 text-cengkeh-brown/40" />
                        )}
                      </button>
                      <Store className="size-4 text-cengkeh-brown" />
                      <Link
                        href={`/store/${group.seller.id}`}
                        className="text-sm font-semibold text-cengkeh-brown hover:underline"
                      >
                        {group.seller.name}
                      </Link>
                    </div>
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground -mt-2 ml-8">
                      <MapPin className="size-3 mt-0.5 shrink-0" />
                      {group.seller.address}
                    </p>

                    {group.items.map((item) => {
                      const isSelected = selectedItemIds.has(item.id);
                      return (
                        <Card
                          key={item.id}
                          className={`group/cart-item flex flex-col gap-3 sm:flex-row p-4 transition-opacity ${!isSelected ? "opacity-50" : ""}`}
                        >
                          {/* Checkbox */}
                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleItemSelection(item.id)}
                              className="flex items-center"
                            >
                              {isSelected ? (
                                <CheckSquare className="size-5 text-cengkeh-brown" />
                              ) : (
                                <Square className="size-5 text-cengkeh-brown/30" />
                              )}
                            </button>
                          </div>
                          {item.product_image_url?.[0]?.secure_url && (
                            <img
                              src={item.product_image_url?.[0]?.secure_url}
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
                                  onClick={() => {
                                    const newQty = item.quantity - 1;
                                    if (newQty < 1) return;
                                    updateQtyAndDebounce(item.id, newQty);
                                  }}
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    item.quantity === 0
                                      ? ""
                                      : String(item.quantity)
                                  }
                                  onChange={(e) =>
                                    handleQtyInput(
                                      item.id,
                                      e.target.value,
                                      item.product_stock,
                                    )
                                  }
                                  onBlur={() =>
                                    handleQtyBlur(item.id, item.product_stock)
                                  }
                                  className="h-8 w-20 text-center text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  className="size-7 rounded-md"
                                  disabled={
                                    item.quantity + 1 > item.product_stock
                                  }
                                  onClick={() => {
                                    const newQty = item.quantity + 1;
                                    if (newQty > item.product_stock) return;
                                    updateQtyAndDebounce(item.id, newQty);
                                  }}
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
                      );
                    })}

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
                              Biaya pengiriman dibayar oleh pembeli saat barang
                              tiba
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Berat terpilih: {selWeight.toFixed(0)} kg
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Ringkasan checkout per toko */}
            <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
              {sellerGroups.map((group) => {
                const selItems = getSelectedItems(group.items);
                if (selItems.length === 0) return null;
                const selSub = selectedSellerSubtotal(group);
                const selW = selectedSellerTotalWeightKg(group);
                const shipCost = calcShippingCost(
                  selW,
                  getShippingMethod(group.seller.id),
                );
                const v = getSellerVoucher(group.seller.id);
                const storeTotal = Math.max(0, selSub + shipCost - v.discount);
                const isPayingThisStore = payingSellerId === group.seller.id;
                return (
                  <Card key={group.seller.id} className="p-4">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-cengkeh-brown">
                        <Store className="size-4" />
                        {group.seller.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-0">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-cengkeh-brown/70">
                            Subtotal ({selItems.length} item)
                          </span>
                          <span className="font-medium text-cengkeh-brown">
                            {formatRupiah(selSub)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-cengkeh-brown/70">
                            Pengiriman
                          </span>
                          <span className="font-medium text-cengkeh-brown">
                            {formatRupiah(shipCost)}
                          </span>
                        </div>
                        {v.discount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700">
                              Diskon Voucher
                            </span>
                            <span className="font-medium text-green-700">
                              -{formatRupiah(v.discount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Separator />
                      {v.label ? (
                        <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 p-2 text-xs">
                          <span className="text-green-700 font-medium">
                            ✅ {v.label} — Diskon {formatRupiah(v.discount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => clearSellerVoucher(group.seller.id)}
                            className="text-green-600 hover:text-red-600"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={v.code}
                            onChange={(e) =>
                              updateSellerVoucher(group.seller.id, {
                                code: e.target.value.toUpperCase(),
                                error: null,
                              })
                            }
                            placeholder="Masukkan kode voucher"
                            className="h-9 text-xs font-mono"
                            maxLength={20}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              handleApplyVoucher(group.seller.id)
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs text-cengkeh-brown"
                            disabled={
                              !v.code.trim() ||
                              applyingVoucherSellerId === group.seller.id
                            }
                            onClick={() => handleApplyVoucher(group.seller.id)}
                          >
                            {applyingVoucherSellerId === group.seller.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Pakai"
                            )}
                          </Button>
                        </div>
                      )}
                      {v.error && (
                        <p className="text-[11px] text-red-600">{v.error}</p>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cengkeh-brown">
                          Total Toko
                        </span>
                        <span className="text-lg font-bold text-cengkeh-brown">
                          {formatRupiah(storeTotal)}
                        </span>
                      </div>

                      <AppButton
                        className="mt-1 flex justify-center font-semibold w-full gap-2"
                        disabled={payingSellerId !== null}
                        onClick={() => handleCheckout(group.seller.id)}
                      >
                        {isPayingThisStore
                          ? "Memproses..."
                          : "Checkout Toko Ini"}
                        <ChevronRight className="size-4" />
                      </AppButton>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Alamat tujuan */}
              {selectedAddress ? (
                <div className="rounded-lg bg-cengkeh-brown/5 p-3 text-xs">
                  <p className="font-medium text-cengkeh-brown">
                    <MapPin className="size-3 inline mr-1" />
                    Dikirim ke:
                  </p>
                  <p className="text-muted-foreground truncate">
                    {selectedAddress.recipient_name} —{" "}
                    {selectedAddress.address}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  ⚠️ Belum pilih alamat tujuan.{" "}
                  <a
                    href="/dashboard/addresses/add"
                    className="underline font-medium"
                  >
                    Tambah alamat dulu
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

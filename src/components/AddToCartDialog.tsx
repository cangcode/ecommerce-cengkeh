"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import { Minus, Plus, ShoppingBasket, Tags, Weight } from "lucide-react";

export type ProductForCart = {
  id: number;
  seller_id?: number;
  title: string;
  slug: string;
  price: number;
  wholesale_price: number | null;
  wholesale_qty: number | null;
  weight_unit: "gram" | "kg";
  stock: number;
  description: string;
  image_url: { public_id: string; secure_url: string }[];
  business_name?: string | null;
};

type Props = {
  product: ProductForCart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddToCartDialog({ product, open, onOpenChange }: Props) {
  const [qty, setQty] = useState(1);
  const [isWholesale, setIsWholesale] = useState(false);

  const [adding, setAdding] = useState(false);

  // Reset state saat produk berubah
  const handleOpenChange = (next: boolean) => {
    if (next && product) {
      setQty(1);
      setIsWholesale(false);
      setAdding(false);
    }
    onOpenChange(next);
  };

  if (!product) return null;

  const unit = product.weight_unit;
  const hasWholesale =
    product.wholesale_price != null &&
    product.wholesale_qty != null &&
    product.wholesale_price > 0 &&
    product.wholesale_qty > 0;

  // Jika pilih grosir & qty masih di bawah minimum, auto-naikkan
  const displayQty =
    isWholesale && hasWholesale ? Math.max(qty, product.wholesale_qty!) : qty;

  const unitPrice =
    isWholesale && hasWholesale ? product.wholesale_price! : product.price;
  const totalPrice = unitPrice * displayQty;

  const maxStock = product.stock;

  const decrement = () => {
    const min = isWholesale && hasWholesale ? product.wholesale_qty! : 1;
    setQty((prev) => Math.max(prev - 1, min));
  };
  const increment = () => {
    setQty((prev) => Math.min(prev + 1, maxStock));
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      const res = await axios.post("/api/chart-items", {
        product_id: product.id,
        quantity: displayQty,
      });
      toast.success(
        res.data?.message || `${product.title} ditambahkan ke keranjang!`,
      );
      onOpenChange(false);
    } catch (error) {
      let message = "Gagal menambahkan ke keranjang";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg text-cengkeh-brown">
            Masukkan ke Keranjang
          </DialogTitle>
          <DialogDescription>
            Pilih opsi pembelian sebelum menambahkan.
          </DialogDescription>
        </DialogHeader>

        {/* Info produk */}
        <div className="flex gap-3 items-start">
          {product.image_url[0]?.secure_url && (
            <img
              src={product.image_url[0].secure_url}
              alt={product.title}
              className="size-16 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-cengkeh-brown truncate">
              {product.title}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
            <Badge className="text-[10px] px-1.5 py-0">
              Stok {product.stock} {unit}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Opsi harga */}
        {hasWholesale && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-cengkeh-brown">
              <Tags className="size-3.5 inline mr-1" />
              Jenis Harga
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsWholesale(false);
                  if (qty < 1) setQty(1);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  !isWholesale
                    ? "border-cengkeh-brown bg-cengkeh-brown/10 text-cengkeh-brown font-medium"
                    : "border-muted bg-background text-muted-foreground hover:border-cengkeh-brown/40"
                }`}
              >
                <span className="font-semibold">
                  {formatRupiah(product.price)}
                </span>
                <span className="text-[10px]">per {unit}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWholesale(true);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  isWholesale
                    ? "border-cengkeh-brown bg-cengkeh-brown/10 text-cengkeh-brown font-medium"
                    : "border-muted bg-background text-muted-foreground hover:border-cengkeh-brown/40"
                }`}
              >
                <span className="font-semibold">
                  {formatRupiah(product.wholesale_price!)}
                </span>
                <span className="text-[10px]">
                  min {product.wholesale_qty} {unit}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Kuantitas */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-cengkeh-brown">
            <Weight className="size-3.5 inline mr-1" />
            Jumlah ({unit})
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={decrement}
              disabled={
                displayQty <=
                (isWholesale && hasWholesale ? product.wholesale_qty! : 1)
              }
              className="size-8 rounded-md"
            >
              <Minus className="size-3.5" />
            </Button>
            <Input
              type="number"
              min={isWholesale && hasWholesale ? product.wholesale_qty! : 1}
              max={maxStock}
              value={displayQty}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!isNaN(v)) {
                  const min =
                    isWholesale && hasWholesale ? product.wholesale_qty! : 1;
                  setQty(Math.min(Math.max(v, min), maxStock));
                }
              }}
              className="h-9 w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={increment}
              disabled={displayQty >= maxStock}
              className="size-8 rounded-md"
            >
              <Plus className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              x {formatRupiah(unitPrice)}/{unit}
            </span>
          </div>
          {isWholesale &&
            hasWholesale &&
            displayQty < product.wholesale_qty! && (
              <p className="text-[10px] text-amber-600">
                Minimal {product.wholesale_qty} {unit} untuk harga grosir
              </p>
            )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-cengkeh-brown">
            Total
          </span>
          <span className="text-lg font-bold text-cengkeh-brown">
            {formatRupiah(totalPrice)}
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full gap-2 bg-cengkeh-brown hover:bg-cengkeh-brown/90"
          >
            <ShoppingBasket className="size-4" />
            {adding ? "Menambahkan..." : "Tambah ke Keranjang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

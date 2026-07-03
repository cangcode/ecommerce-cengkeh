"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { ShoppingBasket } from "lucide-react";
import {
  AddToCartDialog,
  type ProductForCart,
} from "@/components/AddToCartDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StoreProductCardProps = {
  product: ProductForCart;
};

export function StoreProductCard({ product }: StoreProductCardProps) {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellerInfoOpen, setSellerInfoOpen] = useState(false);

  return (
    <>
      <Card className="relative mx-auto w-full max-w-sm py-0 overflow-hidden">
        <img
          src={product.image_url[0]?.secure_url}
          alt={product.title}
          className="relative z-20 aspect-video w-full object-cover"
        />
        <CardHeader className="p-3 md:px-3 space-y-1.5">
          <CardTitle className="text-sm sm:text-base leading-tight line-clamp-1">
            {product.title}
          </CardTitle>
          {product.description && (
            <CardDescription className="text-[10px] sm:text-xs line-clamp-2">
              {product.description}
            </CardDescription>
          )}
          <div className="flex gap-1.5 pt-1.5 flex-wrap">
            <Badge className="text-[10px] sm:text-xs px-1.5 py-0">
              {formatRupiah(product.price)}
            </Badge>
            <span className="text-[10px] sm:text-xs text-cengkeh-brown/60 self-center">
              /
            </span>
            <Badge className="text-[10px] sm:text-xs px-1.5 py-0">
              {product.weight_unit}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex xs:flex-row justify-between items-start xs:items-center gap-2 p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="text-[11px] sm:text-sm text-cengkeh-darker-brown">
            stok:{" "}
            <span className="font-bold">
              {product.stock}&nbsp;
              {product.weight_unit}
            </span>
          </div>
          {session?.user?.role === "penjual" ? (
            <Button
              size="icon-sm"
              className="size-7 sm:size-8"
              onClick={() => setSellerInfoOpen(true)}
            >
              <ShoppingBasket className="size-3.5 sm:size-4" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              className="size-7 sm:size-8"
              onClick={() => setDialogOpen(true)}
            >
              <ShoppingBasket className="size-3.5 sm:size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <AddToCartDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <Dialog open={sellerInfoOpen} onOpenChange={setSellerInfoOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Login sebagai Pembeli
            </DialogTitle>
            <DialogDescription>
              Untuk membeli produk, kamu harus login menggunakan akun{" "}
              <span className="font-semibold text-foreground">pembeli</span>.
              Silakan daftar akun baru atau login dengan akun pembeli.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-cengkeh-brown hover:bg-cengkeh-brown/90"
              asChild
            >
              <Link href="/register">Daftar sebagai Pembeli</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Login sebagai Pembeli</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

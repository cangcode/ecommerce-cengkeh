"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

type Props = {
  product: ProductForCart;
};

export function ProductDetailClient({ product }: Props) {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellerInfoOpen, setSellerInfoOpen] = useState(false);

  return (
    <>
      {session?.user?.role === "penjual" || session?.user?.role === "admin" ? (
        session?.user?.role === "penjual" ? (
          <Button
            size="sm"
            className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
            onClick={() => setSellerInfoOpen(true)}
          >
            <ShoppingBasket className="size-4 mr-1.5" />
            Tambah ke Keranjang
          </Button>
        ) : null
      ) : (
        <Button
          size="sm"
          className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
          onClick={() => setDialogOpen(true)}
        >
          <ShoppingBasket className="size-4 mr-1.5" />
          Tambah ke Keranjang
        </Button>
      )}

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

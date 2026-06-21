"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAllProducts } from "@/db/data/products/product.actions";
import { formatRupiah } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBasket,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AddToCartDialog,
  type ProductForCart,
} from "@/components/AddToCartDialog";

type Product = ProductForCart;

export default function ProductList() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellerInfoOpen, setSellerInfoOpen] = useState(false);

  useEffect(() => {
    getAllProducts({ search, page }).then((result) => {
      setData(result as Product[]);
    });
  }, [search, page]);

  return (
    <div className="space-y-5 px-8 py-8 xl:px-70">
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-3xl">Semua Produk</h1>
        <p className="text-xs text-cengkeh-brown">
          Cari produk yang kamu butuhkan di sini..
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-cengkeh-darker-brown">
            Cari Produk
          </p>
          <p className="text-xs text-cengkeh-brown/70">
            Ketik nama produk, hasil akan terfilter otomatis.
          </p>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cengkeh-brown/50" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari produk..."
            className="h-10 rounded-full border-cengkeh-brown/15 bg-white pl-10"
          />
        </div>
      </div>

      {/* List produk */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {data.map((product) => (
          <Card
            className="relative mx-auto w-full max-w-sm py-0 overflow-hidden"
            key={product.id}
          >
            <img
              src={product.image_url[0]?.secure_url}
              alt={product.title}
              className="relative z-20 aspect-video w-full object-cover"
            />
            <CardHeader className="p-3 md:px-3 space-y-1.5">
              {product.business_name && (
                <Link
                  href={`/store/${product.seller_id}`}
                  className="text-[10px] sm:text-[11px] text-cengkeh-brown font-medium truncate flex items-center hover:underline"
                >
                  <Store className="size-3.5 shrink-0" /> &nbsp;
                  {product.business_name}
                </Link>
              )}
              <CardTitle className="text-sm sm:text-base leading-tight line-clamp-1 text-cengkeh-brown">
                {product.title}
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs line-clamp-2">
                {product.description}
              </CardDescription>
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
                  onClick={() => {
                    setSelectedProduct(product);
                    setDialogOpen(true);
                  }}
                >
                  <ShoppingBasket className="size-3.5 sm:size-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-cengkeh-brown/10 bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-cengkeh-brown/80">
          Halaman aktif:{" "}
          <span className="font-semibold text-cengkeh-darker-brown">
            {page}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
            className="rounded-full"
          >
            <ChevronLeft className="size-4" />
            Sebelumnya
          </Button>

          <Badge variant="outline" className="h-8 rounded-full px-3 text-sm">
            {page}
          </Badge>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.length < 10}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="rounded-full"
          >
            Berikutnya
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <AddToCartDialog
        product={selectedProduct}
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
    </div>
  );
}

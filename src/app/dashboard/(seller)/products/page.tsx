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
import {
  deleteSellerProduct,
  getProducts,
} from "@/db/data/products/product.actions";
import { formatRupiah } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PenBox, Search, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  title: string;
  slug: string;
  price: number;
  stock: number;
  weight_unit: string;
  description: string;
  image_url: {
    public_id: string;
    secure_url: string;
  }[];
};

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Product[]>([]);
  const { data: session } = useSession();

  // Otomatis fetch ulang tiap search atau page berubah
  useEffect(() => {
    if (!session?.user?.seller_id) return;
    getProducts({ search, page, seller_id: session?.user.seller_id }).then(
      (result) => {
        setData(result as Product[]);
      },
    );
  }, [search, page, session?.user?.seller_id]);

  return (
    <div className="space-y-5 px-8 py-8 md:px-14">
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-3xl">Semua Product</h1>
        <p className="text-xs text-cengkeh-brown">
          Cari produk jualan anda disini..
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
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
        {data.map((product) => (
          <Card
            className="relative mx-auto w-full max-w-sm py-0 overflow-hidden"
            key={product.id}
          >
            <img
              src={
                product.image_url?.[0]?.secure_url ||
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e0d8'/%3E%3Cg transform='translate(140,90)'%3E%3Crect x='10' y='40' width='100' height='70' rx='4' fill='%23c4b5a5' stroke='%23a8947a' stroke-width='2'/%3E%3Cpath d='M10 40 L60 5 L110 40' fill='%23b8a088' stroke='%23a8947a' stroke-width='2' stroke-linejoin='round'/%3E%3Crect x='50' y='55' width='20' height='55' rx='2' fill='%23a8947a'/%3E%3Ccircle cx='60' cy='68' r='3' fill='%23d4c5b5'/%3E%3C/g%3E%3Ctext x='200' y='230' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23a8947a'%3ENo Image Available%3C/text%3E%3C/svg%3E"
              }
              alt={product.title}
              className="relative z-20 aspect-video w-full object-cover group-hover/product-card:opacity-90 transition-opacity"
            />
            <CardHeader className="p-3 md:px-3 space-y-1.5">
              <CardTitle className="text-sm sm:text-base leading-tight line-clamp-1">
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
                stock:{" "}
                <span className="font-bold">
                  {product.stock}&nbsp;
                  {product.weight_unit}
                </span>
              </div>
              <div className="flex gap-1.5 self-end xs:self-auto">
                <Button size="icon-sm" className="size-7 sm:size-8" asChild>
                  <Link href={`/dashboard/products/${product.slug}/edit`}>
                    <PenBox className="size-3.5 sm:size-4" />
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  className="size-7 sm:size-8"
                  onClick={async () => {
                    if (!confirm("Hapus produk ini?")) return;
                    const sellerId = session!.user.seller_id;
                    if (sellerId == null) return;
                    await deleteSellerProduct(product.slug, sellerId);
                    setData((prev) => prev.filter((p) => p.id !== product.id));
                  }}
                >
                  <Trash className="size-3.5 sm:size-4" />
                </Button>
              </div>
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
    </div>
  );
}

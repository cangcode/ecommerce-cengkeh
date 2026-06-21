"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFeaturedProducts } from "@/db/data/products/product.actions";
import { formatRupiah } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Store } from "lucide-react";

type FeaturedProduct = {
  id: number;
  seller_id: number;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  weight_unit: "gram" | "kg";
  stock: number;
  sold_count: number;
  image_url: { public_id: string; secure_url: string }[];
  business_name: string | null;
};

const FeaturedProducts = () => {
  const router = useRouter();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    getFeaturedProducts(8).then((data) =>
      setProducts(data as FeaturedProduct[]),
    );
  }, []);

  return (
    <section className="w-full px-6 py-20 xl:px-70">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-4 text-sm font-medium text-cengkeh-brown bg-cengkeh-beige/50 rounded-full border border-cengkeh-brown/10">
          <Sparkles className="size-3.5" />
          Produk Unggulan
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-cengkeh-brown">
          Pilihan Terbaik dari{" "}
          <span className="text-cengkeh-darker-brown">Enrekang</span>
        </h2>
        <p className="mt-3 text-sm md:text-base text-cengkeh-brown/60 max-w-lg mx-auto">
          Cengkeh berkualitas yang paling banyak diminati pembeli
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => router.push("/product")}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push("/product");
            }}
          >
            <Card className="relative mx-auto w-full py-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
              <img
                src={
                  product.image_url?.[0]?.secure_url || "/placeholder-clove.jpg"
                }
                alt={product.title}
                className="aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.sold_count > 0 && (
                <span className="absolute top-2 left-2 z-20 bg-cengkeh-brown/80 text-cengkeh-beige text-[10px] px-2 py-0.5 rounded-full">
                  🔥 {product.sold_count} terjual
                </span>
              )}
              <CardHeader className="p-3 md:px-3 space-y-1.5">
                {product.business_name && (
                  <Link
                    href={`/store/${product.seller_id}`}
                    onClick={(e) => e.stopPropagation()}
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
              <div className="flex items-center justify-between p-3 sm:px-6 pt-0">
                <div className="text-[11px] sm:text-sm text-cengkeh-darker-brown">
                  stok:{" "}
                  <span className="font-bold">
                    {product.stock} {product.weight_unit}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {product.sold_count} terjual
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* CTA bawah */}
      <div className="text-center mt-10">
        <Link
          href="/product"
          className="inline-block text-sm font-medium text-cengkeh-brown hover:text-cengkeh-darker-brown underline underline-offset-4 transition-colors"
        >
          Lihat Semua Produk →
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;

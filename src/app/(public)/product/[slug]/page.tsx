import { getProductBySlug } from "@/db/data/products/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import {
  Store,
  Tag,
  Weight,
  TrendingUp,
  Users,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductImageGallery } from "@/components/ProductImageGallery";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isWholesale =
    product.wholesale_price != null &&
    product.wholesale_qty != null &&
    product.wholesale_price > 0 &&
    product.wholesale_qty > 0;

  const productForCart = {
    id: product.id,
    seller_id: product.seller_id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    wholesale_price: product.wholesale_price,
    wholesale_qty: product.wholesale_qty,
    weight_unit: product.weight_unit,
    stock: product.stock,
    description: product.description ?? "",
    image_url: product.image_url,
  };

  return (
    <div className="space-y-6 px-4 py-8 md:px-10 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/product"
          className="hover:text-cengkeh-brown transition-colors"
        >
          Produk
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-cengkeh-brown font-medium truncate">
          {product.title}
        </span>
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gambar */}
        <ProductImageGallery
          image_url={product.image_url}
          title={product.title}
        />

        {/* Info */}
        <div className="space-y-4">
          {/* Toko */}
          <Link
            href={`/store/${product.seller_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-cengkeh-brown hover:underline font-medium"
          >
            <Store className="size-4" />
            Toko
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-cengkeh-brown leading-tight">
              {product.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Harga */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-cengkeh-brown" />
              <span className="text-sm font-medium text-cengkeh-brown">
                Harga
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cengkeh-brown">
                {formatRupiah(product.price)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {product.weight_unit}
              </span>
            </div>
            {isWholesale && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-300 gap-1 text-xs">
                Grosir: {formatRupiah(product.wholesale_price!)}/
                {product.weight_unit} (min. {product.wholesale_qty}{" "}
                {product.weight_unit})
              </Badge>
            )}
          </div>

          <Separator />

          {/* Info detail */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Weight className="size-4 text-cengkeh-brown/60" />
              <div>
                <p className="text-xs text-muted-foreground">Satuan</p>
                <p className="font-medium text-cengkeh-brown capitalize">
                  {product.weight_unit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-cengkeh-brown/60" />
              <div>
                <p className="text-xs text-muted-foreground">Stok</p>
                <p className="font-medium text-cengkeh-brown">
                  {product.stock} {product.weight_unit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-cengkeh-brown/60" />
              <div>
                <p className="text-xs text-muted-foreground">Terjual</p>
                <p className="font-medium text-cengkeh-brown">
                  {product.sold_count}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-cengkeh-brown/60" />
              <div>
                <p className="text-xs text-muted-foreground">Pembeli</p>
                <p className="font-medium text-cengkeh-brown">
                  {product.buyer_count}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tombol Tambah ke Keranjang (client component) */}
          <ProductDetailClient product={productForCart} />
        </div>
      </div>
    </div>
  );
}

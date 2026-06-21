import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { MapPin, Store, Flame, MessageCircle } from "lucide-react";
import {
  getSellerProfileById,
  getProductsBySellerId,
  getBestSellersBySellerId,
} from "@/db/data/seller-profiles/seller-profiles.action";
import { getDistrictName } from "@/db/data/districts/districts.action";
import { getVillageName } from "@/db/data/villages/villages.action";

type Props = {
  params: Promise<{ seller_id: string }>;
};

export default async function StorePage({ params }: Props) {
  const { seller_id } = await params;
  const sellerId = Number(seller_id);

  if (!sellerId || isNaN(sellerId)) notFound();

  const [profile, items, bestSellers] = await Promise.all([
    getSellerProfileById(sellerId),
    getProductsBySellerId(sellerId),
    getBestSellersBySellerId(sellerId),
  ]);

  if (!profile) notFound();

  const districtName =
    (await getDistrictName(profile.district_id)) ?? profile.district_id;
  const villageName =
    (await getVillageName(profile.village_id)) ?? profile.village_id;

  return (
    <div className="space-y-6 px-8 py-8 xl:px-70">
      {/* Header toko */}
      <div className="rounded-2xl border border-cengkeh-brown/20 bg-cengkeh-beige p-6 shadow-sm">
        <div className="flex md:items-center flex-col md:flex-row justify-between gap-5 md:gap-3 mb-4">
          <div className="flex gap-5 md:gap-10">
            <div className="flex size-14 items-center justify-center rounded-full bg-cengkeh-brown/10 shrink-0">
              <Store className="size-7 text-cengkeh-brown" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-cengkeh-brown">
                {profile.business_name}
              </h1>
              {profile.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {profile.description}
                </p>
              )}
            </div>
          </div>
          {profile.phone && (
            <Link
              href={`https://wa.me/62${profile.phone.replace(/^0/, "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mb-5 w-fit md:mb-0 shrink-0 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="size-4" />
              Chat via WhatsApp
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cengkeh-brown/15 px-3 py-1">
            <MapPin className="size-3 text-cengkeh-brown/70" />
            {profile.business_address}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cengkeh-brown/15 px-3 py-1">
            {districtName} • {villageName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cengkeh-brown/15 px-3 py-1">
            {items.length} produk
          </span>
        </div>
      </div>

      {/* Produk Terlaris */}
      {bestSellers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-cengkeh-brown" />
            <h2 className="font-heading text-lg font-semibold text-cengkeh-brown">
              Produk Terlaris
            </h2>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
            {bestSellers.map((product) => (
              <Card
                key={product.id}
                className="relative mx-auto w-full max-w-sm py-0 overflow-hidden"
              >
                <img
                  src={product.image_url[0]?.secure_url}
                  alt={product.title}
                  className="relative z-20 aspect-video w-full object-cover"
                />
                <CardHeader className="p-3 md:px-3 space-y-1.5">
                  <CardTitle className="text-sm sm:text-base leading-tight line-clamp-1">
                    {product.title}
                  </CardTitle>
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
                  <div className="text-[10px] sm:text-xs font-semibold text-cengkeh-brown">
                    &nbsp;{product.sold_count} terjual
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Semua Produk */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-cengkeh-brown">
          Semua Produk
        </h2>
        {items.length === 0 ? (
          <Card className="border-dashed bg-background/80">
            <CardHeader className="text-center">
              <CardTitle className="text-base text-muted-foreground">
                Toko ini belum memiliki produk.
              </CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
            {items.map((product) => (
              <Card
                key={product.id}
                className="relative mx-auto w-full max-w-sm py-0 overflow-hidden"
              >
                <img
                  src={product.image_url[0]?.secure_url}
                  alt={product.title}
                  className="relative z-20 aspect-video w-full object-cover"
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

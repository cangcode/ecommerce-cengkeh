"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getShippingPrice, updateShippingPrice } from "./actions";
import { formatRupiah } from "@/lib/utils";
import { Truck, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function ShippingRatesPage() {
  const { data: session } = useSession();
  const [pricePerKg, setPricePerKg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const price = await getShippingPrice(session.user.id);
        setPricePerKg(String(price));
      } catch {
        toast.error("Gagal memuat data ongkir");
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) return;

    const priceNum = Number(pricePerKg);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Harga harus angka (boleh 0 = gratis)");
      return;
    }

    setSaving(true);
    try {
      await updateShippingPrice(session.user.id, priceNum);
      toast.success("Ongkir per kg berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan ongkir");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8">
        <Loader2 className="size-6 animate-spin text-cengkeh-brown" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "penjual") return null;

  return (
    <div className="space-y-5 px-4 py-8 md:px-10 max-w-xl">
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-3xl">Atur Ongkir</h1>
        <p className="text-xs text-cengkeh-brown">
          Tentukan harga ongkir per kg untuk pengiriman ke pembeli.
        </p>
      </div>

      <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cengkeh-brown/10">
            <Truck className="size-6 text-cengkeh-brown" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cengkeh-darker-brown">
              Biaya Pengiriman per Kilogram
            </p>
            <p className="text-xs text-cengkeh-brown/70">
              Harga ini akan dikalikan dengan total berat (kg) produk yang
              dipesan pembeli. Isi 0 jika ongkir gratis.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-cengkeh-brown">
            Harga per kg (Rp)
          </label>
          <Input
            type="number"
            placeholder="Contoh: 12000"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            className="border-cengkeh-brown/20"
            min="0"
          />
          {pricePerKg && !isNaN(Number(pricePerKg)) && (
            <p className="text-xs text-cengkeh-brown/70">
              Berarti: Rp {formatRupiah(Number(pricePerKg))} untuk setiap 1 kg.
            </p>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            <Save className="size-4 mr-1" />
          )}
          Simpan Ongkir
        </Button>
      </div>
    </div>
  );
}

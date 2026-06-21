"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Rocket,
  ShoppingCart,
  MapPinned,
  CreditCard,
  Package2,
  Store,
  Truck,
  Home,
} from "lucide-react";

const STORAGE_KEY = "announcement_seen_version";
const UPDATE_VERSION = 3;

const features = [
  {
    icon: Home,
    title: "Homepage Interaktif",
    description:
      "homepage sekarang tidak kosong lagi kaya hatimu, sudah ada isinyaaa...",
  },
  {
    icon: Store,
    title: "Dashboard Penjual Lengkap",
    description:
      "Statistik toko real-time — total produk, stok rendah, produk terbaru.",
  },
  {
    icon: ShoppingCart,
    title: "Keranjang & Checkout",
    description:
      "Tambah produk ke keranjang, pilih harga grosir/satuan, atur jumlah.",
  },
  {
    icon: Truck,
    title: "Ongkir Per Toko",
    description:
      "Metode Ambil Sendiri (gratis) atau Antarkan (Rp 15.000/kg), otomatis dihitung per toko.",
  },
  {
    icon: MapPinned,
    title: "Alamat Pengiriman",
    description:
      "Simpan & kelola banyak alamat, atur alamat utama, pilih kecamatan/desa.",
  },
  {
    icon: CreditCard,
    title: "Pembayaran Midtrans",
    description:
      "Checkout aman via Snap Midtrans — transfer bank, QRIS, e-wallet, dan lainnya.",
  },
  {
    icon: Package2,
    title: "Riwayat Pesanan",
    description:
      "Pantau status pesanan, lihat detail per toko, bayar ulang jika pending.",
  },
];

export default function AnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (Number(seenVersion) !== UPDATE_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(UPDATE_VERSION));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md gap-0 p-0 overflow-hidden rounded-2xl"
      >
        {/* Header with gradient */}
        <div className="bg-cengkeh-brown px-6 p-5 text-white">
          <div className="size-12 rounded-full bg-white/15 flex items-center justify-center mb-4">
            <Rocket className="size-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Update Terbaru! versi {UPDATE_VERSION}.0 🎉
          </DialogTitle>
          <DialogDescription className="text-amber-100/80 text-sm mt-1.5">
            Berikut adalah list fitur atau update terbaru dari project ini..
          </DialogDescription>
        </div>

        {/* Features list — scrollable */}
        <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-3.5 p-3.5 rounded-xl bg-cengkeh-beige/30 border border-cengkeh-beige-100"
            >
              <div className="size-9 rounded-lg bg-cengkeh-beige flex items-center justify-center shrink-0">
                <feature.icon className="size-5 text-cengkeh-brown" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-cengkeh-brown">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-0 sm:justify-between flex-row">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Nanti Saja
          </Button>
          <Button
            size="sm"
            onClick={handleDismiss}
            className="bg-cengkeh-brown hover:bg-cengkeh-brown/90 text-white cursor-pointer"
          >
            Mulai Jelajahi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

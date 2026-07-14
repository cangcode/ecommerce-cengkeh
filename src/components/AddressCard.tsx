"use client";

import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, MapPin, Phone, User, Star, Pencil } from "lucide-react";

type AddressCardProps = {
  addr: {
    id: number;
    recipient_name: string;
    phone: string;
    address: string;
    district_name: string | null;
    district_id: string;
    village_name: string | null;
    village_id: string;
    is_default: boolean;
  };
};

export function AddressCard({ addr }: AddressCardProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/addresses/${addr.id}`);
      toast.success(res.data?.message || "Alamat berhasil dihapus!");
      router.refresh();
    } catch (error) {
      let message = "Gagal menghapus alamat";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="group/card relative bg-background">
      {/* Tombol edit — hanya tampil saat hover */}
      <button
        type="button"
        onClick={() => router.push(`/dashboard/addresses/edit/${addr.id}`)}
        className="absolute bottom-3 right-13 z-10 flex size-8 items-center justify-center rounded-md bg-cengkeh-brown/10 text-cengkeh-brown opacity-0 transition-opacity cursor-pointer hover:bg-cengkeh-brown/20 group-hover/card:opacity-100"
        aria-label="Edit alamat"
      >
        <Pencil className="size-4" />
      </button>

      {/* Tombol delete — hanya tampil saat hover */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="absolute bottom-3 right-3 z-10 flex size-8 items-center justify-center rounded-md bg-destructive/10 text-destructive opacity-0 transition-opacity cursor-pointer hover:bg-destructive/15 group-hover/card:opacity-100 disabled:pointer-events-none"
        aria-label="Hapus alamat"
      >
        <Trash2 className="size-4" />
      </button>

      {addr.is_default && (
        <Badge
          variant="default"
          className="absolute top-3 right-3 gap-1 bg-cengkeh-brown text-cengkeh-beige hover:bg-cengkeh-brown/90"
        >
          <Star className="size-3 fill-cengkeh-beige" />
          Utama
        </Badge>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-cengkeh-brown">
          <User className="size-4" />
          {addr.recipient_name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Phone className="size-3" />
          {addr.phone}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-cengkeh-brown/70" />
          <span>{addr.address}</span>
        </p>
        <p className="text-xs text-cengkeh-brown/60">
          {addr.district_name ?? `Kec ID: ${addr.district_id}`} •{" "}
          {addr.village_name ?? `Desa ID: ${addr.village_id}`}
        </p>
      </CardContent>
    </Card>
  );
}

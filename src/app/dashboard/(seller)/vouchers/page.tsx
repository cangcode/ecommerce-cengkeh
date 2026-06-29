"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import {
  Ticket,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Clock,
  Loader2,
} from "lucide-react";
import type { VoucherRow } from "@/db/data/vouchers/voucher.actions";
import axios from "axios";
import { toast } from "sonner";

export default function SellerVouchersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "fixed" as "fixed" | "percent",
    discount_value: "",
    min_purchase: "0",
    max_discount: "",
    usage_limit: "1",
    expires_at: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!session?.user?.seller_id) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/api/vouchers");
      if (data.success) setVouchers(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.user?.seller_id]);

  useEffect(() => {
    if (status === "authenticated") fetchVouchers();
  }, [status, fetchVouchers]);

  const handleCreate = async () => {
    if (form.code.length < 3) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_purchase: Number(form.min_purchase) || 0,
        max_discount:
          form.discount_type === "percent" && form.max_discount
            ? Number(form.max_discount)
            : undefined,
        usage_limit: Number(form.usage_limit) || 1,
        expires_at: form.expires_at || undefined,
      };
      await axios.post("/api/vouchers", payload);
      toast.success("Voucher berhasil dibuat!");
      setDialogOpen(false);
      setForm({
        code: "",
        discount_type: "fixed",
        discount_value: "",
        min_purchase: "0",
        max_discount: "",
        usage_limit: "1",
        expires_at: "",
      });
      fetchVouchers();
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message || "Gagal membuat voucher";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v: VoucherRow) => {
    try {
      await axios.patch(`/api/vouchers/${v.id}`);
      fetchVouchers();
      toast.success(v.is_active ? "Voucher dinonaktifkan." : "Voucher diaktifkan.");
    } catch {
      toast.error("Gagal mengubah status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus voucher ini?")) return;
    try {
      await axios.delete(`/api/vouchers/${id}`);
      toast.success("Voucher dihapus.");
      fetchVouchers();
    } catch {
      toast.error("Gagal menghapus voucher.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode disalin!");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8">
        <Loader2 className="size-5 animate-spin text-cengkeh-brown/50" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const isExpired = (v: VoucherRow) =>
    v.expires_at && new Date(v.expires_at) < new Date();

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-cengkeh-brown font-bold text-3xl">
            Voucher Diskon
          </h1>
          <p className="text-xs text-cengkeh-brown">
            Buat dan kelola voucher diskon untuk pembeli Anda.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
          size="sm"
        >
          <Plus className="size-4 mr-1" />
          Buat Voucher
        </Button>
      </div>

      {/* Voucher List */}
      {vouchers.length === 0 ? (
        <Card className="border-dashed bg-background/80">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground">
              <Ticket className="size-5 text-cengkeh-brown/40" />
              Belum ada voucher
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Buat voucher pertama Anda untuk memberikan diskon ke pembeli.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((v) => {
            const expired = isExpired(v);
            const depleted = v.used_count >= v.usage_limit;
            const label =
              !v.is_active
                ? "🔴 Nonaktif"
                : expired
                  ? "⏰ Kadaluarsa"
                  : depleted
                    ? "✅ Habis"
                    : "🟢 Aktif";
            const labelClass =
              !v.is_active || expired || depleted
                ? "bg-muted text-muted-foreground"
                : "bg-green-50 text-green-700 border-green-300";

            return (
              <Card key={v.id} className={!v.is_active || expired ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="size-5 text-cengkeh-brown" />
                      <CardTitle className="text-lg font-mono text-cengkeh-brown tracking-wider">
                        {v.code}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${labelClass}`}>
                      {label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Detail diskon */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className="text-xs bg-cengkeh-beige/30">
                      {v.discount_type === "fixed"
                        ? `Potongan ${formatRupiah(v.discount_value)}`
                        : `Diskon ${v.discount_value}%`}
                    </Badge>
                    {v.min_purchase > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Min. {formatRupiah(v.min_purchase)}
                      </Badge>
                    )}
                    {v.discount_type === "percent" && v.max_discount && (
                      <Badge variant="outline" className="text-xs">
                        Maks. {formatRupiah(v.max_discount)}
                      </Badge>
                    )}
                  </div>

                  {/* Usage */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Dipakai: {v.used_count}/{v.usage_limit}
                    </span>
                    {v.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(v.expires_at).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => copyCode(v.code)}
                    >
                      <Copy className="size-3 mr-1" />
                      Salin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => handleToggle(v)}
                    >
                      {v.is_active ? (
                        <ToggleRight className="size-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Buat Voucher */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Buat Voucher Baru
            </DialogTitle>
            <DialogDescription>
              Voucher bisa dibagikan ke pembeli untuk potongan harga.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Kode */}
            <div className="space-y-1">
              <Label className="text-xs">Kode Voucher</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="cth: DISC10"
                className="font-mono"
                maxLength={20}
              />
            </div>

            {/* Tipe + Nilai */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipe Diskon</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) =>
                    setForm({ ...form, discount_type: v as "fixed" | "percent" })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Potongan (Rp)</SelectItem>
                    <SelectItem value="percent">Persen (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {form.discount_type === "fixed" ? "Potongan (Rp)" : "Diskon (%)"}
                </Label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                  placeholder={form.discount_type === "fixed" ? "5000" : "10"}
                  min={1}
                />
              </div>
            </div>

            {/* Min purchase & Max discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min. Pembelian (Rp)</Label>
                <Input
                  type="number"
                  value={form.min_purchase}
                  onChange={(e) =>
                    setForm({ ...form, min_purchase: e.target.value })
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              {form.discount_type === "percent" && (
                <div className="space-y-1">
                  <Label className="text-xs">Maks. Diskon (Rp)</Label>
                  <Input
                    type="number"
                    value={form.max_discount}
                    onChange={(e) =>
                      setForm({ ...form, max_discount: e.target.value })
                    }
                    placeholder="Tanpa batas"
                    min={0}
                  />
                </div>
              )}
            </div>

            {/* Limit & Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Batas Pemakaian</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) =>
                    setForm({ ...form, usage_limit: e.target.value })
                  }
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kadaluarsa (opsional)</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={form.code.length < 3 || !form.discount_value || saving}
              className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
              onClick={handleCreate}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Buat Voucher"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

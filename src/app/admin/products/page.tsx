"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import type { AdminProductRow } from "@/db/data/products/admin-product.actions";
import axios from "axios";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    seller_id: "",
    slug: "",
    title: "",
    description: "",
    price: "",
    wholesale_price: "",
    wholesale_qty: "",
    weight_unit: "gram" as "gram" | "kg",
    stock: "",
    image_url_json: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/products", {
        params: { search: search || undefined },
      });
      if (data.success) setItems(data.data);
    } catch {
      toast.error("Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status, fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      seller_id: "",
      slug: "",
      title: "",
      description: "",
      price: "",
      wholesale_price: "",
      wholesale_qty: "",
      weight_unit: "gram",
      stock: "",
      image_url_json: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (p: AdminProductRow) => {
    setEditingId(p.id);
    setForm({
      seller_id: String(p.seller_id),
      slug: p.slug,
      title: p.title,
      description: p.description ?? "",
      price: String(p.price),
      wholesale_price:
        p.wholesale_price != null ? String(p.wholesale_price) : "",
      wholesale_qty: p.wholesale_qty != null ? String(p.wholesale_qty) : "",
      weight_unit: p.weight_unit,
      stock: String(p.stock),
      image_url_json: JSON.stringify(p.image_url),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.seller_id ||
      !form.slug ||
      !form.title ||
      !form.description ||
      !form.price ||
      !form.stock
    )
      return;
    setSaving(true);
    try {
      let image_url: { public_id: string; secure_url: string }[] = [];
      try {
        image_url = JSON.parse(form.image_url_json || "[]");
      } catch {
        image_url = [];
      }

      const payload = {
        seller_id: Number(form.seller_id),
        slug: form.slug,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        wholesale_price: form.wholesale_price
          ? Number(form.wholesale_price)
          : undefined,
        wholesale_qty: form.wholesale_qty
          ? Number(form.wholesale_qty)
          : undefined,
        weight_unit: form.weight_unit,
        stock: Number(form.stock),
        image_url,
      };

      if (editingId) {
        await axios.patch("/api/admin/products", {
          id: editingId,
          ...payload,
          wholesale_price: form.wholesale_price
            ? Number(form.wholesale_price)
            : null,
          wholesale_qty: form.wholesale_qty ? Number(form.wholesale_qty) : null,
        });
        toast.success("Produk diperbarui.");
      } else {
        await axios.post("/api/admin/products", payload);
        toast.success("Produk ditambahkan.");
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Gagal menyimpan.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await axios.put("/api/admin/products", { id });
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)),
      );
      toast.success("Status diubah.");
    } catch {
      toast.error("Gagal mengubah status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try {
      await axios.delete("/api/admin/products", { data: { id } });
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success("Produk dihapus.");
    } catch {
      toast.error("Gagal menghapus.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-cengkeh-brown/50" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    router.push("/admin/login");
    return null;
  }

  const activeCount = items.filter((p) => p.is_active).length;
  const inactiveCount = items.filter((p) => !p.is_active).length;

  return (
    <div className="space-y-5 px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-cengkeh-brown font-bold text-2xl">
            Kelola Produk
          </h1>
          <p className="text-xs text-muted-foreground">
            Atur semua produk yang ada di platform.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
        >
          <Plus className="size-4 mr-1" />
          Tambah Produk
        </Button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total",
            count: items.length,
            color: "bg-cengkeh-brown/10 text-cengkeh-brown",
          },
          {
            label: "Aktif",
            count: activeCount,
            color: "bg-green-100 text-green-700",
          },
          {
            label: "Nonaktif",
            count: inactiveCount,
            color: "bg-muted text-muted-foreground",
          },
        ].map((s) => (
          <Card key={s.label} className="border-cengkeh-brown/10 bg-white">
            <div className="flex items-center gap-3 p-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${s.color}`}
              >
                <span className="text-sm font-bold">{s.count}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cengkeh-brown/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="h-10 rounded-lg border-cengkeh-brown/15 bg-white pl-10 text-sm"
        />
      </div>

      {/* table */}
      <Card className="border-cengkeh-brown/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cengkeh-brown/10 bg-cengkeh-beige/30 text-left">
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Produk
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Penjual
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Harga
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Stok
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Terjual
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="size-8 text-cengkeh-brown/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tidak ada produk ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-cengkeh-brown/5 hover:bg-cengkeh-beige/20 transition-colors ${!p.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image_url?.[0]?.secure_url ? (
                          <img
                            src={p.image_url[0].secure_url}
                            alt={p.title}
                            className="size-8 rounded object-cover"
                          />
                        ) : (
                          <div className="size-8 rounded bg-cengkeh-beige/40 flex items-center justify-center">
                            <ImageIcon className="size-4 text-cengkeh-brown/30" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cengkeh-brown text-xs line-clamp-1 max-w-40">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.business_name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-cengkeh-brown font-medium text-xs">
                      Rp {p.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.stock}</td>
                    <td className="px-4 py-3 text-xs">{p.sold_count}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 h-5 ${p.is_active ? "bg-green-50 text-green-700 border-green-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleToggle(p.id)}
                          title="Toggle status"
                        >
                          {p.is_active ? (
                            <ToggleRight className="size-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* dialog create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              {editingId ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              Produk akan ditampilkan di halaman publik dan dashboard penjual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Seller ID</Label>
                <Input
                  value={form.seller_id}
                  onChange={(e) =>
                    setForm({ ...form, seller_id: e.target.value })
                  }
                  placeholder="1"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="produk-cengkeh-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Judul Produk</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Cengkeh Kering Premium"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Deskripsi produk..."
                className="resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Harga (Rp)</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="50000"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga Grosir</Label>
                <Input
                  value={form.wholesale_price}
                  onChange={(e) =>
                    setForm({ ...form, wholesale_price: e.target.value })
                  }
                  placeholder="45000"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min. Qty Grosir</Label>
                <Input
                  value={form.wholesale_qty}
                  onChange={(e) =>
                    setForm({ ...form, wholesale_qty: e.target.value })
                  }
                  placeholder="10"
                  type="number"
                />
              </div>
            </div>
            {!editingId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Satuan Berat</Label>
                  <Select
                    value={form.weight_unit}
                    onValueChange={(v) =>
                      setForm({ ...form, weight_unit: v as "gram" | "kg" })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gram">Gram</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stok</Label>
                  <Input
                    value={form.stock}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = raw.replace(/\D/g, "");
                      setForm({ ...form, stock: digits });
                    }}
                    placeholder="100"
                    type="text"
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}
            {editingId && (
              <div className="space-y-1">
                <Label className="text-xs">Stok</Label>
                <Input
                  value={form.stock}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/\D/g, "");
                    setForm({ ...form, stock: digits });
                  }}
                  placeholder="100"
                  type="text"
                  inputMode="numeric"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">
                Gambar (JSON array:
                [&#123;"public_id":"...","secure_url":"..."&#125;])
              </Label>
              <Textarea
                value={form.image_url_json}
                onChange={(e) =>
                  setForm({ ...form, image_url_json: e.target.value })
                }
                placeholder='[{"public_id":"x","secure_url":"https://..."}]'
                className="resize-none h-16 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={
                !form.seller_id ||
                !form.slug ||
                !form.title ||
                !form.description ||
                !form.price ||
                !form.stock ||
                saving
              }
              className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
              onClick={handleSave}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : editingId ? (
                "Simpan"
              ) : (
                "Tambah"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

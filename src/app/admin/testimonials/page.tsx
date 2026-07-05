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
  MessageSquare,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
} from "lucide-react";
import type { TestimonialRow } from "@/db/data/testimonials/testimonial.actions";
import axios from "axios";
import { toast } from "sonner";

export default function AdminTestimonialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    quote: "",
    rating: "5" as string,
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/testimonials");
      if (data.success) setItems(data.data);
    } catch {
      toast.error("Gagal memuat testimoni.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status, fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", role: "", quote: "", rating: "5" });
    setDialogOpen(true);
  };

  const openEdit = (t: TestimonialRow) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      role: t.role,
      quote: t.quote,
      rating: String(t.rating),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role || form.quote.length < 10) return;
    setSaving(true);
    try {
      if (editingId) {
        await axios.patch("/api/admin/testimonials", {
          id: editingId,
          ...form,
          rating: Number(form.rating),
        });
        toast.success("Testimoni diperbarui.");
      } else {
        await axios.post("/api/admin/testimonials", {
          ...form,
          rating: Number(form.rating),
        });
        toast.success("Testimoni ditambahkan.");
      }
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await axios.put("/api/admin/testimonials", { id });
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !t.is_active } : t)),
      );
      toast.success("Status diubah.");
    } catch {
      toast.error("Gagal mengubah status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus testimoni ini?")) return;
    try {
      await axios.delete("/api/admin/testimonials", { data: { id } });
      setItems((prev) => prev.filter((t) => t.id !== id));
      toast.success("Testimoni dihapus.");
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

  return (
    <div className="space-y-5 px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-cengkeh-brown font-bold text-2xl">
            Kelola Testimoni
          </h1>
          <p className="text-xs text-muted-foreground">
            Atur testimoni yang tampil di halaman utama.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
        >
          <Plus className="size-4 mr-1" />
          Tambah
        </Button>
      </div>

      <Card className="border-cengkeh-brown/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cengkeh-brown/10 bg-cengkeh-beige/30 text-left">
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Nama
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Role
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Quote
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Rating
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
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <MessageSquare className="size-8 text-cengkeh-brown/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada testimoni.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-cengkeh-brown/5 hover:bg-cengkeh-beige/20 transition-colors ${!t.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-cengkeh-brown">
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {t.role}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-60 truncate">
                      &ldquo;{t.quote}&rdquo;
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${i < t.rating ? "fill-cengkeh-brown text-cengkeh-brown" : "text-cengkeh-brown/20"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 h-5 ${t.is_active ? "bg-green-50 text-green-700 border-green-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {t.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleToggle(t.id)}
                          title="Toggle"
                        >
                          {t.is_active ? (
                            <ToggleRight className="size-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(t.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              {editingId ? "Edit Testimoni" : "Tambah Testimoni"}
            </DialogTitle>
            <DialogDescription>
              Testimoni akan tampil di halaman utama website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="cth: Pak Rahman"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role / Jabatan</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="cth: Pedagang Pasar Enrekang"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quote (min. 10 karakter)</Label>
              <Textarea
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                placeholder="Tulis testimoni..."
                className="resize-none h-20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rating (1-5)</Label>
              <Select
                value={form.rating}
                onValueChange={(v) => setForm({ ...form, rating: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {"⭐".repeat(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={
                !form.name || !form.role || form.quote.length < 10 || saving
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

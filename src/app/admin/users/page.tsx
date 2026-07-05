"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Loader2,
  Shield,
  ShoppingBag,
  Store,
  Check,
  X,
  Ban,
  Key,
} from "lucide-react";
import type { AdminUserRow } from "@/db/data/users/users.actions";
import axios from "axios";
import { toast } from "sonner";

const ROLE_BADGE: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  admin: {
    label: "Admin",
    className: "bg-red-50 text-red-700 border-red-300",
    icon: <Shield className="size-3" />,
  },
  pembeli: {
    label: "Pembeli",
    className: "bg-green-50 text-green-700 border-green-300",
    icon: <ShoppingBag className="size-3" />,
  },
  penjual: {
    label: "Penjual",
    className: "bg-blue-50 text-blue-700 border-blue-300",
    icon: <Store className="size-3" />,
  },
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [resetDialog, setResetDialog] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users", {
        params: { search: search || undefined },
      });
      if (data.success) setUsers(data.data);
    } catch {
      toast.error("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (status === "authenticated") fetchUsers();
  }, [status, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await axios.patch("/api/admin/users", { userId, role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole as AdminUserRow["role"] } : u,
        ),
      );
      toast.success(`Role berhasil diubah.`);
    } catch {
      toast.error("Gagal mengubah role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    setUpdatingId(userId);
    try {
      const { data } = await axios.put("/api/admin/users", { userId });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, bannedAt: data.data.bannedAt } : u,
        ),
      );
      toast.success(
        currentlyBanned ? "User telah di-unban." : "User telah di-ban.",
      );
    } catch {
      toast.error("Gagal mengubah status ban.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetDialog || newPassword.length < 6) return;
    setResetting(true);
    try {
      await axios.post("/api/admin/users", {
        userId: resetDialog.userId,
        newPassword,
      });
      toast.success(`Password di-reset.`);
      setResetDialog(null);
      setNewPassword("");
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Gagal reset.");
    } finally {
      setResetting(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
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

  const roleCounts = {
    admin: users.filter((u) => u.role === "admin").length,
    pembeli: users.filter((u) => u.role === "pembeli").length,
    penjual: users.filter((u) => u.role === "penjual").length,
  };

  return (
    <div className="space-y-5 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-cengkeh-brown font-bold text-2xl">
          Kelola Pengguna
        </h1>
        <p className="text-xs text-muted-foreground">
          Lihat dan atur role semua pengguna platform.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Admin",
            count: roleCounts.admin,
            color: "bg-red-100 text-red-700",
          },
          {
            label: "Pembeli",
            count: roleCounts.pembeli,
            color: "bg-green-100 text-green-700",
          },
          {
            label: "Penjual",
            count: roleCounts.penjual,
            color: "bg-blue-100 text-blue-700",
          },
        ].map((s) => (
          <Card key={s.label} className="border-cengkeh-brown/10 bg-white">
            <CardContent className="flex items-center gap-3 p-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${s.color}`}
              >
                <span className="text-sm font-bold">{s.count}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cengkeh-brown/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari username atau email..."
          className="h-10 rounded-lg border-cengkeh-brown/15 bg-white pl-10 text-sm"
        />
      </div>

      <Card className="border-cengkeh-brown/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cengkeh-brown/10 bg-cengkeh-beige/30 text-left">
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Username
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Role
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Toko
                </th>
                <th className="px-4 py-3 font-semibold text-cengkeh-brown text-xs">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="size-8 text-cengkeh-brown/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tidak ada pengguna ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.pembeli;
                  const isSelf = user.id === session?.user?.id;
                  const isBanned = !!user.bannedAt;
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-cengkeh-brown/5 hover:bg-cengkeh-beige/20 transition-colors ${isBanned ? "opacity-60 bg-red-50/20" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-cengkeh-brown">
                            {user.username}
                          </span>
                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 h-4 text-muted-foreground"
                            >
                              Anda
                            </Badge>
                          )}
                          {isBanned && (
                            <Badge className="text-[9px] py-0 h-4 bg-red-100 text-red-700 border-red-300 gap-1">
                              <Ban className="size-2.5" />
                              Dibanned
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`gap-1 text-[10px] py-0 h-5 ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 h-5 ${isBanned ? "bg-red-50 text-red-700 border-red-300" : "bg-green-50 text-green-700 border-green-300"}`}
                        >
                          {isBanned ? "Dibanned" : "Aktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.hasSellerProfile ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <X className="size-4 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user.id, v)}
                            disabled={
                              updatingId === user.id || isSelf || isBanned
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-28">
                              {updatingId === user.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pembeli">Pembeli</SelectItem>
                              <SelectItem value="penjual">Penjual</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={!!updatingId || isSelf}
                            onClick={() =>
                              setResetDialog({
                                userId: user.id,
                                username: user.username,
                              })
                            }
                            title="Reset Password"
                          >
                            <Key className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className={`size-8 ${isBanned ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"}`}
                            disabled={!!updatingId || isSelf}
                            onClick={() => handleToggleBan(user.id, isBanned)}
                            title={isBanned ? "Unban" : "Ban"}
                          >
                            <Ban className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={resetDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetDialog(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-cengkeh-brown">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-sm">
              {resetDialog && (
                <>
                  Atur password baru untuk{" "}
                  <span className="font-semibold text-cengkeh-brown">
                    {resetDialog.username}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Password Baru</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              minLength={6}
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResetDialog(null);
                setNewPassword("");
              }}
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={newPassword.length < 6 || resetting}
              className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
              onClick={handleResetPassword}
            >
              {resetting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { auth } from "@/auth";
import AppButton from "@/components/AppButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPinned, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAddresses } from "@/db/data/addresses/addresses.actions";
import { AddressCard } from "@/components/AddressCard";

const Page = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "pembeli") {
    redirect("/dashboard");
  }

  const addresses = await getUserAddresses(session.user.id);

  return (
    <>
      <div className="space-y-5 px-4 py-8 md:px-10">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-cengkeh-brown font-bold text-3xl">
              Kelola alamat pengiriman
            </h1>
            <p className="text-xs text-cengkeh-brown">
              Simpan beberapa alamat untuk memudahkan checkout dan pengiriman //
              pesanan.
            </p>
          </div>
          <AppButton
            asChild
            className="inline-flex items-center gap-2 self-start h-fit md:self-auto"
          >
            <Link href="/dashboard/addresses/add">
              <Plus className="size-4" />
              Tambah Alamat
            </Link>
          </AppButton>
        </div>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-cengkeh-brown">
                Alamat saya
              </h2>
              <p className="text-sm text-muted-foreground">
                Daftar alamat yang tersimpan akan tampil disini
              </p>
            </div>
          </div>

          {addresses.length === 0 ? (
            <Card className="border-dashed bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPinned className="size-4 text-cengkeh-brown" />
                  Belum ada alamat tersimpan
                </CardTitle>
                <CardDescription>
                  Klik tombol Tambah Alamat untuk mulai menambahkan alamat
                  pengirimanmu.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Saat ini daftar alamat masih kosong.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <AddressCard key={addr.id} addr={addr} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Page;

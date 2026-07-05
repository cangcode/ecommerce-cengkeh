import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login");

  return (
    <div className="space-y-4 px-6 py-8">
      <h1 className="text-cengkeh-brown font-bold text-2xl">Kelola Produk</h1>
      <Card className="border-dashed border-cengkeh-brown/20 bg-white/50">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
            <Package className="size-4" />
            Manajemen Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur kelola produk akan ditambahkan di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

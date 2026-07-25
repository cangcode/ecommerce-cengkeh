"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import {
  getSalesReport,
  type SalesReportItem,
  type SalesReportSummary,
} from "@/db/data/sales-report/sales-report.actions";
import {
  FileText,
  Loader2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Menunggu",
    className: "border-amber-300 text-amber-700 bg-amber-50",
  },
  paid: {
    label: "Lunas",
    className: "border-green-300 text-green-700 bg-green-50",
  },
  failed: {
    label: "Gagal",
    className: "border-red-300 text-red-600 bg-red-50",
  },
  expired: {
    label: "Kadaluarsa",
    className: "border-gray-300 text-gray-500 bg-gray-50",
  },
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [items, setItems] = useState<SalesReportItem[]>([]);
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);

  const fetchReport = async () => {
    if (!session?.user?.seller_id) return;
    setLoading(true);
    try {
      const data = await getSalesReport(
        session.user.seller_id,
        dateFrom || undefined,
        dateTo || undefined,
      );
      setItems(data.items);
      setSummary(data.summary);
    } catch {
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [session?.user?.seller_id]);

  const handleFilter = () => fetchReport();

  const handleExportPDF = async () => {
    if (!summary || items.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(16);
      doc.text("Laporan Penjualan", pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Toko: ${session?.user?.name ?? "Penjual"}`, pageWidth / 2, 22, {
        align: "center",
      });
      const periodText =
        dateFrom || dateTo
          ? `Periode: ${dateFrom || "Awal"} - ${dateTo || "Sekarang"}`
          : "Periode: Semua";
      doc.text(periodText, pageWidth / 2, 28, { align: "center" });

      // Summary
      doc.setFontSize(11);
      doc.text(
        `Total Pendapatan: ${formatRupiah(summary.totalPaidRevenue)}`,
        14,
        38,
      );
      doc.text(`Total Pesanan (Lunas): ${summary.totalPaidOrders}`, 100, 38);
      doc.text(`Rata-rata: ${formatRupiah(summary.averagePerOrder)}`, 180, 38);

      // Table
      const tableData = items.map((item) => [
        item.xendit_invoice_id,
        item.buyer_name ?? "-",
        new Date(item.created_at).toLocaleDateString("id-ID"),
        item.item_count,
        formatRupiah(item.subtotal),
        formatRupiah(item.shipping_cost),
        formatRupiah(item.total),
        STATUS_CONFIG[item.status]?.label ?? item.status,
      ]);

      autoTable(doc, {
        head: [
          [
            "Invoice",
            "Pembeli",
            "Tanggal",
            "Jml Item",
            "Subtotal",
            "Ongkir",
            "Total",
            "Status",
          ],
        ],
        body: tableData,
        startY: 42,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [107, 112, 92] },
      });

      const fileName = `laporan-penjualan-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch {
      toast.error("Gagal export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (!session?.user || session.user.role !== "penjual") return null;

  return (
    <div className="space-y-5 px-4 py-8 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-cengkeh-brown font-bold text-3xl">
            Laporan Penjualan
          </h1>
          <p className="text-xs text-cengkeh-brown">
            Riwayat pembayaran dan hasil penjualan.
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting || items.length === 0}
          className="bg-cengkeh-brown hover:bg-cengkeh-darker-brown text-cengkeh-beige"
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : (
            <FileText className="size-4 mr-1" />
          )}
          Export PDF
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-cengkeh-brown">
            Dari Tanggal
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border-cengkeh-brown/20 w-full sm:w-auto"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-cengkeh-brown">
            Sampai Tanggal
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border-cengkeh-brown/20 w-full sm:w-auto"
          />
        </div>
        <Button
          onClick={handleFilter}
          variant="outline"
          className="text-cengkeh-brown border-cengkeh-brown/20"
        >
          Filter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-cengkeh-brown" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-cengkeh-brown/10 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-cengkeh-brown/60">
                  Total Pendapatan
                </CardTitle>
                <DollarSign className="size-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cengkeh-brown">
                  {formatRupiah(summary?.totalPaidRevenue ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-cengkeh-brown/10 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-cengkeh-brown/60">
                  Pesanan Lunas
                </CardTitle>
                <ShoppingBag className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cengkeh-brown">
                  {summary?.totalPaidOrders ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card className="border-cengkeh-brown/10 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-cengkeh-brown/60">
                  Rata-rata per Pesanan
                </CardTitle>
                <TrendingUp className="size-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cengkeh-brown">
                  {formatRupiah(summary?.averagePerOrder ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-cengkeh-brown/10 bg-white/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-cengkeh-brown/60">
                  Total Transaksi
                </CardTitle>
                <Package2 className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cengkeh-brown">
                  {summary?.totalOrders ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {items.length === 0 ? (
            <Card className="border-dashed bg-background/80">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground">
                  <FileText className="size-5 text-cengkeh-brown/40" />
                  Belum ada transaksi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                Transaksi yang sudah dibayar akan muncul di sini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl border border-cengkeh-brown/10 bg-white/80 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cengkeh-brown/10 text-left">
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Invoice
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Pembeli
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Tanggal
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Item
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Subtotal
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Ongkir
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Total
                    </th>
                    <th className="p-3 font-medium text-cengkeh-brown/60 text-xs">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const statusCfg =
                      STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={item.order_id}
                        className="border-b border-cengkeh-brown/5 last:border-0"
                      >
                        <td className="p-3 text-xs font-mono text-cengkeh-brown truncate max-w-32">
                          {item.xendit_invoice_id}
                        </td>
                        <td className="p-3 text-xs text-cengkeh-brown">
                          {item.buyer_name ?? "-"}
                        </td>
                        <td className="p-3 text-xs text-cengkeh-brown">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </td>
                        <td className="p-3 text-xs text-cengkeh-brown">
                          {item.item_count}
                        </td>
                        <td className="p-3 text-xs text-cengkeh-brown">
                          {formatRupiah(item.subtotal)}
                        </td>
                        <td className="p-3 text-xs text-cengkeh-brown">
                          {formatRupiah(item.shipping_cost)}
                        </td>
                        <td className="p-3 text-xs font-semibold text-cengkeh-brown">
                          {formatRupiah(item.total)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 h-5 ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

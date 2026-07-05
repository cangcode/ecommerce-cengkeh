import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmReturnArrived } from "@/db/data/orders/orders.actions";
import { coreApi } from "@/lib/midtrans";
import { db } from "@/index";
import { orders, order_items } from "@/db/schema";
import { eq } from "drizzle-orm";

/** PATCH — Penjual/Pembeli konfirmasi barang retur sudah sampai kembali → refund */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  // Boleh penjual ATAU pembeli yang login
  if (!session?.user?.id && !session?.user?.seller_id) {
    return NextResponse.json(
      {
        success: false,
        message: "Kamu harus login.",
      },
      { status: 401 },
    );
  }

  try {
    const { item_id } = await params;
    const itemId = Number(item_id);

    // Ambil data item untuk refund
    const [item] = await db
      .select({
        id: order_items.id,
        order_id: order_items.order_id,
        subtotal: order_items.subtotal,
        return_status: order_items.return_status,
      })
      .from(order_items)
      .where(
        eq(order_items.id, itemId),
      )
      .limit(1);

    if (!item || item.return_status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Retur tidak ditemukan atau belum disetujui.",
        },
        { status: 404 },
      );
    }

    // Panggil Midtrans Refund API
    if (item.subtotal > 0) {
      try {
        const [order] = await db
          .select({ midtrans_order_id: orders.midtrans_order_id })
          .from(orders)
          .where(eq(orders.id, item.order_id))
          .limit(1);

        if (order) {
          await coreApi.transaction.refund(order.midtrans_order_id, {
            amount: item.subtotal,
            reason: "Barang retur sudah kembali - pengembalian dana",
          });
        }
      } catch (refundErr) {
        console.error("⚠️ [RETURN CONFIRM] Refund API gagal:", refundErr);
        return NextResponse.json(
          {
            success: false,
            message: "Gagal memproses pengembalian dana. Silakan coba lagi.",
          },
          { status: 500 },
        );
      }
    }

    // Update status ke "refunded"
    const updated = await confirmReturnArrived(itemId);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengonfirmasi retur.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONFIRM RETURN] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal konfirmasi retur: ${msg}` },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmReturnArrived } from "@/db/data/orders/orders.actions";
import { createXenditRefund } from "@/lib/xendit";
import { db } from "@/index";
import { orders, order_items } from "@/db/schema";
import { eq } from "drizzle-orm";

/** PATCH — Penjual/Pembeli konfirmasi barang retur sudah sampai kembali → refund via Xendit */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Kamu harus login." },
      { status: 401 },
    );
  }

  try {
    const { item_id } = await params;
    const itemId = Number(item_id);

    const [item] = await db
      .select({
        id: order_items.id,
        order_id: order_items.order_id,
        subtotal: order_items.subtotal,
        return_status: order_items.return_status,
      })
      .from(order_items)
      .where(eq(order_items.id, itemId))
      .limit(1);

    if (!item || item.return_status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          message: "Retur tidak ditemukan atau belum disetujui.",
        },
        { status: 404 },
      );
    }

    // Refund via Xendit API — skip di sandbox, lakukan manual
    if (item.subtotal > 0) {
      console.log("💰 [RETURN CONFIRM] Manual refund needed:", {
        itemId: item.id,
        orderId: item.order_id,
        amount: item.subtotal,
      });
    }

    const updated = await confirmReturnArrived(itemId);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Gagal mengonfirmasi retur." },
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

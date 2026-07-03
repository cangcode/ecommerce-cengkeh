import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondCancelItem } from "@/db/data/orders/orders.actions";
import { coreApi } from "@/lib/midtrans";
import { db } from "@/index";
import { orders, order_items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

/** PATCH — Penjual menyetujui / menolak pembatalan (jika approved → refund) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.seller_id) {
    return NextResponse.json(
      {
        success: false,
        message: "Hanya penjual yang bisa menanggapi pembatalan.",
      },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const itemId = Number(item_id);
    const body = await req.json();
    const { action } = respondSchema.parse(body);

    // Jika disetujui, ambil item + order untuk refund dulu
    if (action === "approved") {
      const [item] = await db
        .select({
          id: order_items.id,
          order_id: order_items.order_id,
          subtotal: order_items.subtotal,
        })
        .from(order_items)
        .where(
          eq(order_items.id, itemId),
        )
        .limit(1);

      if (item && item.subtotal > 0) {
        try {
          const [order] = await db
            .select({ midtrans_order_id: orders.midtrans_order_id })
            .from(orders)
            .where(eq(orders.id, item.order_id))
            .limit(1);

          if (order) {
            await coreApi.transaction.refund(order.midtrans_order_id, {
              amount: item.subtotal,
              reason: "Pembatalan disetujui - pengembalian dana",
            });
          }
        } catch (refundErr) {
          console.error("⚠️ [CANCEL REFUND] Refund API gagal:", refundErr);
          return NextResponse.json(
            {
              success: false,
              message: "Gagal memproses pengembalian dana. Silakan coba lagi.",
            },
            { status: 500 },
          );
        }
      }
    }

    const updated = await respondCancelItem(
      itemId,
      session.user.seller_id,
      action,
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Pembatalan tidak ditemukan atau sudah ditanggapi.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [RESPOND CANCEL] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal menanggapi pembatalan: ${msg}` },
      { status: 500 },
    );
  }
}

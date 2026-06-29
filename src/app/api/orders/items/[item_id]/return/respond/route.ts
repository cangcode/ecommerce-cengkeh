import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondReturnItem } from "@/db/data/orders/orders.actions";
import { coreApi } from "@/lib/midtrans";
import { db } from "@/index";
import { orders, order_items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  // Opsional: jika approved, bisa trigger refund
  refund: z.boolean().optional().default(false),
});

/** PATCH — Penjual menyetujui / menolak retur */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual yang bisa menanggapi retur." },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { action, refund } = respondSchema.parse(body);

    const updated = await respondReturnItem(
      Number(item_id),
      session.user.seller_id,
      action,
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Retur tidak ditemukan atau sudah ditanggapi.",
        },
        { status: 404 },
      );
    }

    // Jika disetujui & minta refund, panggil Midtrans Refund API
    let refundResult: unknown = null;
    if (action === "approved" && refund && updated.subtotal > 0) {
      try {
        const [order] = await db
          .select({ midtrans_order_id: orders.midtrans_order_id })
          .from(orders)
          .where(eq(orders.id, updated.order_id))
          .limit(1);

        if (order) {
          const refundResponse = await coreApi.transaction.refund(
            order.midtrans_order_id,
            {
              amount: updated.subtotal,
              reason: "Retur disetujui - pengembalian dana",
            },
          );
          refundResult = refundResponse;

          // Update status ke "refunded"
          await db
            .update(order_items)
            .set({ return_status: "refunded" as const })
            .where(eq(order_items.id, updated.id));
        }
      } catch (refundErr) {
        console.error("⚠️ [RETURN] Refund API gagal:", refundErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      refund: refundResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [RESPOND RETURN] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal menanggapi retur: ${msg}` },
      { status: 500 },
    );
  }
}

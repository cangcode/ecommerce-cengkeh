import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondCancelItem } from "@/db/data/orders/orders.actions";
import { db } from "@/index";
import { orders, order_items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

/** PATCH — Penjual menyetujui / menolak pembatalan (jika approved → refund via Xendit) */
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

    if (action === "approved") {
      const [item] = await db
        .select({
          id: order_items.id,
          order_id: order_items.order_id,
          subtotal: order_items.subtotal,
        })
        .from(order_items)
        .where(eq(order_items.id, itemId))
        .limit(1);

      if (item && item.subtotal > 0) {
        console.log("💰 [CANCEL APPROVED] Manual refund needed:", {
          itemId: item.id,
          orderId: item.order_id,
          amount: item.subtotal,
        });
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

import { NextResponse } from "next/server";
import { db } from "@/index";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Manual status update — fallback jika notifikasi Midtrans terlambat.
 * Dipanggil dari `onSuccess` Snap callback.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body.order_id as string;
    const status = body.status as "paid" | "failed" | "pending";

    if (!orderId || !status) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Hanya update jika status saat ini "pending"
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.midtrans_order_id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { ok: false, message: "Order not found" },
        { status: 404 },
      );
    }

    // Jangan overwrite status yang sudah final
    if (
      order.status === "paid" ||
      order.status === "failed" ||
      order.status === "expired"
    ) {
      return NextResponse.json({ ok: true });
    }

    await db
      .update(orders)
      .set({
        status,
        paid_at: status === "paid" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(orders.midtrans_order_id, orderId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update Status Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

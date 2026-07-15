import { NextResponse } from "next/server";
import { db } from "@/index";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Xendit Invoice Callback / Webhook
 * Xendit sends POST when invoice is PAID / EXPIRED / FAILED.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Optional: verify webhook token
    const webhookToken = req.headers.get("x-callback-token");
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn("⚠️ [WEBHOOK] Invalid callback token");
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const invoiceId = body.id as string;
    const status = body.status as string; // "PAID" | "EXPIRED" | "FAILED"

    if (!invoiceId || !status) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Map Xendit status to our DB status
    let orderStatus: typeof orders.$inferSelect.status;
    if (status === "PAID") {
      orderStatus = "paid";
    } else if (status === "EXPIRED") {
      orderStatus = "expired";
    } else if (status === "FAILED") {
      orderStatus = "failed";
    } else {
      return NextResponse.json({ ok: true, message: "Unhandled status" });
    }

    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.xendit_invoice_id, invoiceId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { ok: false, message: "Order not found" },
        { status: 404 },
      );
    }

    // Don't overwrite final states
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
        status: orderStatus,
        paid_at: orderStatus === "paid" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(orders.xendit_invoice_id, invoiceId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ [WEBHOOK] Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/index";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Midtrans Notification Handler
 * Endpoint ini HARUS public (tidak pakai auth) karena dipanggil oleh server Midtrans.
 * Midtrans akan POST JSON body ke sini setiap kali status transaksi berubah.
 *
 * Kamu perlu mendaftarkan URL ini di Dashboard Midtrans:
 * Settings → Payment Notification → https://domainmu.com/api/payment/notification
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔐 Verifikasi signature key (opsional tapi sangat disarankan di production)
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";

    const statusResponse = await fetch(
      `https://api.sandbox.midtrans.com/v2/${body.order_id}/status`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
        },
      },
    );

    const verified = await statusResponse.json();

    if (verified.status_code !== "200" && verified.status_code !== "201") {
      console.error("Midtrans verification failed:", verified);
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const orderId = verified.order_id as string;
    const transactionStatus = verified.transaction_status as string;
    const fraudStatus = verified.fraud_status as string;
    const paymentType = verified.payment_type as string;

    // Tentukan status order kita
    let newStatus: "pending" | "paid" | "failed" | "expired" = "pending";

    if (transactionStatus === "capture") {
      newStatus = fraudStatus === "accept" ? "paid" : "failed";
    } else if (transactionStatus === "settlement") {
      newStatus = "paid";
    } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
      newStatus = "failed";
    } else if (transactionStatus === "expire") {
      newStatus = "expired";
    } else if (transactionStatus === "pending") {
      newStatus = "pending";
    }

    // Update order di DB
    await db
      .update(orders)
      .set({
        status: newStatus,
        payment_type: paymentType ?? null,
        paid_at: newStatus === "paid" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(orders.midtrans_order_id, orderId));

    console.log(`✅ Order ${orderId} → ${newStatus} (${paymentType})`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Midtrans Notification Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

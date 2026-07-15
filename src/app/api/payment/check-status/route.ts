import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/index";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const { invoice_id } = await req.json();

    // Fetch invoice status from Xendit
    const res = await axios.get(
      `https://api.xendit.co/v2/invoices/${invoice_id}`,
      {
        auth: {
          username: process.env.XENDIT_API_KEY ?? "",
          password: "",
        },
      },
    );

    const xenditStatus = res.data.status as string;

    // Map Xendit status to our status
    const statusMap: Record<string, string> = {
      PAID: "paid",
      EXPIRED: "expired",
      FAILED: "failed",
      PENDING: "pending",
      SETTLED: "paid",
    };

    const newStatus = statusMap[xenditStatus] ?? null;

    // Update DB if status changed
    if (newStatus && newStatus !== "pending") {
      const [order] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.xendit_invoice_id, invoice_id))
        .limit(1);

      if (order && order.status === "pending") {
        await db
          .update(orders)
          .set({
            status: newStatus as "paid" | "failed" | "expired",
            paid_at: newStatus === "paid" ? new Date() : null,
            updated_at: new Date(),
          })
          .where(eq(orders.xendit_invoice_id, invoice_id));
      }
    }

    return NextResponse.json({
      success: true,
      xendit_status: xenditStatus,
      our_status: newStatus,
    });
  } catch (error) {
    console.error("❌ [CHECK-STATUS] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

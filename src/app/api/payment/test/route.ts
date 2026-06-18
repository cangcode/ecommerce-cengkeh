import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await snap.createTransaction({
      transaction_details: {
        order_id: `TEST-${Date.now()}`,
        gross_amount: 10000,
      },
    });

    return NextResponse.json({ ok: true, token: result.token?.substring(0, 30) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const full = error instanceof Error ? error.stack : JSON.stringify(error);
    return NextResponse.json({ ok: false, error: msg, full }, { status: 500 });
  }
}

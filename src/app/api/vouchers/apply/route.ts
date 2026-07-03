import { NextResponse } from "next/server";
import { applyVoucherCode } from "@/db/data/vouchers/voucher.actions";

/** POST — Pembeli apply kode voucher, return diskon */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal, total_weight_kg } = body;

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json(
        { success: false, message: "Kode dan subtotal wajib diisi." },
        { status: 400 },
      );
    }

    const result = await applyVoucherCode(
      code,
      subtotal,
      typeof total_weight_kg === "number" ? total_weight_kg : undefined,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

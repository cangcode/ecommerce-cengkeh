import { NextResponse } from "next/server";
import { addItemToChart } from "@/db/data/charts/charts.actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json(
        { success: false, message: "product_id dan quantity wajib diisi." },
        { status: 400 },
      );
    }

    const result = await addItemToChart(Number(product_id), Number(quantity));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Chart Item API Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan item ke keranjang." },
      { status: 500 },
    );
  }
}

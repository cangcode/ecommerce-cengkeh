import { NextResponse } from "next/server";
import { createProduct } from "@/db/data/products/product.actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createProduct(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Create Product Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "gagal membuat produk. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createAddress } from "@/db/data/addresses/addresses.actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createAddress(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create Address API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal menyimpan alamat. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}

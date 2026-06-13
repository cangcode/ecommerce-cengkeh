import { NextResponse } from "next/server";
import { createSellerProfile } from "@/db/data/seller-profiles/seller-profiles.action";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createSellerProfile(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Create Seller Profile Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "gagal membuat profil penjual. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}
